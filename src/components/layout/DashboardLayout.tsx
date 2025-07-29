import { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import MainLayout from './MainLayout';
import {
  BarChart3,
  Building2,
  QrCode,
  Gift,
  Settings,
  FileText,
  Home,
  User,
  CreditCard,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

interface DashboardLayoutProps {
  children: ReactNode;
  title?: string;
  description?: string;
}

export default function DashboardLayout({
  children,
  title,
  description,
}: DashboardLayoutProps) {
  const { t } = useTranslation();
  const { user } = useAuth();
  const location = useLocation();

  // Navigation items for the sidebar
  const navigation = [
    {
      name: t('dashboard.overview'),
      href: '/dashboard',
      icon: Home,
      current: location.pathname === '/dashboard',
    },
    {
      name: t('dashboard.outlets'),
      href: '/outlets',
      icon: Building2,
      current: location.pathname.startsWith('/outlets'),
    },
    {
      name: t('dashboard.qrCodes'),
      href: '/qr-codes',
      icon: QrCode,
      current: location.pathname.startsWith('/qr-codes'),
    },
    {
      name: t('dashboard.incentives'),
      href: '/incentives',
      icon: Gift,
      current: location.pathname.startsWith('/incentives'),
    },
    {
      name: t('dashboard.templates'),
      href: '/templates',
      icon: FileText,
      current: location.pathname.startsWith('/templates'),
    },
    {
      name: t('dashboard.analytics'),
      href: '/analytics',
      icon: BarChart3,
      current: location.pathname.startsWith('/analytics'),
    },
  ];

  // Settings and profile navigation
  const secondaryNavigation = [
    {
      name: t('dashboard.profile'),
      href: '/profile',
      icon: User,
      current: location.pathname === '/profile',
    },
    {
      name: t('dashboard.settings'),
      href: '/settings',
      icon: Settings,
      current: location.pathname === '/settings',
    },
    {
      name: t('dashboard.subscription'),
      href: '/subscription',
      icon: CreditCard,
      current: location.pathname === '/subscription',
    },
  ];

  // If user is not merchant, display appropriate message
  if (user && user.role !== 'merchant') {
    return (
      <MainLayout>
        <div className="container mx-auto px-4 py-10 text-center">
          <h1 className="text-2xl font-bold mb-4">{t('dashboard.accessDenied')}</h1>
          <p className="mb-6">{t('dashboard.merchantOnly')}</p>
          <Button asChild>
            <Link to="/">{t('dashboard.backToHome')}</Link>
          </Button>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout className="p-0">
      <div className="flex h-screen overflow-hidden">
        {/* Sidebar for medium screens and above */}
        <div className="hidden md:flex md:w-64 md:flex-col">
          <div className="flex flex-col flex-grow pt-5 bg-background border-r overflow-y-auto">
            <div className="flex items-center flex-shrink-0 px-4 mb-5">
              <span className="text-xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                Vuebie
              </span>
            </div>
            <div className="mt-5 flex-grow flex flex-col">
              <nav className="flex-1 px-2 pb-4 space-y-1">
                {navigation.map((item) => (
                  <Link
                    key={item.name}
                    to={item.href}
                    className={cn(
                      item.current
                        ? 'bg-muted text-primary'
                        : 'text-muted-foreground hover:bg-muted hover:text-foreground',
                      'group flex items-center px-2 py-2 text-sm font-medium rounded-md'
                    )}
                  >
                    <item.icon
                      className={cn(
                        item.current ? 'text-primary' : 'text-muted-foreground group-hover:text-foreground',
                        'mr-3 flex-shrink-0 h-5 w-5'
                      )}
                      aria-hidden="true"
                    />
                    {item.name}
                  </Link>
                ))}
              </nav>
              <div className="border-t pt-4 px-2 pb-4">
                <nav className="flex-1 space-y-1">
                  {secondaryNavigation.map((item) => (
                    <Link
                      key={item.name}
                      to={item.href}
                      className={cn(
                        item.current
                          ? 'bg-muted text-primary'
                          : 'text-muted-foreground hover:bg-muted hover:text-foreground',
                        'group flex items-center px-2 py-2 text-sm font-medium rounded-md'
                      )}
                    >
                      <item.icon
                        className={cn(
                          item.current ? 'text-primary' : 'text-muted-foreground group-hover:text-foreground',
                          'mr-3 flex-shrink-0 h-5 w-5'
                        )}
                        aria-hidden="true"
                      />
                      {item.name}
                    </Link>
                  ))}
                </nav>
              </div>
            </div>
          </div>
        </div>

        {/* Mobile sidebar & main content */}
        <div className="flex flex-col flex-1 w-0 overflow-hidden">
          {/* Mobile nav */}
          <div className="md:hidden border-b bg-background">
            <div className="flex items-center justify-between h-16 px-4">
              <span className="text-xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                Vuebie
              </span>
              <TooltipProvider>
                <div className="flex space-x-2">
                  {navigation.map((item) => (
                    <Tooltip key={item.name}>
                      <TooltipTrigger asChild>
                        <Button
                          variant={item.current ? "default" : "ghost"}
                          size="icon"
                          asChild
                        >
                          <Link to={item.href}>
                            <item.icon className="h-5 w-5" />
                            <span className="sr-only">{item.name}</span>
                          </Link>
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>{item.name}</p>
                      </TooltipContent>
                    </Tooltip>
                  ))}
                </div>
              </TooltipProvider>
            </div>
          </div>

          {/* Main content area */}
          <main className="flex-1 relative focus:outline-none overflow-y-auto bg-background">
            <div className="py-6">
              <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
                {(title || description) && (
                  <div className="mb-6">
                    {title && <h1 className="text-2xl font-semibold text-foreground">{title}</h1>}
                    {description && <p className="mt-1 text-sm text-muted-foreground">{description}</p>}
                  </div>
                )}
                {children}
              </div>
            </div>
          </main>
        </div>
      </div>
    </MainLayout>
  );
}