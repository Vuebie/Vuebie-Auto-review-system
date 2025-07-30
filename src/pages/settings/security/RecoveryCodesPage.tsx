import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import MainLayout from '@/components/layout/MainLayout';
import { mfaHelper } from '@/lib/mfa-helper';
import { useAuth } from '@/contexts/AuthContext';
import RecoveryCodesDisplay from '@/components/auth/RecoveryCodesDisplay';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ExclamationTriangleIcon, KeyIcon, ArrowLeftIcon } from '@radix-ui/react-icons';
import MFAVerificationModal from '@/components/auth/MFAVerificationModal';

export default function RecoveryCodesPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [recoveryCodes, setRecoveryCodes] = useState<string[]>([]);
  const [error, setError] = useState('');
  const [showVerificationModal, setShowVerificationModal] = useState(false);
  const [regenerating, setRegenerating] = useState(false);

  useEffect(() => {
    const loadRecoveryCodes = async () => {
      if (!user) {
        navigate('/login');
        return;
      }

      try {
        // Check if MFA is enabled
        const isMFAEnabled = await mfaHelper.isMFAEnabled(user.id);
        if (!isMFAEnabled) {
          navigate('/settings/security');
          toast.error(t('mfa.notEnabled'));
          return;
        }

        // Fetch existing recovery codes
        const codes = await mfaHelper.getRecoveryCodes(user.id);
        setRecoveryCodes(codes);
        setIsLoading(false);
      } catch (err) {
        setError(err.message || t('mfa.loadError'));
        toast.error(t('mfa.loadError'));
        setIsLoading(false);
      }
    };

    loadRecoveryCodes();
  }, [user, navigate, t]);

  const handleRegenerateCodes = () => {
    setShowVerificationModal(true);
  };

  const handleVerified = async () => {
    setShowVerificationModal(false);
    setRegenerating(true);
    
    try {
      const newCodes = await mfaHelper.regenerateRecoveryCodes(user?.id);
      setRecoveryCodes(newCodes);
      toast.success(t('mfa.codesRegenerated'));
    } catch (err) {
      setError(err.message || t('mfa.regenerateError'));
      toast.error(t('mfa.regenerateError'));
    } finally {
      setRegenerating(false);
    }
  };

  const handleBack = () => {
    navigate('/settings/security');
  };

  if (isLoading) {
    return (
      <MainLayout>
        <div className="container mx-auto py-8">
          <div className="text-center">
            <h1 className="text-2xl font-bold">{t('mfa.loading')}</h1>
          </div>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="container mx-auto py-8">
        <div className="mb-6">
          <Button variant="outline" onClick={handleBack} className="mb-4">
            <ArrowLeftIcon className="mr-2 h-4 w-4" />
            {t('common.back')}
          </Button>
          <h1 className="text-3xl font-bold">{t('mfa.recoveryCodes')}</h1>
          <p className="text-muted-foreground">{t('mfa.recoveryCodesManage')}</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>{t('mfa.recoveryCodesTitle')}</CardTitle>
            <CardDescription>
              {t('mfa.recoveryCodesDescription')}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {error && (
              <Alert variant="destructive" className="mb-4">
                <ExclamationTriangleIcon className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <div className="mb-6">
              <Alert>
                <KeyIcon className="h-4 w-4" />
                <AlertDescription>
                  {t('mfa.recoveryCodesWarning')}
                </AlertDescription>
              </Alert>
            </div>

            {recoveryCodes.length > 0 ? (
              <RecoveryCodesDisplay codes={recoveryCodes} />
            ) : (
              <div className="text-center py-8">
                <p>{t('mfa.noCodesAvailable')}</p>
              </div>
            )}
          </CardContent>
          <CardFooter className="flex justify-between">
            <p className="text-sm text-muted-foreground">
              <ExclamationTriangleIcon className="inline-block mr-1 h-4 w-4" />
              {t('mfa.regenerateWarning')}
            </p>
            <Button 
              variant="destructive" 
              onClick={handleRegenerateCodes}
              disabled={regenerating}
            >
              {regenerating ? t('mfa.regenerating') : t('mfa.regenerateCodes')}
            </Button>
          </CardFooter>
        </Card>
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