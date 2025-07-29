import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { useAuth } from '@/contexts/AuthContext';

import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { Check, Loader2, Smartphone } from 'lucide-react';

export default function SettingsPage() {
  const { t, i18n } = useTranslation();
  const { user } = useAuth();
  const [isSaving, setIsSaving] = useState(false);
  
  // Settings states
  const [language, setLanguage] = useState(i18n.language);
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [newReviewNotification, setNewReviewNotification] = useState(true);
  const [marketingEmails, setMarketingEmails] = useState(false);
  const [primaryColor, setPrimaryColor] = useState('#2563eb');
  const [apiKey, setApiKey] = useState('•••••••••••••••••');
  
  const handleLanguageChange = (value: string) => {
    setLanguage(value);
    i18n.changeLanguage(value);
  };

  const handleSaveSettings = async () => {
    setIsSaving(true);
    
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    toast.success(t('settings.saveSuccess'));
    setIsSaving(false);
  };

  const handleGenerateApiKey = async () => {
    // Simulate API key generation
    setApiKey('•••••••••••••••••');
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // This would be a real API key in production
    setApiKey('aiv_' + Math.random().toString(36).substring(2, 15));
    toast.success(t('settings.apiKeyGenerated'));
  };

  return (
    <DashboardLayout
      title={t('settings.title')}
      description={t('settings.description')}
    >
      <Tabs defaultValue="general">
        <TabsList>
          <TabsTrigger value="general">{t('settings.tabs.general')}</TabsTrigger>
          <TabsTrigger value="notifications">{t('settings.tabs.notifications')}</TabsTrigger>
          <TabsTrigger value="appearance">{t('settings.tabs.appearance')}</TabsTrigger>
          <TabsTrigger value="api">{t('settings.tabs.api')}</TabsTrigger>
        </TabsList>
        
        <div className="mt-6 space-y-8">
          <TabsContent value="general">
            <Card>
              <CardHeader>
                <CardTitle>{t('settings.generalSettings')}</CardTitle>
                <CardDescription>{t('settings.generalSettingsDescription')}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Language Selection */}
                <div className="space-y-2">
                  <Label htmlFor="language">{t('settings.language')}</Label>
                  <Select
                    value={language}
                    onValueChange={handleLanguageChange}
                  >
                    <SelectTrigger id="language" className="w-full sm:w-[240px]">
                      <SelectValue placeholder={t('settings.selectLanguage')} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="en">English</SelectItem>
                      <SelectItem value="zh">中文 (Chinese)</SelectItem>
                      <SelectItem value="vi">Tiếng Việt (Vietnamese)</SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-sm text-muted-foreground">{t('settings.languageDescription')}</p>
                </div>
                
                {/* Timezone Selection - Placeholder */}
                <div className="space-y-2">
                  <Label htmlFor="timezone">{t('settings.timezone')}</Label>
                  <Select defaultValue="auto">
                    <SelectTrigger id="timezone" className="w-full sm:w-[240px]">
                      <SelectValue placeholder={t('settings.selectTimezone')} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="auto">{t('settings.autoTimezone')}</SelectItem>
                      <SelectItem value="utc">UTC</SelectItem>
                      <SelectItem value="asia/ho_chi_minh">Asia/Ho_Chi_Minh (GMT+7)</SelectItem>
                      <SelectItem value="asia/shanghai">Asia/Shanghai (GMT+8)</SelectItem>
                      <SelectItem value="america/los_angeles">America/Los Angeles (GMT-8)</SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-sm text-muted-foreground">{t('settings.timezoneDescription')}</p>
                </div>
                
                {/* Data Export - Placeholder */}
                <div className="pt-4 border-t">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                      <h3 className="font-medium">{t('settings.exportData')}</h3>
                      <p className="text-sm text-muted-foreground">{t('settings.exportDataDescription')}</p>
                    </div>
                    <div>
                      <Button variant="outline">
                        {t('settings.exportCSV')}
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
              <CardFooter>
                <Button 
                  onClick={handleSaveSettings}
                  disabled={isSaving}
                >
                  {isSaving ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      {t('settings.saving')}
                    </>
                  ) : (
                    t('settings.saveChanges')
                  )}
                </Button>
              </CardFooter>
            </Card>
          </TabsContent>
          
          <TabsContent value="notifications">
            <Card>
              <CardHeader>
                <CardTitle>{t('settings.notificationSettings')}</CardTitle>
                <CardDescription>{t('settings.notificationSettingsDescription')}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Email Notifications */}
                <div className="space-y-4">
                  <h3 className="font-medium">{t('settings.emailNotifications')}</h3>
                  
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label htmlFor="email-notifications">{t('settings.enableEmailNotifications')}</Label>
                      <p className="text-sm text-muted-foreground">{t('settings.enableEmailNotificationsDescription')}</p>
                    </div>
                    <Switch
                      id="email-notifications"
                      checked={emailNotifications}
                      onCheckedChange={setEmailNotifications}
                    />
                  </div>
                  
                  {emailNotifications && (
                    <>
                      <Separator />
                      
                      <div className="flex items-center justify-between">
                        <div className="space-y-0.5">
                          <Label htmlFor="new-review">{t('settings.newReviewNotifications')}</Label>
                          <p className="text-sm text-muted-foreground">{t('settings.newReviewNotificationsDescription')}</p>
                        </div>
                        <Switch
                          id="new-review"
                          checked={newReviewNotification}
                          onCheckedChange={setNewReviewNotification}
                        />
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <div className="space-y-0.5">
                          <Label htmlFor="marketing-emails">{t('settings.marketingEmails')}</Label>
                          <p className="text-sm text-muted-foreground">{t('settings.marketingEmailsDescription')}</p>
                        </div>
                        <Switch
                          id="marketing-emails"
                          checked={marketingEmails}
                          onCheckedChange={setMarketingEmails}
                        />
                      </div>
                    </>
                  )}
                </div>
                
                {/* Mobile App Notifications - Placeholder */}
                <div className="space-y-4 pt-6 border-t">
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-2">
                        <h3 className="font-medium">{t('settings.mobileAppNotifications')}</h3>
                        <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full">
                          {t('settings.comingSoon')}
                        </span>
                      </div>
                      <p className="text-sm text-muted-foreground">{t('settings.mobileAppNotificationsDescription')}</p>
                    </div>
                    <Smartphone className="h-5 w-5 text-muted-foreground" />
                  </div>
                </div>
              </CardContent>
              <CardFooter>
                <Button 
                  onClick={handleSaveSettings}
                  disabled={isSaving}
                >
                  {isSaving ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      {t('settings.saving')}
                    </>
                  ) : (
                    t('settings.saveChanges')
                  )}
                </Button>
              </CardFooter>
            </Card>
          </TabsContent>
          
          <TabsContent value="appearance">
            <Card>
              <CardHeader>
                <CardTitle>{t('settings.appearanceSettings')}</CardTitle>
                <CardDescription>{t('settings.appearanceSettingsDescription')}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Theme Selection - Placeholder */}
                <div className="space-y-2">
                  <Label htmlFor="theme">{t('settings.theme')}</Label>
                  <Select defaultValue="system">
                    <SelectTrigger id="theme" className="w-full sm:w-[240px]">
                      <SelectValue placeholder={t('settings.selectTheme')} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="system">{t('settings.systemTheme')}</SelectItem>
                      <SelectItem value="light">{t('settings.lightTheme')}</SelectItem>
                      <SelectItem value="dark">{t('settings.darkTheme')}</SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-sm text-muted-foreground">{t('settings.themeDescription')}</p>
                </div>
                
                {/* Primary Color */}
                <div className="space-y-2">
                  <Label htmlFor="primary-color">{t('settings.primaryColor')}</Label>
                  <div className="flex gap-2 items-center">
                    <div 
                      className="w-10 h-10 rounded border" 
                      style={{ backgroundColor: primaryColor }}
                    />
                    <Input 
                      id="primary-color"
                      type="text"
                      className="w-full sm:w-[240px]"
                      value={primaryColor}
                      onChange={(e) => setPrimaryColor(e.target.value)}
                    />
                  </div>
                  <p className="text-sm text-muted-foreground">{t('settings.primaryColorDescription')}</p>
                </div>
                
                {/* Color Presets */}
                <div className="space-y-2 pt-2">
                  <Label>{t('settings.colorPresets')}</Label>
                  <div className="flex flex-wrap gap-3 mt-2">
                    {['#2563eb', '#059669', '#d97706', '#dc2626', '#7c3aed', '#db2777'].map((color) => (
                      <button
                        key={color}
                        className="w-8 h-8 rounded-full shadow-sm flex items-center justify-center border"
                        style={{ backgroundColor: color }}
                        onClick={() => setPrimaryColor(color)}
                      >
                        {primaryColor === color && <Check className="h-4 w-4 text-white" />}
                      </button>
                    ))}
                  </div>
                </div>
              </CardContent>
              <CardFooter>
                <Button 
                  onClick={handleSaveSettings}
                  disabled={isSaving}
                >
                  {isSaving ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      {t('settings.saving')}
                    </>
                  ) : (
                    t('settings.saveChanges')
                  )}
                </Button>
              </CardFooter>
            </Card>
          </TabsContent>
          
          <TabsContent value="api">
            <Card>
              <CardHeader>
                <CardTitle>{t('settings.apiSettings')}</CardTitle>
                <CardDescription>{t('settings.apiSettingsDescription')}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* API Key */}
                <div className="space-y-2">
                  <Label htmlFor="api-key">{t('settings.apiKey')}</Label>
                  <div className="flex gap-2">
                    <Input 
                      id="api-key"
                      type="text"
                      readOnly
                      value={apiKey}
                      className="font-mono text-sm"
                    />
                    <Button variant="outline" onClick={handleGenerateApiKey}>
                      {t('settings.generateNewKey')}
                    </Button>
                  </div>
                  <p className="text-sm text-muted-foreground">{t('settings.apiKeyDescription')}</p>
                </div>
                
                {/* API Documentation */}
                <div className="space-y-2 pt-4 border-t">
                  <h3 className="font-medium">{t('settings.apiDocumentation')}</h3>
                  <p className="text-sm text-muted-foreground">{t('settings.apiDocumentationDescription')}</p>
                  <Button variant="link" className="pl-0">
                    {t('settings.viewApiDocs')}
                  </Button>
                </div>
                
                {/* Webhooks - Placeholder */}
                <div className="space-y-2 pt-4 border-t">
                  <div className="flex items-center gap-2">
                    <h3 className="font-medium">{t('settings.webhooks')}</h3>
                    <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full">
                      {t('settings.premiumFeature')}
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground">{t('settings.webhooksDescription')}</p>
                  <Button variant="outline" disabled>
                    {t('settings.upgradeToAccess')}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </div>
      </Tabs>
    </DashboardLayout>
  );
}