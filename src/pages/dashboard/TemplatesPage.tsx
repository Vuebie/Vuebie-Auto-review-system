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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { CheckCircle, Star } from 'lucide-react';
import { toast } from 'sonner';

export default function TemplatesPage() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [activeTemplate, setActiveTemplate] = useState('default');
  const [isSaving, setIsSaving] = useState(false);
  
  // Template settings state
  const [settings, setSettings] = useState({
    headerTitle: 'How was your experience?',
    headerSubtitle: 'Your feedback helps us improve our service',
    ratingLabel: 'Rating',
    commentLabel: 'Comment',
    commentPlaceholder: 'Share your thoughts (optional)',
    submitButtonText: 'Submit Review',
    thankYouTitle: 'Thank You!',
    thankYouMessage: 'Your feedback has been received',
    primaryColor: '#2563eb', // Blue
    backgroundColor: '#ffffff', // White
    enableLogo: true,
    enableRating: true,
    enableComments: true,
    showThankYouPage: true,
  });

  const handleSettingChange = (setting: string, value: string | boolean) => {
    setSettings(prev => ({
      ...prev,
      [setting]: value
    }));
  };

  const handleSave = async () => {
    setIsSaving(true);
    
    // Simulate saving to backend
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    toast.success(t('templates.saveSuccess'));
    setIsSaving(false);
  };

  return (
    <DashboardLayout
      title={t('templates.title')}
      description={t('templates.description')}
    >
      <Tabs defaultValue="templates" className="space-y-6">
        <TabsList>
          <TabsTrigger value="templates">{t('templates.tabs.templates')}</TabsTrigger>
          <TabsTrigger value="customize">{t('templates.tabs.customize')}</TabsTrigger>
          <TabsTrigger value="preview">{t('templates.tabs.preview')}</TabsTrigger>
        </TabsList>
        
        <TabsContent value="templates">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Default Template */}
            <Card className={`cursor-pointer border-2 ${activeTemplate === 'default' ? 'border-primary' : 'border-transparent'}`}
              onClick={() => setActiveTemplate('default')}>
              <CardHeader>
                <CardTitle className="flex items-center">
                  {activeTemplate === 'default' && <CheckCircle className="h-4 w-4 text-primary mr-2" />}
                  {t('templates.defaultTemplate')}
                </CardTitle>
                <CardDescription>{t('templates.defaultTemplateDescription')}</CardDescription>
              </CardHeader>
              <CardContent className="p-0">
                <div className="aspect-[9/16] bg-slate-100 rounded-md mx-4 flex flex-col items-center justify-center text-center p-4 text-sm">
                  <div className="w-16 h-6 bg-slate-200 rounded mb-4"></div>
                  <h3 className="font-medium mb-1">How was your experience?</h3>
                  <p className="text-xs text-slate-500 mb-6">Your feedback helps us improve</p>
                  <div className="flex space-x-1 mb-4">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <Star key={star} className="h-5 w-5" fill={star === 5 ? "currentColor" : "none"} />
                    ))}
                  </div>
                  <div className="w-full h-20 bg-slate-200 rounded mb-4"></div>
                  <div className="w-full h-8 bg-primary/20 rounded"></div>
                </div>
              </CardContent>
              <CardFooter className="pt-6">
                <Button 
                  variant={activeTemplate === 'default' ? 'default' : 'outline'} 
                  className="w-full"
                  onClick={() => setActiveTemplate('default')}
                >
                  {activeTemplate === 'default' 
                    ? t('templates.selected') 
                    : t('templates.selectTemplate')}
                </Button>
              </CardFooter>
            </Card>
            
            {/* Minimal Template */}
            <Card className={`cursor-pointer border-2 ${activeTemplate === 'minimal' ? 'border-primary' : 'border-transparent'}`}
              onClick={() => setActiveTemplate('minimal')}>
              <CardHeader>
                <CardTitle className="flex items-center">
                  {activeTemplate === 'minimal' && <CheckCircle className="h-4 w-4 text-primary mr-2" />}
                  {t('templates.minimalTemplate')}
                </CardTitle>
                <CardDescription>{t('templates.minimalTemplateDescription')}</CardDescription>
              </CardHeader>
              <CardContent className="p-0">
                <div className="aspect-[9/16] bg-slate-100 rounded-md mx-4 flex flex-col items-center justify-center text-center p-4 text-sm">
                  <h3 className="font-medium mb-1">Rate your experience</h3>
                  <div className="flex space-x-1 my-8">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <Star key={star} className="h-7 w-7" fill={star === 5 ? "currentColor" : "none"} />
                    ))}
                  </div>
                  <div className="w-full h-8 bg-primary/20 rounded mt-6"></div>
                </div>
              </CardContent>
              <CardFooter className="pt-6">
                <Button 
                  variant={activeTemplate === 'minimal' ? 'default' : 'outline'} 
                  className="w-full"
                  onClick={() => setActiveTemplate('minimal')}
                >
                  {activeTemplate === 'minimal' 
                    ? t('templates.selected') 
                    : t('templates.selectTemplate')}
                </Button>
              </CardFooter>
            </Card>
            
            {/* Premium Template (locked) */}
            <Card className="opacity-75 cursor-not-allowed relative">
              <div className="absolute inset-0 flex items-center justify-center bg-black/5 rounded-lg">
                <div className="px-3 py-1 bg-black/70 text-white text-xs rounded-full">
                  {t('templates.premiumFeature')}
                </div>
              </div>
              <CardHeader>
                <CardTitle>{t('templates.premiumTemplate')}</CardTitle>
                <CardDescription>{t('templates.premiumTemplateDescription')}</CardDescription>
              </CardHeader>
              <CardContent className="p-0">
                <div className="aspect-[9/16] bg-slate-100 rounded-md mx-4 flex flex-col items-center justify-center text-center p-4 text-sm">
                  <div className="w-16 h-16 rounded-full bg-slate-200 mb-4"></div>
                  <h3 className="font-medium mb-1">Tell us about your visit</h3>
                  <p className="text-xs text-slate-500 mb-4">at Restaurant Name</p>
                  <div className="flex space-x-2 mb-4">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <Star key={star} className="h-6 w-6" fill="none" />
                    ))}
                  </div>
                  <div className="w-full h-16 bg-slate-200 rounded mb-4"></div>
                  <div className="w-full h-8 bg-slate-200 rounded"></div>
                </div>
              </CardContent>
              <CardFooter className="pt-6">
                <Button variant="outline" className="w-full">
                  {t('templates.upgradeToUnlock')}
                </Button>
              </CardFooter>
            </Card>
          </div>
        </TabsContent>
        
        <TabsContent value="customize">
          <Card>
            <CardHeader>
              <CardTitle>{t('templates.customizeTemplate')}</CardTitle>
              <CardDescription>{t('templates.customizeDescription')}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Text Settings */}
                <div className="space-y-4">
                  <h3 className="font-semibold">{t('templates.textSettings')}</h3>
                  
                  <div className="space-y-2">
                    <Label htmlFor="headerTitle">{t('templates.fields.headerTitle')}</Label>
                    <Input 
                      id="headerTitle"
                      value={settings.headerTitle}
                      onChange={(e) => handleSettingChange('headerTitle', e.target.value)}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="headerSubtitle">{t('templates.fields.headerSubtitle')}</Label>
                    <Input 
                      id="headerSubtitle"
                      value={settings.headerSubtitle}
                      onChange={(e) => handleSettingChange('headerSubtitle', e.target.value)}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="ratingLabel">{t('templates.fields.ratingLabel')}</Label>
                    <Input 
                      id="ratingLabel"
                      value={settings.ratingLabel}
                      onChange={(e) => handleSettingChange('ratingLabel', e.target.value)}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="commentLabel">{t('templates.fields.commentLabel')}</Label>
                    <Input 
                      id="commentLabel"
                      value={settings.commentLabel}
                      onChange={(e) => handleSettingChange('commentLabel', e.target.value)}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="commentPlaceholder">{t('templates.fields.commentPlaceholder')}</Label>
                    <Input 
                      id="commentPlaceholder"
                      value={settings.commentPlaceholder}
                      onChange={(e) => handleSettingChange('commentPlaceholder', e.target.value)}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="submitButtonText">{t('templates.fields.submitButtonText')}</Label>
                    <Input 
                      id="submitButtonText"
                      value={settings.submitButtonText}
                      onChange={(e) => handleSettingChange('submitButtonText', e.target.value)}
                    />
                  </div>
                </div>
                
                {/* Visual Settings */}
                <div className="space-y-4">
                  <h3 className="font-semibold">{t('templates.visualSettings')}</h3>
                  
                  <div className="space-y-2">
                    <Label htmlFor="primaryColor">{t('templates.fields.primaryColor')}</Label>
                    <div className="flex gap-2">
                      <div 
                        className="w-10 h-10 rounded border" 
                        style={{ backgroundColor: settings.primaryColor }}
                      />
                      <Input 
                        id="primaryColor"
                        type="text"
                        value={settings.primaryColor}
                        onChange={(e) => handleSettingChange('primaryColor', e.target.value)}
                      />
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="backgroundColor">{t('templates.fields.backgroundColor')}</Label>
                    <div className="flex gap-2">
                      <div 
                        className="w-10 h-10 rounded border" 
                        style={{ backgroundColor: settings.backgroundColor }}
                      />
                      <Input 
                        id="backgroundColor"
                        type="text"
                        value={settings.backgroundColor}
                        onChange={(e) => handleSettingChange('backgroundColor', e.target.value)}
                      />
                    </div>
                  </div>
                  
                  <div className="space-y-6 pt-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <Label htmlFor="enableLogo">{t('templates.fields.enableLogo')}</Label>
                        <p className="text-sm text-muted-foreground">{t('templates.logoDescription')}</p>
                      </div>
                      <Switch 
                        id="enableLogo"
                        checked={settings.enableLogo}
                        onCheckedChange={(checked) => handleSettingChange('enableLogo', checked)}
                      />
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div>
                        <Label htmlFor="enableRating">{t('templates.fields.enableRating')}</Label>
                        <p className="text-sm text-muted-foreground">{t('templates.ratingDescription')}</p>
                      </div>
                      <Switch 
                        id="enableRating"
                        checked={settings.enableRating}
                        onCheckedChange={(checked) => handleSettingChange('enableRating', checked)}
                      />
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div>
                        <Label htmlFor="enableComments">{t('templates.fields.enableComments')}</Label>
                        <p className="text-sm text-muted-foreground">{t('templates.commentsDescription')}</p>
                      </div>
                      <Switch 
                        id="enableComments"
                        checked={settings.enableComments}
                        onCheckedChange={(checked) => handleSettingChange('enableComments', checked)}
                      />
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div>
                        <Label htmlFor="showThankYouPage">{t('templates.fields.showThankYouPage')}</Label>
                        <p className="text-sm text-muted-foreground">{t('templates.thankYouDescription')}</p>
                      </div>
                      <Switch 
                        id="showThankYouPage"
                        checked={settings.showThankYouPage}
                        onCheckedChange={(checked) => handleSettingChange('showThankYouPage', checked)}
                      />
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Thank You Page Settings */}
              {settings.showThankYouPage && (
                <div className="pt-4 space-y-4">
                  <h3 className="font-semibold">{t('templates.thankYouSettings')}</h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="thankYouTitle">{t('templates.fields.thankYouTitle')}</Label>
                      <Input 
                        id="thankYouTitle"
                        value={settings.thankYouTitle}
                        onChange={(e) => handleSettingChange('thankYouTitle', e.target.value)}
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="thankYouMessage">{t('templates.fields.thankYouMessage')}</Label>
                      <Input 
                        id="thankYouMessage"
                        value={settings.thankYouMessage}
                        onChange={(e) => handleSettingChange('thankYouMessage', e.target.value)}
                      />
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
            <CardFooter className="flex justify-end space-x-2">
              <Button variant="outline">
                {t('templates.resetToDefault')}
              </Button>
              <Button 
                onClick={handleSave}
                disabled={isSaving}
              >
                {isSaving ? t('templates.saving') : t('templates.saveChanges')}
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>
        
        <TabsContent value="preview">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>{t('templates.mobilePreview')}</CardTitle>
                <CardDescription>{t('templates.mobilePreviewDescription')}</CardDescription>
              </CardHeader>
              <CardContent className="flex justify-center p-6">
                <div 
                  className="border-8 border-gray-800 rounded-3xl overflow-hidden shadow-xl w-[320px]"
                  style={{ backgroundColor: settings.backgroundColor }}
                >
                  <div className="h-6 bg-gray-800"></div>
                  <div className="p-4 space-y-6">
                    {settings.enableLogo && (
                      <div className="flex justify-center">
                        <div className="w-16 h-6 bg-gray-200 rounded"></div>
                      </div>
                    )}
                    
                    <div className="text-center">
                      <h3 className="font-semibold">{settings.headerTitle}</h3>
                      <p className="text-sm text-gray-500">{settings.headerSubtitle}</p>
                    </div>
                    
                    {settings.enableRating && (
                      <div className="space-y-2">
                        <label className="text-sm font-medium block">{settings.ratingLabel}</label>
                        <div className="flex justify-center space-x-1">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <Star key={star} className="h-8 w-8" fill={star <= 3 ? "currentColor" : "none"} />
                          ))}
                        </div>
                      </div>
                    )}
                    
                    {settings.enableComments && (
                      <div className="space-y-2">
                        <label className="text-sm font-medium block">{settings.commentLabel}</label>
                        <div className="h-24 bg-gray-100 rounded-md w-full"></div>
                      </div>
                    )}
                    
                    <div>
                      <button 
                        className="w-full py-2 rounded-md text-white text-sm font-medium"
                        style={{ backgroundColor: settings.primaryColor }}
                      >
                        {settings.submitButtonText}
                      </button>
                    </div>
                  </div>
                  <div className="h-6 bg-gray-800"></div>
                </div>
              </CardContent>
            </Card>
            
            {settings.showThankYouPage && (
              <Card>
                <CardHeader>
                  <CardTitle>{t('templates.thankYouPreview')}</CardTitle>
                  <CardDescription>{t('templates.thankYouPreviewDescription')}</CardDescription>
                </CardHeader>
                <CardContent className="flex justify-center p-6">
                  <div 
                    className="border-8 border-gray-800 rounded-3xl overflow-hidden shadow-xl w-[320px]"
                    style={{ backgroundColor: settings.backgroundColor }}
                  >
                    <div className="h-6 bg-gray-800"></div>
                    <div className="p-4 flex flex-col items-center justify-center min-h-[400px] text-center space-y-6">
                      <div className="w-16 h-16 rounded-full flex items-center justify-center"
                        style={{ backgroundColor: settings.primaryColor + '20' }}
                      >
                        <CheckCircle style={{ color: settings.primaryColor }} className="h-8 w-8" />
                      </div>
                      
                      <div>
                        <h3 className="font-semibold text-xl">{settings.thankYouTitle}</h3>
                        <p className="text-sm text-gray-500 mt-1">{settings.thankYouMessage}</p>
                      </div>
                      
                      <button 
                        className="px-6 py-2 rounded-md text-white text-sm font-medium"
                        style={{ backgroundColor: settings.primaryColor }}
                      >
                        {t('templates.close')}
                      </button>
                    </div>
                    <div className="h-6 bg-gray-800"></div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </DashboardLayout>
  );
}