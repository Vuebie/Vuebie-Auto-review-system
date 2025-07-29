import { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import Header from './Header';
import { Toaster } from '@/components/ui/sonner';

interface MainLayoutProps {
  children: ReactNode;
  hideHeader?: boolean;
  className?: string;
}

export default function MainLayout({ 
  children, 
  hideHeader = false,
  className = '' 
}: MainLayoutProps) {
  const { t } = useTranslation();
  
  return (
    <div className="min-h-screen flex flex-col">
      {!hideHeader && <Header />}
      <main className={`flex-grow ${className}`}>
        {children}
      </main>
      <footer className="py-6 border-t">
        <div className="container mx-auto px-4 text-center text-sm text-muted-foreground">
          <p>{t('footer.copyright', { year: new Date().getFullYear() })}</p>
        </div>
      </footer>
      <Toaster />
    </div>
  );
}