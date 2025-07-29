import { useEffect, useState } from 'react';
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
import { Building2, Plus, MoreHorizontal, Search, MapPin, QrCode } from 'lucide-react';
import { toast } from 'sonner';

// Define outlet type
interface Outlet {
  id: string;
  name: string;
  address: string;
  city: string;
  country: string;
  qr_codes_count: number;
  reviews_count: number;
  created_at: string;
}

export default function OutletsPage() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [outlets, setOutlets] = useState<Outlet[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    const fetchOutlets = async () => {
      if (!user?.user?.id) return;

      setIsLoading(true);
      try {
        // Fetch outlets with qr_codes_count and reviews_count
        const { data, error } = await supabase
          .from(TABLES.OUTLETS)
          .select(`
            id, name, address, city, country, created_at,
            qr_codes:${TABLES.QR_CODES}(id),
            reviews:${TABLES.REVIEW_SESSIONS}(id)
          `)
          .eq('merchant_id', user.user.id)
          .order('created_at', { ascending: false });

        if (error) throw error;

        // Transform the data to include counts
        const transformedOutlets = data.map((outlet) => ({
          id: outlet.id,
          name: outlet.name,
          address: outlet.address,
          city: outlet.city,
          country: outlet.country,
          created_at: outlet.created_at,
          qr_codes_count: outlet.qr_codes?.length || 0,
          reviews_count: outlet.reviews?.length || 0,
        }));

        setOutlets(transformedOutlets);
      } catch (error) {
        console.error('Error fetching outlets:', error);
        toast.error(t('outlets.fetchError'));
      } finally {
        setIsLoading(false);
      }
    };

    if (user?.user?.id) {
      fetchOutlets();
    }
  }, [user?.user?.id, t]);

  // Filter outlets based on search query
  const filteredOutlets = outlets.filter(
    (outlet) =>
      outlet.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      outlet.address.toLowerCase().includes(searchQuery.toLowerCase()) ||
      outlet.city.toLowerCase().includes(searchQuery.toLowerCase()) ||
      outlet.country.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <DashboardLayout
      title={t('outlets.title')}
      description={t('outlets.description')}
    >
      {/* Actions Bar */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div className="relative w-full sm:w-64">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder={t('outlets.searchPlaceholder')}
            className="pl-8"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <Button asChild>
          <Link to="/outlets/new">
            <Plus className="mr-2 h-4 w-4" /> {t('outlets.addOutlet')}
          </Link>
        </Button>
      </div>

      {/* Outlets Grid/List */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(3)].map((_, i) => (
            <Card key={i} className="overflow-hidden">
              <CardHeader className="p-0">
                <Skeleton className="h-48 rounded-none" />
              </CardHeader>
              <CardContent className="p-6">
                <Skeleton className="h-6 w-3/4 mb-2" />
                <Skeleton className="h-4 w-full mb-1" />
                <Skeleton className="h-4 w-2/3" />
              </CardContent>
              <CardFooter className="flex justify-between p-6 pt-0">
                <Skeleton className="h-8 w-20" />
                <Skeleton className="h-8 w-8 rounded-full" />
              </CardFooter>
            </Card>
          ))}
        </div>
      ) : filteredOutlets.length === 0 ? (
        <div className="text-center py-12">
          {outlets.length === 0 ? (
            <>
              <Building2 className="mx-auto h-12 w-12 text-muted-foreground/50 mb-4" />
              <h3 className="text-lg font-medium">{t('outlets.noOutletsYet')}</h3>
              <p className="text-muted-foreground mt-2 mb-6 max-w-md mx-auto">
                {t('outlets.addFirstOutlet')}
              </p>
              <Button asChild>
                <Link to="/outlets/new">
                  <Plus className="mr-2 h-4 w-4" /> {t('outlets.createFirstOutlet')}
                </Link>
              </Button>
            </>
          ) : (
            <>
              <Search className="mx-auto h-12 w-12 text-muted-foreground/50 mb-4" />
              <h3 className="text-lg font-medium">{t('outlets.noSearchResults')}</h3>
              <p className="text-muted-foreground mt-2">
                {t('outlets.tryDifferentSearch')}
              </p>
            </>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredOutlets.map((outlet) => (
            <Card key={outlet.id}>
              <CardHeader>
                <CardTitle>{outlet.name}</CardTitle>
                <CardDescription className="flex items-center">
                  <MapPin className="h-3.5 w-3.5 mr-1" />
                  {outlet.city}, {outlet.country}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">{outlet.address}</p>
                <div className="flex justify-between mt-4">
                  <div className="flex items-center">
                    <QrCode className="h-4 w-4 mr-1.5 text-muted-foreground" />
                    <span className="text-sm">
                      {outlet.qr_codes_count} {t('outlets.qrCodes')}
                    </span>
                  </div>
                  <div className="flex items-center">
                    <Star className="h-4 w-4 mr-1.5 text-muted-foreground" />
                    <span className="text-sm">
                      {outlet.reviews_count} {t('outlets.reviews')}
                    </span>
                  </div>
                </div>
              </CardContent>
              <CardFooter className="flex justify-between">
                <Button asChild variant="outline" size="sm">
                  <Link to={`/outlets/${outlet.id}`}>
                    {t('outlets.viewDetails')}
                  </Link>
                </Button>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon">
                      <MoreHorizontal className="h-4 w-4" />
                      <span className="sr-only">{t('outlets.actions')}</span>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem asChild>
                      <Link to={`/outlets/${outlet.id}/edit`}>
                        {t('outlets.edit')}
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link to={`/qr-codes/new?outletId=${outlet.id}`}>
                        {t('outlets.createQrCode')}
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem className="text-destructive">
                      {t('outlets.delete')}
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

// Star icon component
function Star(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
    </svg>
  );
}