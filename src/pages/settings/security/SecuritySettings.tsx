import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { toast } from 'sonner';
import { ExclamationTriangleIcon, LockClosedIcon, ShieldCheckIcon } from '@radix-ui/react-icons';
import MainLayout from '@/components/layout/MainLayout';
import { useAuth } from '@/contexts/AuthContext';
import { mfaHelper } from '@/lib/mfa-helper';
import MFAVerificationModal from '@/components/auth/MFAVerificationModal';

export default function SecuritySettings() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [mfaEnabled, setMfaEnabled] = useState(false);
  const [mfaRequired, setMfaRequired] = useState(false);
  const [showVerificationModal, setShowVerificationModal] = useState(false);
  const [mfaAction, setMfaAction] = useState<'enable' | 'disable'>('enable');
  
  useEffect(() => {
    const fetchSecuritySettings = async () => {
      if (!user) {
        navigate('/login');
        return;
      }
      
      try {
        // Check MFA status
        const enabled = await mfaHelper.isMFAEnabled(user.id);
        setMfaEnabled(enabled);
        
        // Check if MFA is required for this user
        const required = await mfaHelper.isMFARequired(user.id);
        setMfaRequired(required);
        
        setIsLoading(false);
      } catch (err) {
        toast.error(t('settings.fetchError'));
        console.error('Error fetching security settings:', err);
        setIsLoading(false);
      }
    };
    
    fetchSecuritySettings();
  }, [user, navigate, t]);
  
  const handleSetupMFA = () => {
    navigate('/settings/security/mfa-setup');
  };
  
  const handleDisableMFA = () => {
    if (mfaRequired) {
      toast.error(t('mfa.cannotDisableRequired'));
      return;
    }
    
    setMfaAction('disable');
    setShowVerificationModal(true);
  };
  
  const handleVerified = async () => {
    setShowVerificationModal(false);
    
    if (mfaAction === 'disable') {
      try {
        await mfaHelper.disableMFA(user?.id);
        setMfaEnabled(false);
        toast.success(t('mfa.disabled'));
      } catch (err) {
        toast.error(t('mfa.disableError'));
      }
    }
  };
  
  if (isLoading) {
    return (
      <MainLayout>
        <div className="container mx-auto py-8">
          <div className="text-center">
            <h1 className="text-2xl font-bold">{t('settings.loading')}</h1>
          </div>
        </div>
      </MainLayout>
    );
  }
  
  return (
    <MainLayout>
      <div className="container mx-auto py-8">
        <h1 className="text-3xl font-bold mb-6">{t('settings.security')}</h1>
        
        <div className="space-y-8">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <ShieldCheckIcon className="mr-2 h-5 w-5" />
                {t('mfa.title')}
              </CardTitle>
              <CardDescription>{t('mfa.description')}</CardDescription>
            </CardHeader>
            <CardContent>
              {mfaRequired && !mfaEnabled && (
                <Alert variant="destructive" className="mb-4">
                  <ExclamationTriangleIcon className="h-4 w-4" />
                  <AlertDescription>
                    {t('mfa.requiredAlert')}
                  </AlertDescription>
                </Alert>
              )}
              
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-medium">{t('mfa.status')}</h3>
                  <p className="text-sm text-muted-foreground">
                    {mfaEnabled ? t('mfa.enabled') : t('mfa.disabled')}
                  </p>
                </div>
                
                <div>
                  {mfaEnabled ? (
                    <Button
                      variant="outline"
                      onClick={handleDisableMFA}
                      disabled={mfaRequired}
                    >
                      {t('mfa.disable')}
                    </Button>
                  ) : (
                    <Button onClick={handleSetupMFA}>
                      {t('mfa.setup')}
                    </Button>
                  )}
                </div>
              </div>
              
              {mfaEnabled && (
                <div className="mt-4 border-t pt-4">
                  <h3 className="font-medium">{t('mfa.recoveryCodes')}</h3>
                  <p className="text-sm text-muted-foreground mb-2">
                    {t('mfa.recoveryCodesManage')}
                  </p>
                  <Button variant="outline" onClick={() => navigate('/settings/security/recovery-codes')}>
                    {t('mfa.viewRecoveryCodes')}
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <LockClosedIcon className="mr-2 h-5 w-5" />
                {t('settings.passwordSecurity')}
              </CardTitle>
              <CardDescription>{t('settings.passwordSecurityDescription')}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-medium">{t('settings.changePassword')}</h3>
                    <p className="text-sm text-muted-foreground">
                      {t('settings.changePasswordDescription')}
                    </p>
                  </div>
                  <Button variant="outline" onClick={() => navigate('/settings/security/change-password')}>
                    {t('settings.updatePassword')}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>{t('settings.sessionManagement')}</CardTitle>
              <CardDescription>{t('settings.sessionManagementDescription')}</CardDescription>
            </CardHeader>
            <CardContent>
              <Button variant="destructive" onClick={() => navigate('/settings/security/active-sessions')}>
                {t('settings.viewActiveSessions')}
              </Button>
            </CardContent>
            <CardFooter>
              <p className="text-sm text-muted-foreground">
                {t('settings.sessionNote')}
              </p>
            </CardFooter>
          </Card>
        </div>
      </div>
      
      {user && (
        <MFAVerificationModal
          isOpen={showVerificationModal}
          onClose={() => setShowVerificationModal(false)}
          onVerified={handleVerified}
          userId={user.id}
        />
      )}
    </MainLayout>
  );
}