import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import AdminLayout from './layouts/AdminLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  BarChart3,
  Users,
  Building2,
  Star,
  ArrowUp,
  ArrowDown,
  Percent,
} from 'lucide-react';
import { supabase, TABLES } from '@/lib/supabase';

interface StatsCardProps {
  title: string;
  value: string;
  description: string;
  icon: React.ReactNode;
  change?: {
    value: number;
    type: 'increase' | 'decrease';
  };
}

function StatsCard({ title, value, description, icon, change }: StatsCardProps) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <div className="h-4 w-4 text-muted-foreground">{icon}</div>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        <div className="flex items-center">
          {change && (
            <span
              className={`mr-1 text-xs ${
                change.type === 'increase' ? 'text-green-500' : 'text-red-500'
              }`}
            >
              {change.type === 'increase' ? (
                <ArrowUp className="inline h-3 w-3" />
              ) : (
                <ArrowDown className="inline h-3 w-3" />
              )}
              {Math.abs(change.value)}%
            </span>
          )}
          <p className="text-xs text-muted-foreground">{description}</p>
        </div>
      </CardContent>
    </Card>
  );
}

export default function AdminDashboard() {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState('overview');
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalMerchants: 0,
    activeMerchants: 0,
    totalReviews: 0,
    avgRating: 0,
  });

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        // Fetch dashboard metrics from Supabase
        // or an aggregation service.
        
        // Get merchant count
        const { count: merchantCount, error: merchantError } = await supabase
          .from(TABLES.MERCHANT_PROFILES)
          .select('*', { count: 'exact', head: true });
        
        if (merchantError) {
          console.error('Error fetching merchant count:', merchantError);
        }
        
        // Get review session count (as a proxy for total reviews)
        const { count: reviewCount, error: reviewError } = await supabase
          .from(TABLES.REVIEW_SESSIONS)
          .select('*', { count: 'exact', head: true })
          .eq('review_posted', true);
          
        if (reviewError) {
          console.error('Error fetching review count:', reviewError);
        }
        
        // For active merchants and average rating, we would need more complex queries
        // This is simplified for demonstration
        
        setStats({
          totalMerchants: merchantCount || 0,
          activeMerchants: Math.floor((merchantCount || 0) * 0.8), // Simplified: assume 80% are active
          totalReviews: reviewCount || 0,
          avgRating: 4.7, // Placeholder value
        });
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  return (
    <AdminLayout
      title={t('admin.dashboard')}
      description={t('admin.dashboardDescription')}
    >
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">{t('admin.overview')}</TabsTrigger>
          <TabsTrigger value="merchants">{t('admin.merchantsStats')}</TabsTrigger>
          <TabsTrigger value="reviews">{t('admin.reviewsStats')}</TabsTrigger>
        </TabsList>
        
        <TabsContent value="overview" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <StatsCard
              title={t('admin.totalMerchants')}
              value={loading ? '...' : stats.totalMerchants.toString()}
              description={t('admin.fromAllTime')}
              icon={<Building2 className="h-4 w-4" />}
              change={{ value: 12, type: 'increase' }}
            />
            <StatsCard
              title={t('admin.activeMerchants')}
              value={loading ? '...' : stats.activeMerchants.toString()}
              description={t('admin.last30Days')}
              icon={<Building2 className="h-4 w-4" />}
              change={{ value: 5, type: 'increase' }}
            />
            <StatsCard
              title={t('admin.totalReviews')}
              value={loading ? '...' : stats.totalReviews.toString()}
              description={t('admin.fromAllTime')}
              icon={<Star className="h-4 w-4" />}
              change={{ value: 18, type: 'increase' }}
            />
            <StatsCard
              title={t('admin.averageRating')}
              value={loading ? '...' : stats.avgRating.toFixed(1)}
              description={t('admin.acrossAllReviews')}
              icon={<Percent className="h-4 w-4" />}
              change={{ value: 0.2, type: 'increase' }}
            />
          </div>
          
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
            <Card className="col-span-4">
              <CardHeader>
                <CardTitle>{t('admin.merchantGrowth')}</CardTitle>
                <CardDescription>
                  {t('admin.merchantGrowthDescription')}
                </CardDescription>
              </CardHeader>
              <CardContent className="pl-2">
                <div className="h-[200px] flex items-center justify-center text-muted-foreground">
                  {/* In a real implementation, this would be a chart component */}
                  <BarChart3 className="h-16 w-16" />
                  <span className="ml-2">{t('admin.chartPlaceholder')}</span>
                </div>
              </CardContent>
            </Card>
            <Card className="col-span-3">
              <CardHeader>
                <CardTitle>{t('admin.recentActivity')}</CardTitle>
                <CardDescription>
                  {t('admin.recentActivityDescription')}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {loading ? (
                    <p>{t('admin.loading')}</p>
                  ) : (
                    <>
                      <div className="flex items-center">
                        <div className="mr-2 h-2 w-2 rounded-full bg-green-500"></div>
                        <p className="text-sm">
                          {t('admin.newMerchantRegistered', {
                            name: 'Acme Corp',
                            time: '5 minutes ago',
                          })}
                        </p>
                      </div>
                      <div className="flex items-center">
                        <div className="mr-2 h-2 w-2 rounded-full bg-blue-500"></div>
                        <p className="text-sm">
                          {t('admin.newReviewSubmitted', {
                            merchant: 'Global Foods',
                            time: '10 minutes ago',
                          })}
                        </p>
                      </div>
                      <div className="flex items-center">
                        <div className="mr-2 h-2 w-2 rounded-full bg-amber-500"></div>
                        <p className="text-sm">
                          {t('admin.settingUpdated', {
                            setting: 'Default Language',
                            user: 'Admin',
                            time: '1 hour ago',
                          })}
                        </p>
                      </div>
                    </>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
        
        <TabsContent value="merchants" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>{t('admin.merchantDistribution')}</CardTitle>
              <CardDescription>
                {t('admin.merchantDistributionDescription')}
              </CardDescription>
            </CardHeader>
            <CardContent className="pl-2">
              <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                {/* In a real implementation, this would be a chart component */}
                <BarChart3 className="h-16 w-16" />
                <span className="ml-2">{t('admin.chartPlaceholder')}</span>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="reviews" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>{t('admin.reviewTrends')}</CardTitle>
              <CardDescription>
                {t('admin.reviewTrendsDescription')}
              </CardDescription>
            </CardHeader>
            <CardContent className="pl-2">
              <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                {/* In a real implementation, this would be a chart component */}
                <BarChart3 className="h-16 w-16" />
                <span className="ml-2">{t('admin.chartPlaceholder')}</span>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </AdminLayout>
  );
}