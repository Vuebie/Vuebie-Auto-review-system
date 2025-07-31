import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { useAuth } from '@/contexts/AuthContext';
import { supabase, TABLES } from '@/lib/supabase';
import { updateProfile } from '@/lib/auth';

import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
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
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { toast } from 'sonner';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Loader2, Upload, User } from 'lucide-react';

// Define form schema
const profileFormSchema = z.object({
  business_name: z.string().min(2, {
    message: "Business name must be at least 2 characters.",
  }),
  business_description: z.string().optional(),
  contact_name: z.string().min(2, {
    message: "Contact name must be at least 2 characters.",
  }),
  phone: z.string().optional(),
  website: z.string().url({
    message: "Please enter a valid URL.",
  }).optional().or(z.literal('')),
  address: z.string().optional(),
});

type ProfileFormValues = z.infer<typeof profileFormSchema>;

export default function ProfilePage() {
  const { t } = useTranslation();
  const { user, profile, refreshUser } = useAuth();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  const form = useForm<ProfileFormValues>({
    resolver: zodResolver(profileFormSchema),
    defaultValues: {
      business_name: profile?.business_name || '',
      business_description: profile?.business_description || '',
      contact_name: profile?.contact_name || '',
      phone: profile?.phone || '',
      website: profile?.website || '',
      address: profile?.address || '',
    },
  });

  useEffect(() => {
    // Update form values when user data is loaded
    if (profile) {
      form.reset({
        business_name: profile.business_name || '',
        business_description: profile.business_description || '',
        contact_name: profile.contact_name || '',
        phone: profile.phone || '',
        website: profile.website || '',
        address: profile.address || '',
      });
    }
  }, [profile, form]);

  useEffect(() => {
    // Redirect if not logged in
    if (user === null) {
      navigate('/login');
    }
  }, [user, navigate]);

  async function onSubmit(data: ProfileFormValues) {
    if (!user?.id) return;

    setIsLoading(true);
    
    try {
      await updateProfile({
        merchantId: user.id,
        ...data
      });
      
      await refreshUser();
      toast.success(t('profile.updateSuccess'));
    } catch (error) {
      // Handle error updating profile
      toast.error(t('profile.updateError'));
    } finally {
      setIsLoading(false);
    }
  }

  async function handleAvatarUpload(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file || !user?.id) return;

    setIsUploading(true);
    
    try {
      // Validate file type and size
      if (!file.type.startsWith('image/')) {
        throw new Error(t('profile.invalidFileType'));
      }
      
      if (file.size > 5 * 1024 * 1024) { // 5MB limit
        throw new Error(t('profile.fileTooLarge'));
      }
      
      // Upload to Supabase Storage
      const filePath = `avatars/${user.id}/${Date.now()}_${file.name}`;
      const { error: uploadError } = await supabase.storage
        .from('profiles')
        .upload(filePath, file, { upsert: true });
        
      if (uploadError) throw uploadError;
      
      // Get public URL
      const { data: urlData } = supabase.storage
        .from('profiles')
        .getPublicUrl(filePath);
      
      // Update profile with new avatar URL
      const { error: updateError } = await supabase
        .from(TABLES.MERCHANT_PROFILES)
        .update({ 
          logo_url: urlData.publicUrl,
          updated_at: new Date().toISOString()
        })
        .eq('merchant_id', user.id);
        
      if (updateError) throw updateError;
      
      await refreshUser();
      toast.success(t('profile.avatarUpdateSuccess'));
    } catch (error) {
      // Handle error uploading avatar
      toast.error(t('profile.avatarUpdateError'));
    } finally {
      setIsUploading(false);
    }
  }

  if (!user?.user) {
    return (
      <DashboardLayout>
        <div className="flex justify-center items-center h-[60vh]">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout
      title={t('profile.title')}
      description={t('profile.description')}
    >
      <Tabs defaultValue="general">
        <TabsList>
          <TabsTrigger value="general">{t('profile.tabs.general')}</TabsTrigger>
          <TabsTrigger value="business">{t('profile.tabs.business')}</TabsTrigger>
          <TabsTrigger value="security">{t('profile.tabs.security')}</TabsTrigger>
        </TabsList>
        
        <div className="mt-6 space-y-8">
          <TabsContent value="general">
            <Card>
              <CardHeader>
                <CardTitle>{t('profile.personalInfo')}</CardTitle>
                <CardDescription>{t('profile.personalInfoDescription')}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-8">
                {/* Avatar Upload */}
                <div className="flex flex-col items-center sm:flex-row sm:items-start gap-6">
                  <div className="flex flex-col items-center gap-2">
                    <Avatar className="h-24 w-24">
                      <AvatarImage 
                        src={profile?.logo_url || undefined} 
                        alt={profile?.business_name || 'Avatar'} 
                      />
                      <AvatarFallback className="text-2xl">
                        {profile?.business_name?.charAt(0) || <User />}
                      </AvatarFallback>
                    </Avatar>
                    
                    <div className="relative">
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="relative"
                        disabled={isUploading}
                      >
                        {isUploading ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            {t('profile.uploading')}
                          </>
                        ) : (
                          <>
                            <Upload className="mr-2 h-4 w-4" />
                            {t('profile.uploadAvatar')}
                          </>
                        )}
                      </Button>
                      <input 
                        type="file"
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                        onChange={handleAvatarUpload}
                        accept="image/*"
                        disabled={isUploading}
                      />
                    </div>
                  </div>
                  
                  <div className="space-y-2 text-center sm:text-left">
                    <h3 className="font-semibold text-lg">
                      {profile?.business_name || user?.email}
                    </h3>
                    <div className="text-muted-foreground">
                      <p>{user?.email}</p>
                      {profile?.phone && (
                        <p>{profile.phone}</p>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {t('profile.accountCreated')}: {user?.created_at ? new Date(user.created_at).toLocaleDateString() : ''}
                    </p>
                  </div>
                </div>
                
                {/* Email Info */}
                <div className="space-y-2">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div>
                      <h3 className="font-medium">{t('profile.email')}</h3>
                      <p className="text-sm text-muted-foreground">{t('profile.emailDescription')}</p>
                    </div>
                    <div className="min-w-[8rem] sm:text-right">
                      <p>{user?.email}</p>
                      <p className="text-xs text-muted-foreground">
                        {user?.email_confirmed_at 
                          ? t('profile.verified') 
                          : t('profile.notVerified')}
                      </p>
                    </div>
                  </div>
                </div>
                
                {/* Subscription Info */}
                <div className="space-y-2">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div>
                      <h3 className="font-medium">{t('profile.subscription')}</h3>
                      <p className="text-sm text-muted-foreground">{t('profile.subscriptionDescription')}</p>
                    </div>
                    <div>
                      <Button variant="outline" size="sm" onClick={() => navigate('/subscription')}>
                        {t('profile.viewSubscription')}
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="business">
            <Card>
              <CardHeader>
                <CardTitle>{t('profile.businessInfo')}</CardTitle>
                <CardDescription>{t('profile.businessInfoDescription')}</CardDescription>
              </CardHeader>
              <CardContent>
                <Form {...form}>
                  <form id="profile-form" onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                      <FormField
                        control={form.control}
                        name="business_name"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>{t('profile.fields.businessName')}</FormLabel>
                            <FormControl>
                              <Input placeholder={t('profile.placeholders.businessName')} {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={form.control}
                        name="contact_name"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>{t('profile.fields.contactName')}</FormLabel>
                            <FormControl>
                              <Input placeholder={t('profile.placeholders.contactName')} {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    
                    <FormField
                      control={form.control}
                      name="business_description"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{t('profile.fields.businessDescription')}</FormLabel>
                          <FormControl>
                            <Textarea 
                              placeholder={t('profile.placeholders.businessDescription')} 
                              {...field}
                              rows={4}
                            />
                          </FormControl>
                          <FormDescription>
                            {t('profile.businessDescriptionHint')}
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                      <FormField
                        control={form.control}
                        name="phone"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>{t('profile.fields.phone')}</FormLabel>
                            <FormControl>
                              <Input placeholder={t('profile.placeholders.phone')} {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={form.control}
                        name="website"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>{t('profile.fields.website')}</FormLabel>
                            <FormControl>
                              <Input placeholder={t('profile.placeholders.website')} {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    
                    <FormField
                      control={form.control}
                      name="address"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{t('profile.fields.address')}</FormLabel>
                          <FormControl>
                            <Textarea 
                              placeholder={t('profile.placeholders.address')} 
                              {...field}
                              rows={2}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </form>
                </Form>
              </CardContent>
              <CardFooter>
                <Button 
                  type="submit" 
                  form="profile-form"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      {t('profile.saving')}
                    </>
                  ) : (
                    t('profile.saveChanges')
                  )}
                </Button>
              </CardFooter>
            </Card>
          </TabsContent>
          
          <TabsContent value="security">
            <Card>
              <CardHeader>
                <CardTitle>{t('profile.security')}</CardTitle>
                <CardDescription>{t('profile.securityDescription')}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Password Change */}
                <div className="space-y-2">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div>
                      <h3 className="font-medium">{t('profile.password')}</h3>
                      <p className="text-sm text-muted-foreground">{t('profile.passwordDescription')}</p>
                    </div>
                    <div>
                      <Button variant="outline" onClick={() => navigate('/forgot-password')}>
                        {t('profile.changePassword')}
                      </Button>
                    </div>
                  </div>
                </div>
                
                {/* Two-Factor Authentication */}
                <div className="space-y-2">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div>
                      <h3 className="font-medium">{t('profile.twoFactor')}</h3>
                      <p className="text-sm text-muted-foreground">{t('profile.twoFactorDescription')}</p>
                    </div>
                    <div>
                      <Button variant="outline" disabled>
                        {t('profile.comingSoon')}
                      </Button>
                    </div>
                  </div>
                </div>
                
                {/* Sessions */}
                <div className="space-y-2">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div>
                      <h3 className="font-medium">{t('profile.activeSessions')}</h3>
                      <p className="text-sm text-muted-foreground">{t('profile.activeSessionsDescription')}</p>
                    </div>
                    <div>
                      <Button variant="outline" disabled>
                        {t('profile.viewSessions')}
                      </Button>
                    </div>
                  </div>
                </div>
                
                {/* Delete Account */}
                <div className="border-t pt-6">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                      <h3 className="font-medium text-destructive">{t('profile.deleteAccount')}</h3>
                      <p className="text-sm text-muted-foreground">{t('profile.deleteAccountDescription')}</p>
                    </div>
                    <div>
                      <Button variant="destructive">
                        {t('profile.deleteAccountButton')}
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </div>
      </Tabs>
    </DashboardLayout>
  );
}