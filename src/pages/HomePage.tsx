import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import MainLayout from '@/components/layout/MainLayout';
import { Button } from '@/components/ui/button';
import { QrCode, Star, Users, BarChart3 } from 'lucide-react';

export default function HomePage() {
  const { t } = useTranslation();
  const { user } = useAuth();
  
  return (
    <MainLayout>
      {/* Hero Section */}
      <section className="py-20 px-4">
        <div className="container mx-auto text-center max-w-3xl">
          <h1 className="text-5xl font-bold mb-6 bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
            {t('home.hero.title')}
          </h1>
          <p className="text-xl text-muted-foreground mb-8">
            {t('home.hero.subtitle')}
          </p>
          
          <div className="flex flex-col sm:flex-row justify-center gap-4 mb-12">
            {user ? (
              <Button asChild size="lg">
                <Link to="/dashboard">
                  {t('home.hero.dashboardButton')}
                </Link>
              </Button>
            ) : (
              <>
                <Button asChild size="lg">
                  <Link to="/register">
                    {t('home.hero.registerButton')}
                  </Link>
                </Button>
                <Button asChild variant="outline" size="lg">
                  <Link to="/login">
                    {t('home.hero.loginButton')}
                  </Link>
                </Button>
              </>
            )}
          </div>
          
          <div className="relative">
            <div className="absolute -inset-0.5 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-lg blur opacity-30"></div>
            <div className="relative bg-card border rounded-lg shadow-lg overflow-hidden">
              <img 
                src="/images/dashboard.jpg" 
                alt={t('home.hero.previewAlt')}
                className="w-full"
                onError={(e) => {
                  // Fallback if image fails to load
                  (e.target as HTMLImageElement).style.height = '300px';
                  (e.target as HTMLImageElement).style.display = 'flex';
                  (e.target as HTMLImageElement).style.alignItems = 'center';
                  (e.target as HTMLImageElement).style.justifyContent = 'center';
                  (e.target as HTMLImageElement).style.backgroundColor = 'rgba(0,0,0,0.05)';
                  (e.target as HTMLImageElement).src = 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="18" height="18" x="3" y="3" rx="2"/><path d="M3 9h18"/><path d="M9 21V9"/></svg>';
                }}
              />
            </div>
          </div>
        </div>
      </section>
      
      {/* Features Section */}
      <section className="py-16 bg-muted/50">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12">
            {t('home.features.title')}
          </h2>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            <div className="bg-card border rounded-lg p-6 shadow-sm">
              <div className="rounded-full bg-primary/10 p-3 w-12 h-12 flex items-center justify-center mb-4">
                <QrCode className="h-6 w-6 text-primary" />
              </div>
              <h3 className="text-xl font-semibold mb-3">
                {t('home.features.qrTitle')}
              </h3>
              <p className="text-muted-foreground">
                {t('home.features.qrDescription')}
              </p>
            </div>
            
            <div className="bg-card border rounded-lg p-6 shadow-sm">
              <div className="rounded-full bg-primary/10 p-3 w-12 h-12 flex items-center justify-center mb-4">
                <Star className="h-6 w-6 text-primary" />
              </div>
              <h3 className="text-xl font-semibold mb-3">
                {t('home.features.reviewTitle')}
              </h3>
              <p className="text-muted-foreground">
                {t('home.features.reviewDescription')}
              </p>
            </div>
            
            <div className="bg-card border rounded-lg p-6 shadow-sm">
              <div className="rounded-full bg-primary/10 p-3 w-12 h-12 flex items-center justify-center mb-4">
                <Users className="h-6 w-6 text-primary" />
              </div>
              <h3 className="text-xl font-semibold mb-3">
                {t('home.features.incentivesTitle')}
              </h3>
              <p className="text-muted-foreground">
                {t('home.features.incentivesDescription')}
              </p>
            </div>
            
            <div className="bg-card border rounded-lg p-6 shadow-sm">
              <div className="rounded-full bg-primary/10 p-3 w-12 h-12 flex items-center justify-center mb-4">
                <BarChart3 className="h-6 w-6 text-primary" />
              </div>
              <h3 className="text-xl font-semibold mb-3">
                {t('home.features.analyticsTitle')}
              </h3>
              <p className="text-muted-foreground">
                {t('home.features.analyticsDescription')}
              </p>
            </div>
          </div>
        </div>
      </section>
      
      {/* How It Works Section */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-4">
            {t('home.howItWorks.title')}
          </h2>
          <p className="text-center text-muted-foreground mb-12 max-w-2xl mx-auto">
            {t('home.howItWorks.subtitle')}
          </p>
          
          <div className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto">
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-primary text-white text-xl font-bold mb-4">1</div>
              <h3 className="text-xl font-semibold mb-2">{t('home.howItWorks.step1.title')}</h3>
              <p className="text-muted-foreground">{t('home.howItWorks.step1.description')}</p>
            </div>
            
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-primary text-white text-xl font-bold mb-4">2</div>
              <h3 className="text-xl font-semibold mb-2">{t('home.howItWorks.step2.title')}</h3>
              <p className="text-muted-foreground">{t('home.howItWorks.step2.description')}</p>
            </div>
            
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-primary text-white text-xl font-bold mb-4">3</div>
              <h3 className="text-xl font-semibold mb-2">{t('home.howItWorks.step3.title')}</h3>
              <p className="text-muted-foreground">{t('home.howItWorks.step3.description')}</p>
            </div>
          </div>
        </div>
      </section>
      
      {/* CTA Section */}
      <section className="py-20 bg-primary text-primary-foreground">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold mb-6">
            {t('home.cta.title')}
          </h2>
          <p className="text-xl mb-8 max-w-2xl mx-auto">
            {t('home.cta.subtitle')}
          </p>
          {!user && (
            <Button asChild size="lg" variant="secondary">
              <Link to="/register">
                {t('home.cta.button')}
              </Link>
            </Button>
          )}
        </div>
      </section>
    </MainLayout>
  );
}