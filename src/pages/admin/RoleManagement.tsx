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
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { AlertCircle, Search, UserCog, Check, X } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { useToast } from '@/components/ui/use-toast';
import { Skeleton } from '@/components/ui/skeleton';
import { supabase } from '@/lib/supabase';
import { format, formatDistanceToNow } from 'date-fns';

interface User {
  id: string;
  email: string;
  role: string | null;
  created_at: string;
  last_sign_in_at: string | null;
}

const RoleManagement: React.FC = () => {
  const { t } = useTranslation();
  const { toast } = useToast();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [selectedRole, setSelectedRole] = useState<string>('');
  const [userRole, setUserRole] = useState<string | null>(null);

  // Available roles
  const roles = [
    { value: 'super_admin', label: t('admin.superAdmin') },
    { value: 'admin', label: t('admin.admin') },
    { value: 'moderator', label: t('admin.moderator') },
    { value: 'support', label: t('admin.support') },
    { value: 'analyst', label: t('admin.analyst') }
  ];

  // Fetch user role
  const fetchUserRole = async () => {
    try {
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
    } catch (error) {
      console.error('Error fetching user role:', error);
    }
  };

  // Fetch all users with their roles
  const fetchUsers = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');
      
      const { data: sessionData } = await supabase.auth.getSession();
      if (!sessionData?.session) throw new Error('No active session');
      
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/app_aa9a812f43_manage_roles/users`,
        {
          headers: {
            'Authorization': `Bearer ${sessionData.session.access_token}`,
            'Content-Type': 'application/json'
          }
        }
      );
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to fetch users');
      }
      
      const data = await response.json();
      setUsers(data);
    } catch (error) {
      console.error('Error fetching users:', error);
      setError(t('admin.errorFetchingUsers'));
      toast({
        title: t('admin.errorTitle'),
        description: t('admin.errorFetchingUsers'),
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
    if (userRole === 'super_admin') {
      fetchUsers();
    }
  }, [userRole]);

  // Handle assigning a role
  const handleAssignRole = async () => {
    if (!selectedUser || !selectedRole) return;
    
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      if (!sessionData?.session) throw new Error('No active session');
      
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/app_aa9a812f43_manage_roles/${selectedUser.id}`,
        {
          method: 'PUT',
          headers: {
            'Authorization': `Bearer ${sessionData.session.access_token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ role: selectedRole })
        }
      );
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to assign role');
      }
      
      const data = await response.json();
      
      // Update the user in the state
      setUsers(users.map(user => 
        user.id === selectedUser.id ? { ...user, role: selectedRole } : user
      ));
      
      toast({
        title: t('admin.success'),
        description: t('admin.roleName') + ' ' + selectedRole + ' ' + t('common.assigned') + ' ' + t('common.to') + ' ' + selectedUser.email,
      });
      
      setIsDialogOpen(false);
    } catch (error) {
      console.error('Error assigning role:', error);
      toast({
        title: t('admin.errorTitle'),
        description: error.message || 'Failed to assign role',
        variant: 'destructive'
      });
    }
  };

  // Handle removing a role
  const handleRemoveRole = async (user: User) => {
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      if (!sessionData?.session) throw new Error('No active session');
      
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/app_aa9a812f43_manage_roles/${user.id}`,
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
        throw new Error(errorData.error || 'Failed to remove role');
      }
      
      // Update the user in the state
      setUsers(users.map(u => 
        u.id === user.id ? { ...u, role: null } : u
      ));
      
      toast({
        title: t('admin.success'),
        description: t('admin.roleName') + ' ' + t('common.removed') + ' ' + t('common.from') + ' ' + user.email,
      });
    } catch (error) {
      console.error('Error removing role:', error);
      toast({
        title: t('admin.errorTitle'),
        description: error.message || 'Failed to remove role',
        variant: 'destructive'
      });
    }
  };

  // Handle opening the dialog to assign a role
  const handleOpenAssignDialog = (user: User) => {
    setSelectedUser(user);
    setSelectedRole(user.role || '');
    setIsDialogOpen(true);
  };

  // Filter users based on search term and role filter
  const filteredUsers = users.filter(user => {
    const matchesSearch = user.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = roleFilter === '' || 
                       (roleFilter === 'unassigned' && !user.role) ||
                       (user.role === roleFilter);
    return matchesSearch && matchesRole;
  });

  // Role badge color
  const getRoleBadgeColor = (role: string | null) => {
    if (!role) return 'bg-gray-100 text-gray-800';
    
    switch (role) {
      case 'super_admin':
        return 'bg-red-100 text-red-800';
      case 'admin':
        return 'bg-purple-100 text-purple-800';
      case 'moderator':
        return 'bg-blue-100 text-blue-800';
      case 'support':
        return 'bg-green-100 text-green-800';
      case 'analyst':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  // Format date to be more readable
  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'Never';
    const date = new Date(dateString);
    return formatDistanceToNow(date, { addSuffix: true });
  };

  // If the user is not a super_admin, show an access denied message
  if (userRole !== null && userRole !== 'super_admin') {
    return (
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>{t('admin.roleManagement')}</CardTitle>
            <CardDescription>{t('admin.roleManagementDescription')}</CardDescription>
          </CardHeader>
          <CardContent>
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Access Denied</AlertTitle>
              <AlertDescription>
                You do not have permission to access this page. Only Super Admins can manage user roles.
              </AlertDescription>
            </Alert>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>{t('admin.roleManagement')}</CardTitle>
          <CardDescription>{t('admin.roleManagementDescription')}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row justify-between gap-4 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder={t('admin.searchUsers')}
                className="pl-8"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <Select value={roleFilter} onValueChange={setRoleFilter}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder={t('admin.filterByStatus')} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">{t('admin.allUsers')}</SelectItem>
                <SelectItem value="unassigned">{t('admin.unassigned')}</SelectItem>
                {roles.map(role => (
                  <SelectItem key={role.value} value={role.value}>{role.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {error && (
            <Alert variant="destructive" className="mb-6">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Users Table */}
          <div className="border rounded-md">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t('admin.email')}</TableHead>
                  <TableHead>{t('admin.roleName')}</TableHead>
                  <TableHead>{t('auth.registeredOn')}</TableHead>
                  <TableHead>{t('admin.activity')}</TableHead>
                  <TableHead className="text-right">{t('admin.actions')}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  Array.from({ length: 5 }).map((_, index) => (
                    <TableRow key={index}>
                      <TableCell><Skeleton className="h-5 w-40" /></TableCell>
                      <TableCell><Skeleton className="h-5 w-20" /></TableCell>
                      <TableCell><Skeleton className="h-5 w-24" /></TableCell>
                      <TableCell><Skeleton className="h-5 w-24" /></TableCell>
                      <TableCell className="text-right"><Skeleton className="h-9 w-20 ml-auto" /></TableCell>
                    </TableRow>
                  ))
                ) : filteredUsers.length > 0 ? (
                  filteredUsers.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell className="font-medium">{user.email}</TableCell>
                      <TableCell>
                        {user.role ? (
                          <Badge variant="outline" className={getRoleBadgeColor(user.role)}>
                            {roles.find(r => r.value === user.role)?.label || user.role}
                          </Badge>
                        ) : (
                          <span className="text-muted-foreground">{t('admin.unassigned')}</span>
                        )}
                      </TableCell>
                      <TableCell>{formatDate(user.created_at)}</TableCell>
                      <TableCell>
                        {user.last_sign_in_at ? (
                          <span>{t('admin.activityLogin', { time: formatDate(user.last_sign_in_at) })}</span>
                        ) : (
                          <span className="text-muted-foreground">Never logged in</span>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button 
                            variant="outline" 
                            size="sm" 
                            onClick={() => handleOpenAssignDialog(user)}
                          >
                            <UserCog className="h-4 w-4 mr-1" />
                            {user.role ? t('common.edit') : t('admin.assignRole')}
                          </Button>
                          {user.role && (
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              className="text-red-600 hover:text-red-800"
                              onClick={() => {
                                if (confirm(`Are you sure you want to remove the role from ${user.email}?`)) {
                                  handleRemoveRole(user);
                                }
                              }}
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={5} className="h-32 text-center">
                      {t('admin.noUsers')}
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Assign Role Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>{t('admin.assignRole')}</DialogTitle>
            <DialogDescription>
              {selectedUser?.email}
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1" htmlFor="role-select">
                  {t('admin.roleName')}
                </label>
                <Select value={selectedRole} onValueChange={setSelectedRole}>
                  <SelectTrigger id="role-select">
                    <SelectValue placeholder={t('admin.selectRole')} />
                  </SelectTrigger>
                  <SelectContent>
                    {roles.map(role => (
                      <SelectItem key={role.value} value={role.value}>{role.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              {t('common.cancel')}
            </Button>
            <Button onClick={handleAssignRole} disabled={!selectedRole}>
              <Check className="h-4 w-4 mr-2" />
              {t('common.save')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default RoleManagement;