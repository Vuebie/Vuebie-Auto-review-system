import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { useAuth } from '@/contexts/AuthContext';
import { supabase, TABLES } from '@/lib/supabase';

import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { Gift, Plus, MoreHorizontal, Search, Edit } from 'lucide-react';
import { toast } from 'sonner';

// Define incentive type
interface Incentive {
  id: string;
  name: string;
  description: string;
  active: boolean;
  qr_codes_count: number;
  created_at: string;
}

export default function IncentivesPage() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [incentives, setIncentives] = useState<Incentive[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    const fetchIncentives = async () => {
      if (!user?.user?.id) return;

      setIsLoading(true);
      try {
        // Fetch incentives with qr_codes_count
        const { data, error } = await supabase
          .from(TABLES.INCENTIVES)
          .select(`
            id, name, description, active, created_at,
            qr_codes:${TABLES.QR_CODES}(id)
          `)
          .eq('merchant_id', user.user.id)
          .order('created_at', { ascending: false });

        if (error) throw error;

        // Transform the data to include counts
        const transformedIncentives = data.map((incentive) => ({
          id: incentive.id,
          name: incentive.name,
          description: incentive.description,
          active: incentive.active,
          created_at: incentive.created_at,
          qr_codes_count: incentive.qr_codes?.length || 0,
        }));

        setIncentives(transformedIncentives);
      } catch (error) {
        console.error('Error fetching incentives:', error);
        toast.error(t('incentives.fetchError'));
      } finally {
        setIsLoading(false);
      }
    };

    if (user?.user?.id) {
      fetchIncentives();
    }
  }, [user?.user?.id, t]);

  // Filter incentives based on search query
  const filteredIncentives = incentives.filter(
    (incentive) =>
      incentive.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      incentive.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <DashboardLayout
      title={t('incentives.title')}
      description={t('incentives.description')}
    >
      {/* Actions Bar */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div className="relative w-full sm:w-64">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder={t('incentives.searchPlaceholder')}
            className="pl-8"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <div className="flex gap-2">
          <Button variant="outline" asChild>
            <Link to="/incentives/management">
              <Gift className="mr-2 h-4 w-4" /> {t('incentives.manage')}
            </Link>
          </Button>
          <Button asChild>
            <Link to="/incentives/new">
              <Plus className="mr-2 h-4 w-4" /> {t('incentives.addIncentive')}
            </Link>
          </Button>
        </div>
      </div>

      {/* Incentives Grid/List */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(3)].map((_, i) => (
            <Card key={i}>
              <CardHeader>
                <Skeleton className="h-6 w-3/4 mb-2" />
                <Skeleton className="h-4 w-1/2" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-4 w-full mb-2" />
                <Skeleton className="h-4 w-full mb-2" />
                <Skeleton className="h-4 w-2/3" />
              </CardContent>
              <CardFooter className="flex justify-between">
                <Skeleton className="h-8 w-20" />
                <Skeleton className="h-8 w-8 rounded-full" />
              </CardFooter>
            </Card>
          ))}
        </div>
      ) : filteredIncentives.length === 0 ? (
        <div className="text-center py-12">
          {incentives.length === 0 ? (
            <>
              <Gift className="mx-auto h-12 w-12 text-muted-foreground/50 mb-4" />
              <h3 className="text-lg font-medium">{t('incentives.noIncentivesYet')}</h3>
              <p className="text-muted-foreground mt-2 mb-6 max-w-md mx-auto">
                {t('incentives.addFirstIncentive')}
              </p>
              <Button asChild>
                <Link to="/incentives/new">
                  <Plus className="mr-2 h-4 w-4" /> {t('incentives.createFirstIncentive')}
                </Link>
              </Button>
            </>
          ) : (
            <>
              <Search className="mx-auto h-12 w-12 text-muted-foreground/50 mb-4" />
              <h3 className="text-lg font-medium">{t('incentives.noSearchResults')}</h3>
              <p className="text-muted-foreground mt-2">
                {t('incentives.tryDifferentSearch')}
              </p>
            </>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredIncentives.map((incentive) => (
            <Card key={incentive.id}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>{incentive.name}</CardTitle>
                  <div className={`px-2 py-1 rounded-full text-xs font-medium ${
                    incentive.active 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-gray-100 text-gray-800'
                  }`}>
                    {incentive.active ? t('incentives.active') : t('incentives.inactive')}
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">{incentive.description}</p>
                <div className="flex items-center mt-4">
                  <Gift className="h-4 w-4 mr-1.5 text-muted-foreground" />
                  <span className="text-sm">
                    {incentive.qr_codes_count} {t('incentives.qrCodes')}
                  </span>
                </div>
              </CardContent>
              <CardFooter className="flex justify-between">
                <Button asChild variant="outline" size="sm">
                  <Link to={`/incentives/${incentive.id}`}>
                    {t('incentives.viewDetails')}
                  </Link>
                </Button>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon">
                      <MoreHorizontal className="h-4 w-4" />
                      <span className="sr-only">{t('incentives.actions')}</span>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem asChild>
                      <Link to={`/incentives/${incentive.id}/edit`}>
                        <Edit className="h-4 w-4 mr-2" />
                        {t('incentives.edit')}
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link to={`/qr-codes/new?incentiveId=${incentive.id}`}>
                        <Gift className="h-4 w-4 mr-2" />
                        {t('incentives.createQrCode')}
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem className="text-destructive">
                      {t('incentives.delete')}
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}
    </DashboardLayout>
  );
}