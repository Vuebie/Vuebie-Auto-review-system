import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import MainLayout from '@/components/layout/MainLayout';
import { mfaHelper } from '@/lib/mfa-helper';
import { useAuth } from '@/contexts/AuthContext';
import RecoveryCodesDisplay from '@/components/auth/RecoveryCodesDisplay';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { ExclamationTriangleIcon, KeyIcon, CheckCircledIcon } from '@radix-ui/react-icons';

export default function MFASetupPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [qrCodeUrl, setQRCodeUrl] = useState('');
  const [secret, setSecret] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [step, setStep] = useState('setup'); // setup, verify, complete
  const [recoveryCodes, setRecoveryCodes] = useState<string[]>([]);
  const [error, setError] = useState('');
  const [isMFARequired, setIsMFARequired] = useState(false);

  useEffect(() => {
    const initSetup = async () => {
      if (!user) {
        navigate('/login');
        return;
      }

      try {
        // Check if MFA is already enabled
        const isMFAEnabled = await mfaHelper.isMFAEnabled(user.id);
        if (isMFAEnabled) {
          navigate('/settings/security');
          toast.info(t('mfa.alreadyEnabled'));
          return;
        }

        // Check if MFA is required for this user
        const required = await mfaHelper.isMFARequired(user.id);
        setIsMFARequired(required);

        // Generate TOTP secret and QR code
        const { secret, qrCodeUrl } = await mfaHelper.generateTOTPSecret(user.id);
        setSecret(secret);
        setQRCodeUrl(qrCodeUrl);
        setIsLoading(false);
      } catch (err) {
        setError(err.message || t('mfa.setupError'));
        toast.error(t('mfa.setupError'));
        setIsLoading(false);
      }
    };

    initSetup();
  }, [user, navigate, t]);

  const handleVerification = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      if (!user) {
        throw new Error(t('auth.userRequired'));
      }

      if (!verificationCode.trim()) {
        throw new Error(t('mfa.codeRequired'));
      }

      // Verify the TOTP code
      const isValid = await mfaHelper.verifyTOTPCode(user.id, verificationCode);
      
      if (!isValid) {
        throw new Error(t('mfa.invalidCode'));
      }

      // Complete MFA setup
      const { recoveryCodes } = await mfaHelper.enrollMFA(user.id, secret);
      setRecoveryCodes(recoveryCodes);
      setStep('complete');
      toast.success(t('mfa.setupSuccess'));
    } catch (err) {
      setError(err.message || t('mfa.verificationFailed'));
      toast.error(t('mfa.verificationFailed'));
    } finally {
      setIsLoading(false);
    }
  };

  const handleFinish = () => {
    navigate('/settings/security');
  };

  if (isLoading && step === 'setup') {
    return (
      <MainLayout>
        <div className="flex min-h-screen items-center justify-center px-4 py-12">
          <div className="w-full max-w-md">
            <div className="text-center">
              <h1 className="text-2xl font-bold">{t('mfa.loading')}</h1>
              <p className="mt-2 text-muted-foreground">{t('mfa.preparingSetup')}</p>
            </div>
          </div>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="flex min-h-screen items-center justify-center px-4 py-12">
        <div className="w-full max-w-md">
          {step === 'setup' && (
            <Card>
              <CardHeader>
                <CardTitle>{t('mfa.setup')}</CardTitle>
                <CardDescription>
                  {isMFARequired
                    ? t('mfa.requiredDescription')
                    : t('mfa.optionalDescription')}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {error && (
                  <Alert variant="destructive" className="mb-4">
                    <ExclamationTriangleIcon className="h-4 w-4" />
                    <AlertTitle>{t('mfa.error')}</AlertTitle>
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}

                <div className="space-y-4">
                  <div>
                    <h3 className="text-lg font-medium">{t('mfa.step1')}</h3>
                    <p className="text-sm text-muted-foreground mb-4">
                      {t('mfa.installApp')}
                    </p>
                    <ul className="list-disc pl-5 text-sm space-y-1 mb-4">
                      <li>Google Authenticator</li>
                      <li>Authy</li>
                      <li>Microsoft Authenticator</li>
                    </ul>
                  </div>

                  <div>
                    <h3 className="text-lg font-medium">{t('mfa.step2')}</h3>
                    <p className="text-sm text-muted-foreground mb-4">
                      {t('mfa.scanQrCode')}
                    </p>
                    <div className="flex justify-center bg-white p-4 rounded-md mb-4">
                      {qrCodeUrl && <img src={qrCodeUrl} alt="QR Code" className="w-48 h-48" />}
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {t('mfa.cannotScanQr')}{' '}
                      <span className="font-mono text-xs bg-muted p-1 rounded">
                        {secret}
                      </span>
                    </p>
                  </div>

                  <div>
                    <h3 className="text-lg font-medium">{t('mfa.step3')}</h3>
                    <p className="text-sm text-muted-foreground mb-4">
                      {t('mfa.enterCode')}
                    </p>
                    <form onSubmit={handleVerification}>
                      <div className="space-y-4">
                        <Input
                          type="text"
                          inputMode="numeric"
                          pattern="[0-9]*"
                          maxLength={6}
                          placeholder="000000"
                          value={verificationCode}
                          onChange={(e) => setVerificationCode(e.target.value)}
                          className="text-center text-xl tracking-widest"
                        />
                        <Button type="submit" className="w-full" disabled={isLoading}>
                          {isLoading ? t('mfa.verifying') : t('mfa.verify')}
                        </Button>
                      </div>
                    </form>
                  </div>
                </div>
              </CardContent>
              <CardFooter>
                <p className="text-sm text-muted-foreground">
                  <KeyIcon className="inline-block mr-1 h-4 w-4" />
                  {t('mfa.securityNote')}
                </p>
              </CardFooter>
            </Card>
          )}

          {step === 'complete' && (
            <Card>
              <CardHeader>
                <CardTitle>{t('mfa.setupComplete')}</CardTitle>
                <CardDescription>
                  {t('mfa.backupCodes')}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Alert className="mb-4">
                  <CheckCircledIcon className="h-4 w-4" />
                  <AlertTitle>{t('mfa.success')}</AlertTitle>
                  <AlertDescription>{t('mfa.enabledSuccess')}</AlertDescription>
                </Alert>

                <div className="mb-4">
                  <h3 className="text-lg font-medium mb-2">{t('mfa.recoveryCodes')}</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    {t('mfa.recoveryCodesDescription')}
                  </p>
                  
                  <RecoveryCodesDisplay codes={recoveryCodes} />

                  <p className="text-sm text-muted-foreground mt-4">
                    <ExclamationTriangleIcon className="inline-block mr-1 h-4 w-4" />
                    {t('mfa.storeSecurely')}
                  </p>
                </div>
              </CardContent>
              <CardFooter>
                <Button onClick={handleFinish} className="w-full">
                  {t('mfa.finish')}
                </Button>
              </CardFooter>
            </Card>
          )}
        </div>
      </div>
    </MainLayout>
  );
}