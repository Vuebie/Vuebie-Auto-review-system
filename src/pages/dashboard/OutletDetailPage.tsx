import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useParams } from 'react-router-dom';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { useAuth } from '@/contexts/AuthContext';
import { supabase, TABLES } from '@/lib/supabase';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import { QrCode, MapPin, Building2, Edit } from 'lucide-react';

// Define outlet type
interface Outlet {
  id: string;
  name: string;
  address: string;
  city: string;
  country: string;
  phone?: string;
  website?: string;
  created_at: string;
  qr_codes_count: number;
  reviews_count: number;
}

export default function OutletDetailPage() {
  const { t } = useTranslation();
  const { id } = useParams();
  const { user } = useAuth();
  const [outlet, setOutlet] = useState<Outlet | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchOutletDetails = async () => {
      if (!user?.user?.id || !id) return;

      setIsLoading(true);
      try {
        // Fetch outlet with qr_codes_count and reviews_count
        const { data, error } = await supabase
          .from(TABLES.OUTLETS)
          .select(`
            id, name, address, city, country, phone, website, created_at,
            qr_codes:${TABLES.QR_CODES}(id),
            reviews:${TABLES.REVIEW_SESSIONS}(id)
          `)
          .eq('id', id)
          .eq('merchant_id', user.user.id)
          .single();

        if (error) throw error;

        // Transform the data to include counts
        setOutlet({
          id: data.id,
          name: data.name,
          address: data.address,
          city: data.city,
          country: data.country,
          phone: data.phone,
          website: data.website,
          created_at: data.created_at,
          qr_codes_count: data.qr_codes?.length || 0,
          reviews_count: data.reviews?.length || 0,
        });
      } catch (error) {
        console.error('Error fetching outlet details:', error);
        toast.error(t('outlets.fetchError'));
      } finally {
        setIsLoading(false);
      }
    };

    if (user?.user?.id && id) {
      fetchOutletDetails();
    }
  }, [user?.user?.id, id, t]);

  return (
    <DashboardLayout>
      {isLoading ? (
        <div className="space-y-4">
          <Skeleton className="h-10 w-1/3" />
          <Skeleton className="h-5 w-1/4" />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
            <Skeleton className="h-40" />
            <Skeleton className="h-40 md:col-span-2" />
          </div>
        </div>
      ) : outlet ? (
        <div>
          <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
            <div>
              <h1 className="text-2xl font-semibold">{outlet.name}</h1>
              <div className="flex items-center text-muted-foreground mt-1">
                <MapPin className="h-4 w-4 mr-1" />
                <span>{outlet.address}, {outlet.city}, {outlet.country}</span>
              </div>
            </div>
            <div className="mt-4 md:mt-0">
              <Button variant="outline" className="mr-2">
                <Edit className="h-4 w-4 mr-2" /> {t('outlets.edit')}
              </Button>
              <Button>
                <QrCode className="h-4 w-4 mr-2" /> {t('outlets.createQrCode')}
              </Button>
            </div>
          </div>

          <Tabs defaultValue="overview" className="mt-6">
            <TabsList>
              <TabsTrigger value="overview">{t('outlets.tabs.overview')}</TabsTrigger>
              <TabsTrigger value="qrcodes">{t('outlets.tabs.qrCodes')}</TabsTrigger>
              <TabsTrigger value="reviews">{t('outlets.tabs.reviews')}</TabsTrigger>
              <TabsTrigger value="analytics">{t('outlets.tabs.analytics')}</TabsTrigger>
            </TabsList>
            <div className="mt-4">
              <TabsContent value="overview">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <Card>
                    <CardHeader>
                      <CardTitle>{t('outlets.detailsTitle')}</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <dl className="space-y-4">
                        <div>
                          <dt className="text-sm font-medium text-muted-foreground">
                            {t('outlets.fields.name')}
                          </dt>
                          <dd>{outlet.name}</dd>
                        </div>
                        <div>
                          <dt className="text-sm font-medium text-muted-foreground">
                            {t('outlets.fields.address')}
                          </dt>
                          <dd>{outlet.address}</dd>
                        </div>
                        <div>
                          <dt className="text-sm font-medium text-muted-foreground">
                            {t('outlets.fields.city')}
                          </dt>
                          <dd>{outlet.city}</dd>
                        </div>
                        <div>
                          <dt className="text-sm font-medium text-muted-foreground">
                            {t('outlets.fields.country')}
                          </dt>
                          <dd>{outlet.country}</dd>
                        </div>
                        {outlet.phone && (
                          <div>
                            <dt className="text-sm font-medium text-muted-foreground">
                              {t('outlets.fields.phone')}
                            </dt>
                            <dd>{outlet.phone}</dd>
                          </div>
                        )}
                        {outlet.website && (
                          <div>
                            <dt className="text-sm font-medium text-muted-foreground">
                              {t('outlets.fields.website')}
                            </dt>
                            <dd>
                              <a 
                                href={outlet.website} 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="text-primary hover:underline"
                              >
                                {outlet.website}
                              </a>
                            </dd>
                          </div>
                        )}
                      </dl>
                    </CardContent>
                  </Card>

                  <Card className="md:col-span-2">
                    <CardHeader>
                      <CardTitle>{t('outlets.statsTitle')}</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="bg-muted p-4 rounded-lg">
                          <div className="text-sm font-medium text-muted-foreground mb-2">
                            {t('outlets.totalQrCodes')}
                          </div>
                          <div className="text-2xl font-bold">{outlet.qr_codes_count}</div>
                        </div>
                        <div className="bg-muted p-4 rounded-lg">
                          <div className="text-sm font-medium text-muted-foreground mb-2">
                            {t('outlets.totalReviews')}
                          </div>
                          <div className="text-2xl font-bold">{outlet.reviews_count}</div>
                        </div>
                      </div>

                      <div className="mt-8 text-center text-muted-foreground">
                        {t('outlets.moreStatsMessage')}
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>
              
              <TabsContent value="qrcodes">
                <Card>
                  <CardHeader>
                    <CardTitle>{t('outlets.qrCodesTitle')}</CardTitle>
                    <CardDescription>{t('outlets.qrCodesDescription')}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="text-center py-12">
                      <QrCode className="mx-auto h-12 w-12 text-muted-foreground/50 mb-4" />
                      <p className="text-muted-foreground mb-6">
                        {outlet.qr_codes_count > 0 
                          ? t('outlets.qrCodesLoading')
                          : t('outlets.noQrCodes')}
                      </p>
                      <Button>
                        <QrCode className="h-4 w-4 mr-2" /> {t('outlets.createQrCode')}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
              
              <TabsContent value="reviews">
                <Card>
                  <CardHeader>
                    <CardTitle>{t('outlets.reviewsTitle')}</CardTitle>
                    <CardDescription>{t('outlets.reviewsDescription')}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="text-center py-12">
                      <Star className="mx-auto h-12 w-12 text-muted-foreground/50 mb-4" />
                      <p className="text-muted-foreground mb-6">
                        {outlet.reviews_count > 0 
                          ? t('outlets.reviewsLoading')
                          : t('outlets.noReviews')}
                      </p>
                      <Button>
                        <QrCode className="h-4 w-4 mr-2" /> {t('outlets.createQrCode')}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
              
              <TabsContent value="analytics">
                <Card>
                  <CardHeader>
                    <CardTitle>{t('outlets.analyticsTitle')}</CardTitle>
                    <CardDescription>{t('outlets.analyticsDescription')}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="text-center py-12">
                      <BarChart3 className="mx-auto h-12 w-12 text-muted-foreground/50 mb-4" />
                      <p className="text-muted-foreground mb-6">
                        {t('outlets.analyticsMessage')}
                      </p>
                      <Button>
                        <BarChart3 className="h-4 w-4 mr-2" /> {t('outlets.viewAnalytics')}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </div>
          </Tabs>
        </div>
      ) : (
        <div className="text-center py-12">
          <Building2 className="mx-auto h-12 w-12 text-muted-foreground/50 mb-4" />
          <h2 className="text-lg font-medium mb-2">{t('outlets.notFound')}</h2>
          <p className="text-muted-foreground mb-6">{t('outlets.notFoundDescription')}</p>
          <Button asChild>
            <a href="/outlets">{t('outlets.backToOutlets')}</a>
          </Button>
        </div>
      )}
    </DashboardLayout>
  );
}

// Icon components
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

function BarChart3(props: React.SVGProps<SVGSVGElement>) {
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
      <path d="M3 3v18h18" />
      <path d="M18 17V9" />
      <path d="M13 17V5" />
      <path d="M8 17v-3" />
    </svg>
  );
}