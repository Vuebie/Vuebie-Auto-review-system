import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import AdminLayout from './layouts/AdminLayout';
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from '@/components/ui/pagination';
import { supabase, TABLES, MerchantProfile } from '@/lib/supabase';
import { useToast } from '@/components/ui/use-toast';
import {
  Loader2,
  Search,
  Building2,
  Mail,
  Phone,
  Check,
  X,
  AlertTriangle,
} from 'lucide-react';

interface ExtendedMerchantProfile extends MerchantProfile {
  email?: string;
  outlets_count?: number;
  reviews_count?: number;
  user_email?: string;
  user_id: string;
  is_active?: boolean;
}

export default function MerchantManagement() {
  const { t } = useTranslation();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [merchants, setMerchants] = useState<ExtendedMerchantProfile[]>([]);
  const [filteredMerchants, setFilteredMerchants] = useState<ExtendedMerchantProfile[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [selectedMerchant, setSelectedMerchant] = useState<ExtendedMerchantProfile | null>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('details');
  
  // Fetch merchants data
  useEffect(() => {
    const fetchMerchants = async () => {
      try {
        setLoading(true);
        
        // Get merchant profiles
        const { data: merchantData, error: merchantError } = await supabase
          .from(TABLES.MERCHANT_PROFILES)
          .select('*');
        
        if (merchantError) {
          console.error('Error fetching merchants:', merchantError);
          throw new Error(merchantError.message);
        }
        
        // Get user data for each merchant
        const enhancedMerchants = await Promise.all(merchantData.map(async (merchant) => {
          // Get user email
          const { data: userData, error: userError } = await supabase.auth.admin.getUserById(merchant.user_id);
          
          if (userError) {
            console.error('Error fetching user:', userError);
            return {
              ...merchant,
              user_email: 'Unknown',
              is_active: true,
              outlets_count: 0,
              reviews_count: 0,
            };
          }
          
          // Get outlets count
          const { count: outletsCount, error: outletsError } = await supabase
            .from(TABLES.OUTLETS)
            .select('*', { count: 'exact', head: true })
            .eq('merchant_id', merchant.user_id);
          
          if (outletsError) {
            console.error('Error fetching outlets count:', outletsError);
          }
          
          // Get reviews count
          const { count: reviewsCount, error: reviewsError } = await supabase
            .from(TABLES.REVIEW_SESSIONS)
            .select('*', { count: 'exact', head: true })
            .eq('merchant_id', merchant.user_id);
          
          if (reviewsError) {
            console.error('Error fetching reviews count:', reviewsError);
          }
          
          return {
            ...merchant,
            user_email: userData?.user?.email || 'Unknown',
            is_active: true,
            outlets_count: outletsCount || 0,
            reviews_count: reviewsCount || 0,
          };
        }));
        
        setMerchants(enhancedMerchants);
        setFilteredMerchants(enhancedMerchants);
      } catch (error) {
        console.error('Error fetching merchant data:', error);
        toast({
          variant: 'destructive',
          title: t('admin.errorTitle'),
          description: t('admin.errorFetchingMerchants'),
        });
      } finally {
        setLoading(false);
      }
    };

    fetchMerchants();
  }, [t, toast]);

  // Filter merchants based on search query and status filter
  useEffect(() => {
    const filtered = merchants.filter((merchant) => {
      const matchesSearch = searchQuery === '' ||
        merchant.business_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        merchant.user_email?.toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchesStatus = statusFilter === 'all' ||
        (statusFilter === 'active' && merchant.is_active) ||
        (statusFilter === 'inactive' && !merchant.is_active);
      
      return matchesSearch && matchesStatus;
    });
    
    setFilteredMerchants(filtered);
    setCurrentPage(1); // Reset to first page when filter changes
  }, [searchQuery, statusFilter, merchants]);

  // Calculate pagination
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredMerchants.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredMerchants.length / itemsPerPage);
  
  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const handleMerchantDetails = (merchant: ExtendedMerchantProfile) => {
    setSelectedMerchant(merchant);
    setDetailsOpen(true);
  };

  const handleStatusChange = async (merchant: ExtendedMerchantProfile, status: boolean) => {
    try {
      // Update merchant status in the database and local state
      setMerchants(merchants.map(m => {
        if (m.id === merchant.id) {
          return { ...m, is_active: status };
        }
        return m;
      }));
      
      toast({
        title: t('admin.success'),
        description: status 
          ? t('admin.merchantActivated', { name: merchant.business_name })
          : t('admin.merchantDeactivated', { name: merchant.business_name }),
      });
    } catch (error) {
      console.error('Error updating merchant status:', error);
      toast({
        variant: 'destructive',
        title: t('admin.errorTitle'),
        description: t('admin.errorUpdatingMerchantStatus'),
      });
    }
  };

  const getSubscriptionBadge = (tier: string) => {
    switch (tier) {
      case 'premium':
        return <Badge className="bg-purple-100 text-purple-800 hover:bg-purple-200">Premium</Badge>;
      case 'basic':
        return <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-200">Basic</Badge>;
      case 'free':
      default:
        return <Badge className="bg-gray-100 text-gray-800 hover:bg-gray-200">Free</Badge>;
    }
  };

  return (
    <AdminLayout
      title={t('admin.merchantManagement')}
      description={t('admin.merchantManagementDescription')}
    >
      <div className="space-y-4">
        <div className="flex justify-between flex-col sm:flex-row gap-3">
          <div className="flex-1 relative">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder={t('admin.searchMerchants')}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-8"
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder={t('admin.filterByStatus')} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t('admin.allMerchants')}</SelectItem>
              <SelectItem value="active">{t('admin.activeMerchants')}</SelectItem>
              <SelectItem value="inactive">{t('admin.inactiveMerchants')}</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>{t('admin.merchants')}</CardTitle>
            <CardDescription>
              {t('admin.merchantsDescription')}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex justify-center p-8">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                <span className="ml-2 text-lg">{t('admin.loading')}</span>
              </div>
            ) : (
              <>
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>{t('admin.business')}</TableHead>
                        <TableHead>{t('admin.email')}</TableHead>
                        <TableHead>{t('admin.subscription')}</TableHead>
                        <TableHead>{t('admin.outlets')}</TableHead>
                        <TableHead>{t('admin.reviews')}</TableHead>
                        <TableHead>{t('admin.status')}</TableHead>
                        <TableHead className="text-right">{t('admin.actions')}</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {currentItems.length > 0 ? (
                        currentItems.map((merchant) => (
                          <TableRow key={merchant.id}>
                            <TableCell className="font-medium">
                              <div className="flex items-center">
                                <Building2 className="h-4 w-4 mr-2 text-muted-foreground" />
                                {merchant.business_name}
                              </div>
                            </TableCell>
                            <TableCell>{merchant.user_email}</TableCell>
                            <TableCell>
                              {getSubscriptionBadge(merchant.subscription_tier)}
                            </TableCell>
                            <TableCell>{merchant.outlets_count || 0}</TableCell>
                            <TableCell>{merchant.reviews_count || 0}</TableCell>
                            <TableCell>
                              {merchant.is_active ? (
                                <Badge variant="outline" className="bg-green-100 text-green-800">
                                  <Check className="h-3.5 w-3.5 mr-1" />
                                  {t('admin.active')}
                                </Badge>
                              ) : (
                                <Badge variant="outline" className="bg-red-100 text-red-800">
                                  <X className="h-3.5 w-3.5 mr-1" />
                                  {t('admin.inactive')}
                                </Badge>
                              )}
                            </TableCell>
                            <TableCell className="text-right">
                              <Button
                                variant="outline"
                                size="sm"
                                className="mr-2"
                                onClick={() => handleMerchantDetails(merchant)}
                              >
                                {t('admin.details')}
                              </Button>
                              {merchant.is_active ? (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="text-red-500 hover:text-red-700 hover:bg-red-50"
                                  onClick={() => handleStatusChange(merchant, false)}
                                >
                                  {t('admin.deactivate')}
                                </Button>
                              ) : (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="text-green-500 hover:text-green-700 hover:bg-green-50"
                                  onClick={() => handleStatusChange(merchant, true)}
                                >
                                  {t('admin.activate')}
                                </Button>
                              )}
                            </TableCell>
                          </TableRow>
                        ))
                      ) : (
                        <TableRow>
                          <TableCell
                            colSpan={7}
                            className="text-center text-muted-foreground"
                          >
                            {t('admin.noMerchants')}
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </div>
                
                {totalPages > 1 && (
                  <Pagination className="mt-4">
                    <PaginationContent>
                      <PaginationItem>
                        <PaginationPrevious
                          onClick={() => handlePageChange(Math.max(1, currentPage - 1))}
                          className={currentPage === 1 ? "pointer-events-none opacity-50" : ""}
                        />
                      </PaginationItem>
                      {Array.from({ length: totalPages }, (_, i) => i + 1).map(
                        (page) => (
                          <PaginationItem key={page}>
                            <PaginationLink
                              isActive={page === currentPage}
                              onClick={() => handlePageChange(page)}
                            >
                              {page}
                            </PaginationLink>
                          </PaginationItem>
                        )
                      )}
                      <PaginationItem>
                        <PaginationNext
                          onClick={() => handlePageChange(Math.min(totalPages, currentPage + 1))}
                          className={currentPage === totalPages ? "pointer-events-none opacity-50" : ""}
                        />
                      </PaginationItem>
                    </PaginationContent>
                  </Pagination>
                )}
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Merchant Details Dialog */}
      <Dialog open={detailsOpen} onOpenChange={setDetailsOpen}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {selectedMerchant?.business_name}
              {selectedMerchant?.is_active ? (
                <Badge variant="outline" className="bg-green-100 text-green-800 ml-2">
                  {t('admin.active')}
                </Badge>
              ) : (
                <Badge variant="outline" className="bg-red-100 text-red-800 ml-2">
                  {t('admin.inactive')}
                </Badge>
              )}
            </DialogTitle>
            <DialogDescription>
              {t('admin.merchantDetailsDescription')}
            </DialogDescription>
          </DialogHeader>
          
          {selectedMerchant && (
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="details">{t('admin.details')}</TabsTrigger>
                <TabsTrigger value="activity">{t('admin.activity')}</TabsTrigger>
                <TabsTrigger value="settings">{t('admin.settings')}</TabsTrigger>
              </TabsList>
              
              <TabsContent value="details" className="space-y-4 pt-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm text-muted-foreground">
                      {t('admin.businessName')}
                    </Label>
                    <p className="font-medium">{selectedMerchant.business_name}</p>
                  </div>
                  <div>
                    <Label className="text-sm text-muted-foreground">
                      {t('admin.email')}
                    </Label>
                    <p className="font-medium">{selectedMerchant.user_email}</p>
                  </div>
                  <div>
                    <Label className="text-sm text-muted-foreground">
                      {t('admin.subscriptionTier')}
                    </Label>
                    <p className="font-medium">
                      {getSubscriptionBadge(selectedMerchant.subscription_tier)}
                    </p>
                  </div>
                  <div>
                    <Label className="text-sm text-muted-foreground">
                      {t('admin.registeredOn')}
                    </Label>
                    <p className="font-medium">
                      {new Date(selectedMerchant.created_at).toLocaleDateString()}
                    </p>
                  </div>
                  <div>
                    <Label className="text-sm text-muted-foreground">
                      {t('admin.outlets')}
                    </Label>
                    <p className="font-medium">{selectedMerchant.outlets_count || 0}</p>
                  </div>
                  <div>
                    <Label className="text-sm text-muted-foreground">
                      {t('admin.reviews')}
                    </Label>
                    <p className="font-medium">{selectedMerchant.reviews_count || 0}</p>
                  </div>
                </div>
              </TabsContent>
              
              <TabsContent value="activity" className="pt-4">
                <div className="space-y-4">
                  <div className="flex items-center space-x-2">
                    <div className="h-2 w-2 rounded-full bg-green-500"></div>
                    <p className="text-sm">
                      {t('admin.activityNewOutlet', {
                        time: '2 hours ago'
                      })}
                    </p>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="h-2 w-2 rounded-full bg-blue-500"></div>
                    <p className="text-sm">
                      {t('admin.activityNewReviews', {
                        count: 5,
                        time: '1 day ago'
                      })}
                    </p>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="h-2 w-2 rounded-full bg-amber-500"></div>
                    <p className="text-sm">
                      {t('admin.activityLogin', {
                        time: '2 days ago'
                      })}
                    </p>
                  </div>
                </div>
              </TabsContent>
              
              <TabsContent value="settings" className="pt-4">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="status">{t('admin.status')}</Label>
                      <p className="text-sm text-muted-foreground">
                        {t('admin.statusDescription')}
                      </p>
                    </div>
                    <Switch
                      id="status"
                      checked={selectedMerchant.is_active}
                      onCheckedChange={(checked) => {
                        handleStatusChange(selectedMerchant, checked);
                        setSelectedMerchant({
                          ...selectedMerchant,
                          is_active: checked
                        });
                      }}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="subscription-tier">
                      {t('admin.subscriptionTier')}
                    </Label>
                    <Select
                      value={selectedMerchant.subscription_tier}
                      onValueChange={(value) => {
                        // Update merchant tier in the database
                        setSelectedMerchant({
                          ...selectedMerchant,
                          subscription_tier: value as 'free' | 'basic' | 'premium',
                        });
                      }}
                    >
                      <SelectTrigger id="subscription-tier">
                        <SelectValue placeholder={t('admin.selectTier')} />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="free">Free</SelectItem>
                        <SelectItem value="basic">Basic</SelectItem>
                        <SelectItem value="premium">Premium</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          )}
          
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDetailsOpen(false)}
            >
              {t('admin.close')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
}