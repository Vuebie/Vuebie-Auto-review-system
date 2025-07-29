import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Button } from '../ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '../ui/dropdown-menu';
import {
  NavigationMenu,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  navigationMenuTriggerStyle,
} from '../ui/navigation-menu';
import { useAuth } from '@/contexts/AuthContext';
import { useEffect, useState } from 'react';
import { signOut } from '@/lib/auth';
import { ModeToggle } from '../theme/mode-toggle';
import { LanguageSelector } from '../lang/language-selector';
import { PanelLeftIcon } from 'lucide-react';
import { Sheet, SheetContent, SheetTrigger } from '../ui/sheet';
import { cn } from '@/lib/utils';
import Logo from './Logo';
import { toast } from 'sonner';
import { useTranslation } from 'react-i18next';

export default function MainNavbar() {
  const { user, profile, checkPermission } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { t } = useTranslation();
  const [canAccessAdmin, setCanAccessAdmin] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Check if user has admin permissions
  useEffect(() => {
    async function checkAdminAccess() {
      if (!user) return;
      const hasAccess = await checkPermission('users', 'view');
      setCanAccessAdmin(hasAccess);
    }
    checkAdminAccess();
  }, [user, checkPermission]);

  const handleSignOut = async () => {
    try {
      await signOut();
      navigate('/');
      toast.success(t('auth.signout_success'));
    } catch (error) {
      // Handle sign out error
      toast.error(t('auth.signout_error'));
    }
  };

  const isActive = (path: string) => {
    return location.pathname === path;
  };

  const mainNavItems = [
    { path: '/', label: t('nav.home') },
    ...(user
      ? [{ path: '/dashboard', label: t('nav.dashboard') }]
      : [
          { path: '/login', label: t('nav.login') },
          { path: '/register', label: t('nav.register') },
          { path: '/demo/accounts', label: t('nav.demo_accounts') }
        ])
  ];

  const userNavItems = [
    { path: '/profile', label: t('nav.profile') },
    { path: '/settings', label: t('nav.settings') },
    { path: '/subscription', label: t('nav.subscription') },
  ];

  if (canAccessAdmin) {
    userNavItems.push({ path: '/admin', label: t('nav.admin') });
  }

  return (
    <nav className="sticky top-0 z-40 w-full border-b bg-background/95 backdrop-blur">
      <div className="container flex h-16 items-center justify-between">
        <div className="flex items-center">
          <Link to="/" className="mr-6 flex items-center space-x-2">
            <Logo />
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex">
            <NavigationMenu>
              <NavigationMenuList>
                {mainNavItems.map((item) => (
                  <NavigationMenuItem key={item.path}>
                    <NavigationMenuLink
                      asChild
                      className={cn(
                        navigationMenuTriggerStyle(),
                        isActive(item.path) &&
                          'bg-accent text-accent-foreground'
                      )}
                    >
                      <Link to={item.path}>{item.label}</Link>
                    </NavigationMenuLink>
                  </NavigationMenuItem>
                ))}
              </NavigationMenuList>
            </NavigationMenu>
          </div>
        </div>

        {/* Right side items */}
        <div className="flex items-center gap-2">
          <LanguageSelector />
          <ModeToggle />

          {user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  className="relative h-8 w-8 rounded-full"
                >
                  <Avatar className="h-8 w-8">
                    <AvatarImage
                      src={user.user_metadata?.avatar_url || ''}
                      alt={user.user_metadata?.full_name || 'User'}
                    />
                    <AvatarFallback>
                      {user.user_metadata?.first_name?.[0] ||
                        user.email?.[0]?.toUpperCase() ||
                        'U'}
                    </AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56" align="end" forceMount>
                <DropdownMenuLabel className="font-normal">
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium leading-none">
                      {user.user_metadata?.first_name}{' '}
                      {user.user_metadata?.last_name}
                    </p>
                    <p className="text-xs leading-none text-muted-foreground">
                      {user.email}
                    </p>
                    {profile?.business_name && (
                      <p className="text-xs font-medium text-muted-foreground">
                        {profile.business_name}
                      </p>
                    )}
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                {userNavItems.map((item) => (
                  <DropdownMenuItem key={item.path} asChild>
                    <Link to={item.path}>{item.label}</Link>
                  </DropdownMenuItem>
                ))}
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  className="cursor-pointer"
                  onClick={handleSignOut}
                >
                  {t('nav.logout')}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <div className="hidden md:block">
              <Button variant="default" asChild className="ml-2">
                <Link to="/login">{t('nav.login')}</Link>
              </Button>
            </div>
          )}

          {/* Mobile menu button */}
          <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
            <SheetTrigger asChild>
              <Button variant="outline" size="icon" className="md:hidden">
                <PanelLeftIcon className="h-[1.2rem] w-[1.2rem]" />
                <span className="sr-only">Toggle menu</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="left">
              <Link to="/" className="flex items-center space-x-2 mb-8">
                <Logo />
              </Link>
              <div className="flex flex-col space-y-4">
                {mainNavItems.map((item) => (
                  <Link
                    key={item.path}
                    to={item.path}
                    className={cn(
                      'text-sm font-medium transition-colors hover:text-primary',
                      isActive(item.path)
                        ? 'text-primary'
                        : 'text-muted-foreground'
                    )}
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    {item.label}
                  </Link>
                ))}
                {user &&
                  userNavItems.map((item) => (
                    <Link
                      key={item.path}
                      to={item.path}
                      className={cn(
                        'text-sm font-medium transition-colors hover:text-primary',
                        isActive(item.path)
                          ? 'text-primary'
                          : 'text-muted-foreground'
                      )}
                      onClick={() => setIsMobileMenuOpen(false)}
                    >
                      {item.label}
                    </Link>
                  ))}
                {user && (
                  <Button
                    variant="ghost"
                    className="justify-start px-2"
                    onClick={() => {
                      handleSignOut();
                      setIsMobileMenuOpen(false);
                    }}
                  >
                    {t('nav.logout')}
                  </Button>
                )}
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </nav>
  );
}