import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import MainLayout from '@/components/layout/MainLayout';
import { Button } from '@/components/ui/button';

export default function NotFoundPage() {
  const { t } = useTranslation();
  
  return (
    <MainLayout>
      <div className="flex flex-col items-center justify-center min-h-[70vh] text-center px-4">
        <h1 className="text-9xl font-bold text-primary">404</h1>
        <h2 className="text-3xl font-bold mt-8 mb-4">{t('notFound.title')}</h2>
        <p className="text-muted-foreground max-w-md mb-8">
          {t('notFound.message')}
        </p>
        <Button asChild>
          <Link to="/">{t('notFound.backButton')}</Link>
        </Button>
      </div>
    </MainLayout>
  );
}