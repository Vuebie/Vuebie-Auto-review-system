import { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import MainLayout from '@/components/layout/MainLayout';
import {
  BarChart3,
  Building2,
  Settings,
  Users,
  ShieldCheck,
  Database,
  Home,
  User,
  ClipboardList,
  Activity,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

interface AdminLayoutProps {
  children: ReactNode;
  title?: string;
  description?: string;
}

export default function AdminLayout({
  children,
  title,
  description,
}: AdminLayoutProps) {
  const { t } = useTranslation();
  const { user } = useAuth();
  const location = useLocation();

  // Navigation items for the admin sidebar
  const navigation = [
    {
      name: t('admin.dashboard'),
      href: '/admin',
      icon: Home,
      current: location.pathname === '/admin',
    },
    {
      name: t('admin.merchants'),
      href: '/admin/merchants',
      icon: Building2,
      current: location.pathname.startsWith('/admin/merchants'),
    },
    {
      name: t('admin.users'),
      href: '/admin/users',
      icon: Users,
      current: location.pathname.startsWith('/admin/users'),
    },
    {
      name: t('admin.roles'),
      href: '/admin/roles',
      icon: ShieldCheck,
      current: location.pathname.startsWith('/admin/roles'),
    },
    {
      name: t('admin.settings'),
      href: '/admin/settings',
      icon: Settings,
      current: location.pathname.startsWith('/admin/settings'),
    },
    {
      name: t('admin.analytics'),
      href: '/admin/analytics',
      icon: BarChart3,
      current: location.pathname.startsWith('/admin/analytics'),
    },
    {
      name: t('admin.auditLogs'),
      href: '/admin/audit-logs',
      icon: ClipboardList,
      current: location.pathname.startsWith('/admin/audit-logs'),
    },
  ];

  // Secondary navigation for admin profile and system status
  const secondaryNavigation = [
    {
      name: t('admin.profile'),
      href: '/admin/profile',
      icon: User,
      current: location.pathname === '/admin/profile',
    },
    {
      name: t('admin.systemStatus'),
      href: '/admin/system-status',
      icon: Activity,
      current: location.pathname === '/admin/system-status',
    },
  ];

  // Check if user is a super_admin
  if (!user || user.role !== 'super_admin') {
    return (
      <MainLayout>
        <div className="container mx-auto px-4 py-10 text-center">
          <h1 className="text-2xl font-bold mb-4">{t('admin.accessDenied')}</h1>
          <p className="mb-6">{t('admin.superAdminOnly')}</p>
          <Button asChild>
            <Link to="/">{t('admin.backToHome')}</Link>
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
                Vuebie Admin
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
          {/* Mobile header */}
          <div className="md:hidden border-b bg-background">
            <div className="flex items-center justify-between h-16 px-4">
              <span className="text-xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                Vuebie Admin
              </span>
              <Button
                variant="ghost"
                size="icon"
                className="md:hidden"
                onClick={() => {
                  const nav = document.getElementById('mobile-nav');
                  if (nav) {
                    nav.classList.toggle('hidden');
                  }
                }}
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-6 w-6"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 6h16M4 12h16M4 18h16"
                  />
                </svg>
                <span className="sr-only">Open menu</span>
              </Button>
            </div>
            
            {/* Mobile navigation menu */}
            <div id="mobile-nav" className="hidden px-2 pt-2 pb-3 space-y-1">
              {navigation.map((item) => (
                <Link
                  key={item.name}
                  to={item.href}
                  className={cn(
                    item.current
                      ? 'bg-muted text-primary'
                      : 'text-muted-foreground hover:bg-muted hover:text-foreground',
                    'block px-3 py-2 rounded-md text-base font-medium'
                  )}
                >
                  <div className="flex items-center">
                    <item.icon
                      className={cn(
                        item.current ? 'text-primary' : 'text-muted-foreground',
                        'mr-3 flex-shrink-0 h-5 w-5'
                      )}
                      aria-hidden="true"
                    />
                    {item.name}
                  </div>
                </Link>
              ))}
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