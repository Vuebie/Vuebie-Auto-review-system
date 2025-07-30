import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase-client';
import { 
  Card, CardContent, CardDescription, CardHeader, CardTitle 
} from '@/components/ui/card';
import { 
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow 
} from '@/components/ui/table';
import { 
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader,
  DialogTitle, DialogTrigger 
} from '@/components/ui/dialog';
import { 
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  Search, MoreVertical, Filter, UserPlus, RefreshCw, Check, X, 
  AlertTriangle, ChevronDown, Download, Eye, ShieldAlert, ShieldCheck 
} from 'lucide-react';

interface Merchant {
  id: string;
  created_at: string;
  name: string;
  email: string;
  status: 'active' | 'inactive' | 'pending' | 'suspended';
  plan: string;
  last_login: string | null;
  metadata: Record<string, unknown>;
}

const OrganizationManagement: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [merchants, setMerchants] = useState<Merchant[]>([]);
  const [filteredMerchants, setFilteredMerchants] = useState<Merchant[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string | null>(null);
  const [selectedMerchant, setSelectedMerchant] = useState<Merchant | null>(null);
  const [showMerchantDetails, setShowMerchantDetails] = useState(false);
  
  useEffect(() => {
    fetchMerchants();
  }, []);
  
  useEffect(() => {
    // Apply filters when merchants, searchQuery, or statusFilter change
    let results = [...merchants];
    
    // Apply search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      results = results.filter(
        merchant => 
          merchant.name.toLowerCase().includes(query) || 
          merchant.email.toLowerCase().includes(query)
      );
    }
    
    // Apply status filter
    if (statusFilter) {
      results = results.filter(merchant => merchant.status === statusFilter);
    }
    
    setFilteredMerchants(results);
  }, [merchants, searchQuery, statusFilter]);
  
  const fetchMerchants = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('merchant_profiles')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) {
        throw error;
      }
      
      setMerchants(data || []);
      setFilteredMerchants(data || []);
    } catch (error) {
      console.error('Error fetching merchants:', error);
    } finally {
      setLoading(false);
    }
  };
  
  const handleSearch = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(event.target.value);
  };
  
  const handleStatusFilter = (status: string | null) => {
    setStatusFilter(status);
  };
  
  const handleViewMerchant = (merchant: Merchant) => {
    setSelectedMerchant(merchant);
    setShowMerchantDetails(true);
  };
  
  const handleUpdateStatus = async (merchantId: string, newStatus: string) => {
    try {
      const { data, error } = await supabase
        .from('merchant_profiles')
        .update({ status: newStatus })
        .eq('id', merchantId);
      
      if (error) {
        throw error;
      }
      
      // Update the merchant in the local state
      setMerchants(prev => 
        prev.map(m => 
          m.id === merchantId 
            ? { ...m, status: newStatus as 'active' | 'inactive' | 'pending' | 'suspended' } 
            : m
        )
      );
      
      // Update selected merchant if it's the one being modified
      if (selectedMerchant?.id === merchantId) {
        setSelectedMerchant(prev => 
          prev 
            ? { ...prev, status: newStatus as 'active' | 'inactive' | 'pending' | 'suspended' } 
            : null
        );
      }
      
    } catch (error) {
      console.error('Error updating merchant status:', error);
    }
  };
  
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge className="bg-green-100 text-green-800">Active</Badge>;
      case 'inactive':
        return <Badge className="bg-gray-100 text-gray-800">Inactive</Badge>;
      case 'pending':
        return <Badge className="bg-yellow-100 text-yellow-800">Pending</Badge>;
      case 'suspended':
        return <Badge className="bg-red-100 text-red-800">Suspended</Badge>;
      default:
        return <Badge className="bg-gray-100 text-gray-800">{status}</Badge>;
    }
  };
  
  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return 'Never';
    const date = new Date(dateStr);
    return new Intl.DateTimeFormat('en-US', {
      dateStyle: 'medium',
      timeStyle: 'short'
    }).format(date);
  };
  
  return (
    <div className="container mx-auto p-4 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Merchant Management</h1>
        <div className="flex space-x-2">
          <Button variant="outline" size="sm" onClick={() => fetchMerchants()}>
            <RefreshCw className="h-4 w-4 mr-1" /> Refresh
          </Button>
          <Button variant="outline" size="sm">
            <Download className="h-4 w-4 mr-1" /> Export
          </Button>
          <Button size="sm">
            <UserPlus className="h-4 w-4 mr-1" /> Add Merchant
          </Button>
        </div>
      </div>
      
      {/* Filter and Search */}
      <div className="flex flex-col md:flex-row gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-gray-400" />
          <Input 
            placeholder="Search merchants..." 
            className="pl-8" 
            value={searchQuery}
            onChange={handleSearch}
          />
        </div>
        
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" className="flex items-center">
              <Filter className="h-4 w-4 mr-1" /> 
              {statusFilter ? `Status: ${statusFilter}` : 'Filter by Status'}
              <ChevronDown className="h-4 w-4 ml-1" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuItem onClick={() => handleStatusFilter(null)}>
              All Statuses
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => handleStatusFilter('active')}>
              Active
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => handleStatusFilter('inactive')}>
              Inactive
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => handleStatusFilter('pending')}>
              Pending
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => handleStatusFilter('suspended')}>
              Suspended
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
      
      {/* Merchants Table */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle>Merchants</CardTitle>
          <CardDescription>
            {filteredMerchants.length} {filteredMerchants.length === 1 ? 'merchant' : 'merchants'} found
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-2">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="flex items-center space-x-4">
                  <Skeleton className="h-12 w-12 rounded-full" />
                  <div className="space-y-2 flex-1">
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-5/6" />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Merchant</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Plan</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead>Last Login</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredMerchants.length > 0 ? (
                    filteredMerchants.map((merchant) => (
                      <TableRow key={merchant.id}>
                        <TableCell>
                          <div className="flex flex-col">
                            <span className="font-medium">{merchant.name}</span>
                            <span className="text-sm text-gray-500">{merchant.email}</span>
                          </div>
                        </TableCell>
                        <TableCell>{getStatusBadge(merchant.status)}</TableCell>
                        <TableCell>{merchant.plan || 'Free'}</TableCell>
                        <TableCell>{formatDate(merchant.created_at)}</TableCell>
                        <TableCell>{formatDate(merchant.last_login)}</TableCell>
                        <TableCell className="text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="sm">
                                <MoreVertical className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => handleViewMerchant(merchant)}>
                                <Eye className="h-4 w-4 mr-2" /> View Details
                              </DropdownMenuItem>
                              {merchant.status !== 'active' && (
                                <DropdownMenuItem onClick={() => handleUpdateStatus(merchant.id, 'active')}>
                                  <Check className="h-4 w-4 mr-2" /> Activate
                                </DropdownMenuItem>
                              )}
                              {merchant.status !== 'suspended' && (
                                <DropdownMenuItem onClick={() => handleUpdateStatus(merchant.id, 'suspended')}>
                                  <ShieldAlert className="h-4 w-4 mr-2" /> Suspend
                                </DropdownMenuItem>
                              )}
                              {merchant.status === 'pending' && (
                                <>
                                  <DropdownMenuItem onClick={() => handleUpdateStatus(merchant.id, 'active')}>
                                    <Check className="h-4 w-4 mr-2 text-green-600" /> Approve
                                  </DropdownMenuItem>
                                  <DropdownMenuItem onClick={() => handleUpdateStatus(merchant.id, 'inactive')}>
                                    <X className="h-4 w-4 mr-2 text-red-600" /> Reject
                                  </DropdownMenuItem>
                                </>
                              )}
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-6 text-gray-500">
                        {searchQuery || statusFilter 
                          ? 'No merchants found matching the current filters'
                          : 'No merchants found in the system'}
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
      
      {/* Merchant Detail Dialog */}
      <Dialog open={showMerchantDetails} onOpenChange={setShowMerchantDetails}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Merchant Details</DialogTitle>
            <DialogDescription>
              Detailed information about the selected merchant
            </DialogDescription>
          </DialogHeader>
          
          {selectedMerchant && (
            <div>
              <Tabs defaultValue="profile">
                <TabsList className="w-full">
                  <TabsTrigger value="profile">Profile</TabsTrigger>
                  <TabsTrigger value="activity">Activity Log</TabsTrigger>
                  <TabsTrigger value="security">Security Events</TabsTrigger>
                </TabsList>
                
                <TabsContent value="profile">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                    <Card>
                      <CardHeader>
                        <CardTitle>Basic Information</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <dl className="space-y-2">
                          <div className="flex justify-between">
                            <dt className="font-medium text-gray-500">Merchant Name</dt>
                            <dd>{selectedMerchant.name}</dd>
                          </div>
                          <div className="flex justify-between">
                            <dt className="font-medium text-gray-500">Email</dt>
                            <dd>{selectedMerchant.email}</dd>
                          </div>
                          <div className="flex justify-between">
                            <dt className="font-medium text-gray-500">Status</dt>
                            <dd>{getStatusBadge(selectedMerchant.status)}</dd>
                          </div>
                          <div className="flex justify-between">
                            <dt className="font-medium text-gray-500">Plan</dt>
                            <dd>{selectedMerchant.plan || 'Free'}</dd>
                          </div>
                          <div className="flex justify-between">
                            <dt className="font-medium text-gray-500">Created</dt>
                            <dd>{formatDate(selectedMerchant.created_at)}</dd>
                          </div>
                          <div className="flex justify-between">
                            <dt className="font-medium text-gray-500">Last Login</dt>
                            <dd>{formatDate(selectedMerchant.last_login)}</dd>
                          </div>
                        </dl>
                      </CardContent>
                    </Card>
                    
                    <Card>
                      <CardHeader>
                        <CardTitle>Actions</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-2">
                        {selectedMerchant.status !== 'active' && (
                          <Button 
                            variant="outline" 
                            className="w-full justify-start"
                            onClick={() => handleUpdateStatus(selectedMerchant.id, 'active')}
                          >
                            <Check className="h-4 w-4 mr-2" /> Activate Merchant
                          </Button>
                        )}
                        
                        {selectedMerchant.status !== 'suspended' && (
                          <Button 
                            variant="outline" 
                            className="w-full justify-start text-red-600"
                            onClick={() => handleUpdateStatus(selectedMerchant.id, 'suspended')}
                          >
                            <ShieldAlert className="h-4 w-4 mr-2" /> Suspend Merchant
                          </Button>
                        )}
                        
                        {selectedMerchant.status === 'pending' && (
                          <>
                            <Button 
                              variant="outline" 
                              className="w-full justify-start text-green-600"
                              onClick={() => handleUpdateStatus(selectedMerchant.id, 'active')}
                            >
                              <Check className="h-4 w-4 mr-2" /> Approve Application
                            </Button>
                            
                            <Button 
                              variant="outline" 
                              className="w-full justify-start text-red-600"
                              onClick={() => handleUpdateStatus(selectedMerchant.id, 'inactive')}
                            >
                              <X className="h-4 w-4 mr-2" /> Reject Application
                            </Button>
                          </>
                        )}
                        
                        <Button variant="outline" className="w-full justify-start">
                          <ShieldCheck className="h-4 w-4 mr-2" /> Reset Password
                        </Button>
                      </CardContent>
                    </Card>
                  </div>
                </TabsContent>
                
                <TabsContent value="activity">
                  <div className="mt-4 space-y-4">
                    <div className="text-center py-8">
                      <p className="text-gray-500">Activity log will be implemented here</p>
                    </div>
                  </div>
                </TabsContent>
                
                <TabsContent value="security">
                  <div className="mt-4 space-y-4">
                    <div className="text-center py-8">
                      <p className="text-gray-500">Security events will be implemented here</p>
                    </div>
                  </div>
                </TabsContent>
              </Tabs>
            </div>
          )}
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowMerchantDetails(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default OrganizationManagement;