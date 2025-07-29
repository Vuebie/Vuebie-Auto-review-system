import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { AlertCircle, Search, Plus, Settings, Save } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { useToast } from '@/components/ui/use-toast';
import { Skeleton } from '@/components/ui/skeleton';
import { supabase } from '@/lib/supabase';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import * as z from 'zod';

interface Setting {
  id: string;
  name: string;
  value: Record<string, unknown> | string | number | boolean;
  description: string;
  category: string;
  is_sensitive: boolean;
  created_at: string;
  updated_at: string;
  updated_by: string;
}

const settingFormSchema = z.object({
  name: z.string().min(2, { message: "Setting name must be at least 2 characters" }),
  value: z.string().min(1, { message: "Value is required" }),
  description: z.string().optional(),
  category: z.string().default("system"),
  is_sensitive: z.boolean().default(false)
});

type SettingFormValues = z.infer<typeof settingFormSchema>;

const GlobalSettings: React.FC = () => {
  const { t } = useTranslation();
  const { toast } = useToast();
  const [settings, setSettings] = useState<Setting[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [currentSetting, setCurrentSetting] = useState<Setting | null>(null);
  const [userRole, setUserRole] = useState<string | null>(null);
  
  const form = useForm<SettingFormValues>({
    resolver: zodResolver(settingFormSchema),
    defaultValues: {
      name: '',
      value: '',
      description: '',
      category: 'system',
      is_sensitive: false
    }
  });

  // Fetch user role
  const fetchUserRole = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      const { data } = await supabase
        .from('app_aa9a812f43_user_roles')
        .select('role')
        .eq('user_id', user.id)
        .single();
        
      if (data) {
        setUserRole(data.role);
      }
    }
  };

  // Fetch settings
  const fetchSettings = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Fetch settings using the edge function
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');
      
      const { data: sessionData } = await supabase.auth.getSession();
      if (!sessionData?.session) throw new Error('No active session');
      
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/app_aa9a812f43_manage_settings/settings${categoryFilter ? `?category=${categoryFilter}` : ''}`,
        {
          headers: {
            'Authorization': `Bearer ${sessionData.session.access_token}`,
            'Content-Type': 'application/json'
          }
        }
      );
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to fetch settings');
      }
      
      const data = await response.json();
      setSettings(data);
    } catch (error) {
      console.error('Error fetching settings:', error);
      setError(t('admin.errorFetchingSettings'));
      toast({
        title: t('admin.errorTitle'),
        description: t('admin.errorFetchingSettings'),
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUserRole();
  }, []);

  useEffect(() => {
    if (userRole) {
      fetchSettings();
    }
  }, [categoryFilter, userRole]);

  // Handle save setting
  const handleSaveSetting = async (values: SettingFormValues) => {
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      if (!sessionData?.session) throw new Error('No active session');
      
      // Prepare the value to be sent
      let formattedValue;
      try {
        // If the value is a valid JSON string, parse it
        formattedValue = JSON.parse(values.value);
      } catch (e) {
        // If not a valid JSON, use it as a string
        formattedValue = values.value;
      }
      
      const settingData = {
        name: values.name,
        value: formattedValue,
        description: values.description,
        category: values.category,
        is_sensitive: values.is_sensitive
      };
      
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/app_aa9a812f43_manage_settings/${values.name}`,
        {
          method: 'PUT',
          headers: {
            'Authorization': `Bearer ${sessionData.session.access_token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(settingData)
        }
      );
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to save setting');
      }
      
      toast({
        title: t('admin.success'),
        description: t('admin.settingsSaved'),
      });
      
      setIsDialogOpen(false);
      fetchSettings();
    } catch (error) {
      console.error('Error saving setting:', error);
      toast({
        title: t('admin.errorTitle'),
        description: error.message || 'Failed to save setting',
        variant: 'destructive'
      });
    }
  };

  // Handle delete setting
  const handleDeleteSetting = async (settingName: string) => {
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      if (!sessionData?.session) throw new Error('No active session');
      
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/app_aa9a812f43_manage_settings/${settingName}`,
        {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${sessionData.session.access_token}`,
            'Content-Type': 'application/json'
          }
        }
      );
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to delete setting');
      }
      
      toast({
        title: t('admin.success'),
        description: `Setting ${settingName} deleted successfully`,
      });
      
      fetchSettings();
    } catch (error) {
      console.error('Error deleting setting:', error);
      toast({
        title: t('admin.errorTitle'),
        description: error.message || 'Failed to delete setting',
        variant: 'destructive'
      });
    }
  };

  // Filter settings based on search term
  const filteredSettings = settings.filter(setting => {
    return (
      setting.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      setting.description?.toLowerCase().includes(searchTerm.toLowerCase())
    );
  });

  // Handle edit setting
  const handleEditSetting = (setting: Setting) => {
    setCurrentSetting(setting);
    setIsEditing(true);
    
    // Format the value for display
    const formattedValue = typeof setting.value === 'object' 
      ? JSON.stringify(setting.value, null, 2) 
      : String(setting.value);
      
    form.reset({
      name: setting.name,
      value: formattedValue,
      description: setting.description,
      category: setting.category,
      is_sensitive: setting.is_sensitive
    });
    
    setIsDialogOpen(true);
  };

  // Handle add new setting
  const handleAddSetting = () => {
    setCurrentSetting(null);
    setIsEditing(false);
    form.reset({
      name: '',
      value: '',
      description: '',
      category: 'system',
      is_sensitive: false
    });
    setIsDialogOpen(true);
  };

  // Categories for filter and form
  const categories = [
    { value: 'system', label: t('admin.system') },
    { value: 'ai', label: t('admin.ai') },
    { value: 'reviews', label: t('admin.reviews') },
    { value: 'security', label: t('admin.security') }
  ];

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>{t('admin.globalSettings')}</CardTitle>
          <CardDescription>{t('admin.globalSettingsDescription')}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row justify-between gap-4 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder={t('admin.searchSettings')}
                className="pl-8"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div className="flex flex-1 gap-2">
              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder={t('admin.category')} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">{t('admin.allResources')}</SelectItem>
                  {categories.map((category) => (
                    <SelectItem key={category.value} value={category.value}>{category.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {userRole === 'super_admin' && (
                <Button onClick={handleAddSetting}>
                  <Plus className="h-4 w-4 mr-2" />
                  {t('common.add')}
                </Button>
              )}
            </div>
          </div>

          {error && (
            <Alert variant="destructive" className="mb-6">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Settings Table */}
          <div className="border rounded-md">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t('admin.settingName')}</TableHead>
                  <TableHead>{t('admin.settingValue')}</TableHead>
                  <TableHead>{t('admin.category')}</TableHead>
                  <TableHead className="text-right">{t('admin.actions')}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  Array.from({ length: 5 }).map((_, index) => (
                    <TableRow key={index}>
                      <TableCell><Skeleton className="h-5 w-40" /></TableCell>
                      <TableCell><Skeleton className="h-5 w-48" /></TableCell>
                      <TableCell><Skeleton className="h-5 w-20" /></TableCell>
                      <TableCell className="text-right"><Skeleton className="h-9 w-20 ml-auto" /></TableCell>
                    </TableRow>
                  ))
                ) : filteredSettings.length > 0 ? (
                  filteredSettings.map((setting) => (
                    <TableRow key={setting.id}>
                      <TableCell>
                        <div className="font-medium">{setting.name}</div>
                        <div className="text-sm text-muted-foreground">{setting.description}</div>
                      </TableCell>
                      <TableCell className="font-mono text-sm max-w-xs truncate">
                        {typeof setting.value === 'object' 
                          ? JSON.stringify(setting.value) 
                          : String(setting.value)}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">
                          {setting.category}
                        </Badge>
                        {setting.is_sensitive && (
                          <Badge variant="outline" className="ml-2 bg-red-100 text-red-800">
                            Sensitive
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        {userRole === 'super_admin' && (
                          <div className="flex justify-end gap-2">
                            <Button variant="ghost" size="sm" onClick={() => handleEditSetting(setting)}>
                              {t('common.edit')}
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              className="text-red-600 hover:text-red-800"
                              onClick={() => {
                                if (confirm(`Are you sure you want to delete the setting "${setting.name}"?`)) {
                                  handleDeleteSetting(setting.name);
                                }
                              }}
                            >
                              {t('common.delete')}
                            </Button>
                          </div>
                        )}
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={4} className="h-32 text-center">
                      {t('admin.noSettings')}
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Add/Edit Setting Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>
              {isEditing ? t('common.edit') : t('common.add')} {t('admin.setting')}
            </DialogTitle>
            <DialogDescription>
              {isEditing 
                ? `${t('common.edit')} ${currentSetting?.name}`
                : t('admin.globalSettingsDescription')}
            </DialogDescription>
          </DialogHeader>
          
          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleSaveSetting)} className="space-y-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('admin.settingName')}</FormLabel>
                    <FormControl>
                      <Input {...field} disabled={isEditing} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="value"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('admin.settingValue')}</FormLabel>
                    <FormControl>
                      <Textarea {...field} rows={3} className="font-mono" />
                    </FormControl>
                    <FormDescription>
                      Enter a string, number, boolean, or valid JSON value.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('admin.settingDescription')}</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="category"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('admin.category')}</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a category" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {categories.map((category) => (
                          <SelectItem key={category.value} value={category.value}>
                            {category.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="is_sensitive"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
                    <div className="space-y-0.5">
                      <FormLabel>Sensitive Setting</FormLabel>
                      <FormDescription>
                        Mark this setting as sensitive to restrict access
                      </FormDescription>
                    </div>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
              
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                  {t('common.cancel')}
                </Button>
                <Button type="submit">
                  <Save className="h-4 w-4 mr-2" />
                  {t('common.save')}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default GlobalSettings;