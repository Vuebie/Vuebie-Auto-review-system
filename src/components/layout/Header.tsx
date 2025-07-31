import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/contexts/AuthContext';

import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
  navigationMenuTriggerStyle,
} from '@/components/ui/navigation-menu';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { getSupportedLanguages, changeLanguage, getCurrentLanguage } from '@/i18n';
import { signOut } from '@/lib/auth';

export default function Header() {
  const { t } = useTranslation();
  const { user, profile } = useAuth();
  const [languageMenuOpen, setLanguageMenuOpen] = useState(false);

  const languages = getSupportedLanguages();
  const currentLang = getCurrentLanguage();

  const handleLanguageChange = (langCode: string) => {
    changeLanguage(langCode);
    setLanguageMenuOpen(false);
  };

  const handleSignOut = async () => {
    try {
      await signOut();
    } catch (error) {
      // Handle sign out error
    }
  };

  // Get user initials for avatar
  const getInitials = () => {
    if (!user) return '?';
    
    const name = user.user_metadata?.full_name || user.email || '';
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .substring(0, 2);
  };

  return (
    <header className="border-b">
      <div className="container mx-auto px-4 py-3 flex items-center justify-between">
        {/* Logo */}
        <Link to="/" className="flex items-center">
          <span className="text-xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
            Vuebie
          </span>
        </Link>

        {/* Navigation */}
        <NavigationMenu>
          <NavigationMenuList>
            {user && user.role === 'merchant' && (
              <>
                <NavigationMenuItem>
                  <NavigationMenuTrigger>{t('header.dashboard')}</NavigationMenuTrigger>
                  <NavigationMenuContent>
                    <ul className="grid w-[400px] gap-3 p-4 md:grid-cols-2">
                      <li>
                        <NavigationMenuLink asChild>
                          <Link 
                            to="/dashboard" 
                            className="block select-none space-y-1 rounded-md p-3 leading-none no-underline outline-none transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground"
                          >
                            <div className="text-sm font-medium leading-none">{t('header.overview')}</div>
                            <p className="line-clamp-2 text-sm leading-snug text-muted-foreground">
                              {t('header.overviewDescription')}
                            </p>
                          </Link>
                        </NavigationMenuLink>
                      </li>
                      <li>
                        <NavigationMenuLink asChild>
                          <Link 
                            to="/outlets" 
                            className="block select-none space-y-1 rounded-md p-3 leading-none no-underline outline-none transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground"
                          >
                            <div className="text-sm font-medium leading-none">{t('header.outlets')}</div>
                            <p className="line-clamp-2 text-sm leading-snug text-muted-foreground">
                              {t('header.outletsDescription')}
                            </p>
                          </Link>
                        </NavigationMenuLink>
                      </li>
                      <li>
                        <NavigationMenuLink asChild>
                          <Link 
                            to="/qr-codes" 
                            className="block select-none space-y-1 rounded-md p-3 leading-none no-underline outline-none transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground"
                          >
                            <div className="text-sm font-medium leading-none">{t('header.qrCodes')}</div>
                            <p className="line-clamp-2 text-sm leading-snug text-muted-foreground">
                              {t('header.qrCodesDescription')}
                            </p>
                          </Link>
                        </NavigationMenuLink>
                      </li>
                      <li>
                        <NavigationMenuLink asChild>
                          <Link 
                            to="/incentives" 
                            className="block select-none space-y-1 rounded-md p-3 leading-none no-underline outline-none transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground"
                          >
                            <div className="text-sm font-medium leading-none">{t('header.incentives')}</div>
                            <p className="line-clamp-2 text-sm leading-snug text-muted-foreground">
                              {t('header.incentivesDescription')}
                            </p>
                          </Link>
                        </NavigationMenuLink>
                      </li>
                    </ul>
                  </NavigationMenuContent>
                </NavigationMenuItem>
                <NavigationMenuItem>
                  <Link to="/templates" className={navigationMenuTriggerStyle()}>
                    {t('header.templates')}
                  </Link>
                </NavigationMenuItem>
                <NavigationMenuItem>
                  <Link to="/analytics" className={navigationMenuTriggerStyle()}>
                    {t('header.analytics')}
                  </Link>
                </NavigationMenuItem>
              </>
            )}
          </NavigationMenuList>
        </NavigationMenu>

        {/* Right side - User or Sign In */}
        <div className="flex items-center space-x-4">
          {/* Language Selector */}
          <DropdownMenu open={languageMenuOpen} onOpenChange={setLanguageMenuOpen}>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="gap-1">
                <span className="uppercase">{currentLang}</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-40">
              {languages.map((lang) => (
                <DropdownMenuItem
                  key={lang.code}
                  onClick={() => handleLanguageChange(lang.code)}
                  className={lang.code === currentLang ? 'bg-muted' : ''}
                >
                  {lang.name}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          {user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="rounded-full">
                  <Avatar className="h-8 w-8">
                    <AvatarFallback>{getInitials()}</AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <div className="px-2 py-1.5 text-sm font-medium">
                  {user.user_metadata?.full_name || user.email}
                </div>
                <div className="px-2 py-1 text-xs text-muted-foreground">
                  {user.role === 'merchant' && profile?.business_name}
                </div>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link to="/profile">{t('header.profile')}</Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link to="/settings">{t('header.settings')}</Link>
                </DropdownMenuItem>
                {user.role === 'merchant' && (
                  <DropdownMenuItem asChild>
                    <Link to="/subscription">{t('header.subscription')}</Link>
                  </DropdownMenuItem>
                )}
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleSignOut}>
                  {t('auth.signOut')}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <Button asChild variant="default">
              <Link to="/login">{t('auth.signIn')}</Link>
            </Button>
          )}
        </div>
      </div>
    </header>
  );
}