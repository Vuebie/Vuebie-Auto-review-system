import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { QrCode, Star, Users, BarChart3, Plus, ArrowUpRight } from 'lucide-react';
import { supabase, TABLES } from '@/lib/supabase';

// Types for dashboard stats
interface DashboardStats {
  totalOutlets: number;
  totalQrCodes: number;
  totalReviews: number;
  reviewsThisMonth: number;
  averageRating: number;
}

export default function DashboardPage() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState<DashboardStats>({
    totalOutlets: 0,
    totalQrCodes: 0,
    totalReviews: 0,
    reviewsThisMonth: 0,
    averageRating: 0,
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Redirect if not logged in or not a merchant
    if (user && user.role !== 'merchant') {
      navigate('/');
    }
  }, [user, navigate]);

  useEffect(() => {
    const fetchDashboardStats = async () => {
      if (!user?.user?.id) return;
      
      setIsLoading(true);
      try {
        // Get total outlets
        const { data: outlets, error: outletsError } = await supabase
          .from(TABLES.OUTLETS)
          .select('id')
          .eq('merchant_id', user.user.id);
        
        if (outletsError) throw outletsError;
        
        // Get total QR codes
        const { data: qrCodes, error: qrCodesError } = await supabase
          .from(TABLES.QR_CODES)
          .select('id')
          .eq('merchant_id', user.user.id);
        
        if (qrCodesError) throw qrCodesError;
        
        // Get reviews count and average rating
        const { data: reviewsData, error: reviewsError } = await supabase
          .from(TABLES.REVIEW_SESSIONS)
          .select('id, rating, created_at')
          .eq('merchant_id', user.user.id);
        
        if (reviewsError) throw reviewsError;
        
        // Calculate reviews this month
        const now = new Date();
        const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        const reviewsThisMonth = reviewsData.filter(
          (review) => new Date(review.created_at) >= firstDayOfMonth
        ).length;
        
        // Calculate average rating
        const totalRating = reviewsData.reduce((sum, review) => sum + (review.rating || 0), 0);
        const averageRating = reviewsData.length > 0 ? totalRating / reviewsData.length : 0;
        
        setStats({
          totalOutlets: outlets.length,
          totalQrCodes: qrCodes.length,
          totalReviews: reviewsData.length,
          reviewsThisMonth,
          averageRating: parseFloat(averageRating.toFixed(1)),
        });
      } catch (error) {
        console.error('Error fetching dashboard stats:', error);
      } finally {
        setIsLoading(false);
      }
    };

    if (user?.user?.id) {
      fetchDashboardStats();
    }
  }, [user?.user?.id]);

  return (
    <DashboardLayout
      title={t('dashboard.title')}
      description={t('dashboard.welcomeMessage', { businessName: user?.merchantProfile?.business_name || '' })}
    >
      {/* Quick Stats */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {t('dashboard.totalOutlets')}
            </CardTitle>
            <Building2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="h-8 bg-muted/50 rounded animate-pulse"></div>
            ) : (
              <div className="text-2xl font-bold">{stats.totalOutlets}</div>
            )}
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {t('dashboard.totalQrCodes')}
            </CardTitle>
            <QrCode className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="h-8 bg-muted/50 rounded animate-pulse"></div>
            ) : (
              <div className="text-2xl font-bold">{stats.totalQrCodes}</div>
            )}
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {t('dashboard.totalReviews')}
            </CardTitle>
            <Star className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="h-8 bg-muted/50 rounded animate-pulse"></div>
            ) : (
              <div className="text-2xl font-bold">{stats.totalReviews}</div>
            )}
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {t('dashboard.averageRating')}
            </CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="h-8 bg-muted/50 rounded animate-pulse"></div>
            ) : (
              <div className="flex items-baseline">
                <span className="text-2xl font-bold">{stats.averageRating}</span>
                <span className="text-muted-foreground text-sm ml-1">/5</span>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <div className="mb-8">
        <h2 className="text-lg font-semibold mb-4">{t('dashboard.quickActions')}</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Button 
            onClick={() => navigate('/outlets/new')} 
            variant="outline" 
            className="justify-start"
          >
            <Plus className="mr-2 h-4 w-4" />
            {t('dashboard.addOutlet')}
          </Button>
          
          <Button 
            onClick={() => navigate('/qr-codes/new')} 
            variant="outline" 
            className="justify-start"
          >
            <QrCode className="mr-2 h-4 w-4" />
            {t('dashboard.createQrCode')}
          </Button>
          
          <Button 
            onClick={() => navigate('/incentives/new')} 
            variant="outline" 
            className="justify-start"
          >
            <Gift className="mr-2 h-4 w-4" />
            {t('dashboard.setupIncentive')}
          </Button>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Recent Reviews */}
        <Card className="col-span-1">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>{t('dashboard.recentReviews')}</CardTitle>
              <CardDescription>
                {t('dashboard.reviewsThisMonth', { count: stats.reviewsThisMonth })}
              </CardDescription>
            </div>
            <Button
              variant="ghost"
              size="sm"
              className="gap-1"
              onClick={() => navigate('/analytics')}
            >
              {t('dashboard.viewAll')}
              <ArrowUpRight className="h-4 w-4" />
            </Button>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-4">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="h-16 bg-muted/50 rounded animate-pulse"></div>
                ))}
              </div>
            ) : stats.totalReviews === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <p>{t('dashboard.noReviews')}</p>
                <Button 
                  variant="link" 
                  onClick={() => navigate('/qr-codes/new')}
                  className="mt-2"
                >
                  {t('dashboard.createFirstQrCode')}
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                {/* Placeholder for recent reviews - would be populated from API */}
                <p className="text-sm text-muted-foreground">
                  {t('dashboard.loadingReviews')}
                </p>
              </div>
            )}
          </CardContent>
        </Card>
        
        {/* Getting Started */}
        <Card className="col-span-1">
          <CardHeader>
            <CardTitle>{t('dashboard.gettingStarted')}</CardTitle>
            <CardDescription>
              {t('dashboard.followStepsBelow')}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-start">
                <div className="flex items-center justify-center rounded-full w-8 h-8 bg-primary/10 text-primary mr-4">
                  1
                </div>
                <div>
                  <h3 className="font-medium">{t('dashboard.step1Title')}</h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    {t('dashboard.step1Description')}
                  </p>
                  <Button 
                    variant="link" 
                    className="px-0 h-auto mt-1"
                    onClick={() => navigate('/outlets/new')}
                  >
                    {t('dashboard.addOutletButton')}
                  </Button>
                </div>
              </div>
              
              <div className="flex items-start">
                <div className="flex items-center justify-center rounded-full w-8 h-8 bg-primary/10 text-primary mr-4">
                  2
                </div>
                <div>
                  <h3 className="font-medium">{t('dashboard.step2Title')}</h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    {t('dashboard.step2Description')}
                  </p>
                  <Button 
                    variant="link" 
                    className="px-0 h-auto mt-1"
                    onClick={() => navigate('/templates')}
                  >
                    {t('dashboard.customizeTemplateButton')}
                  </Button>
                </div>
              </div>
              
              <div className="flex items-start">
                <div className="flex items-center justify-center rounded-full w-8 h-8 bg-primary/10 text-primary mr-4">
                  3
                </div>
                <div>
                  <h3 className="font-medium">{t('dashboard.step3Title')}</h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    {t('dashboard.step3Description')}
                  </p>
                  <Button 
                    variant="link" 
                    className="px-0 h-auto mt-1"
                    onClick={() => navigate('/qr-codes/new')}
                  >
                    {t('dashboard.createQrCodeButton')}
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}

// Import missing components
function Building2(props: React.SVGProps<SVGSVGElement>) {
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
      <path d="M6 22V2a1 1 0 0 1 1-1h6a1 1 0 0 1 1 1v20" />
      <path d="M18 22V9a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1v13" />
      <path d="M2 22h20" />
      <path d="M9 6h1v1H9zM9 10h1v1H9zM9 14h1v1H9zM14 6h1v1h-1zM14 10h1v1h-1zM14 14h1v1h-1zM19 10h1v1h-1zM19 14h1v1h-1z" />
    </svg>
  );
}

function Gift(props: React.SVGProps<SVGSVGElement>) {
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
      <path d="M20 12v10H4V12" />
      <path d="M2 7h20v5H2z" />
      <path d="M12 22V7" />
      <path d="M12 7H7.5a2.5 2.5 0 0 1 0-5C11 2 12 7 12 7z" />
      <path d="M12 7h4.5a2.5 2.5 0 0 0 0-5C13 2 12 7 12 7z" />
    </svg>
  );
}