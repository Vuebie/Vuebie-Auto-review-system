import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { mfaHelper } from '@/lib/mfa-helper';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ExclamationTriangleIcon } from '@radix-ui/react-icons';

type MFAVerificationModalProps = {
  isOpen: boolean;
  onClose: () => void;
  onVerified: () => void;
  userId: string;
};

export default function MFAVerificationModal({
  isOpen,
  onClose,
  onVerified,
  userId,
}: MFAVerificationModalProps) {
  const { t } = useTranslation();
  const [tab, setTab] = useState<'totp' | 'recovery'>('totp');
  const [verificationCode, setVerificationCode] = useState('');
  const [recoveryCode, setRecoveryCode] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleVerifyTOTP = async () => {
    setError('');
    setIsLoading(true);
    
    try {
      if (!verificationCode.trim()) {
        throw new Error(t('mfa.codeRequired'));
      }
      
      const isValid = await mfaHelper.verifyTOTPCode(userId, verificationCode);
      
      if (isValid) {
        onVerified();
      } else {
        throw new Error(t('mfa.invalidCode'));
      }
    } catch (err) {
      setError(err.message || t('mfa.verificationFailed'));
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleVerifyRecovery = async () => {
    setError('');
    setIsLoading(true);
    
    try {
      if (!recoveryCode.trim()) {
        throw new Error(t('mfa.recoveryCodeRequired'));
      }
      
      const isValid = await mfaHelper.verifyRecoveryCode(userId, recoveryCode);
      
      if (isValid) {
        onVerified();
      } else {
        throw new Error(t('mfa.invalidRecoveryCode'));
      }
    } catch (err) {
      setError(err.message || t('mfa.verificationFailed'));
    } finally {
      setIsLoading(false);
    }
  };

  const resetForm = () => {
    setVerificationCode('');
    setRecoveryCode('');
    setError('');
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{t('mfa.verification')}</DialogTitle>
          <DialogDescription>
            {t('mfa.verificationDescription')}
          </DialogDescription>
        </DialogHeader>
        
        {error && (
          <Alert variant="destructive">
            <ExclamationTriangleIcon className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
        
        <Tabs defaultValue="totp" value={tab} onValueChange={(v) => setTab(v as 'totp' | 'recovery')}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="totp">{t('mfa.authenticatorApp')}</TabsTrigger>
            <TabsTrigger value="recovery">{t('mfa.recoveryCode')}</TabsTrigger>
          </TabsList>
          
          <TabsContent value="totp">
            <div className="space-y-4 py-2">
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">
                  {t('mfa.enterTOTPCode')}
                </p>
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
              </div>
            </div>
          </TabsContent>
          
          <TabsContent value="recovery">
            <div className="space-y-4 py-2">
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">
                  {t('mfa.enterRecoveryCode')}
                </p>
                <Input
                  type="text"
                  placeholder="xxxxxxxxxx"
                  value={recoveryCode}
                  onChange={(e) => setRecoveryCode(e.target.value)}
                  className="text-center font-mono"
                />
                <p className="text-xs text-muted-foreground">
                  {t('mfa.recoveryCodeWarning')}
                </p>
              </div>
            </div>
          </TabsContent>
        </Tabs>
        
        <DialogFooter>
          <Button variant="outline" onClick={handleClose}>
            {t('common.cancel')}
          </Button>
          <Button 
            onClick={tab === 'totp' ? handleVerifyTOTP : handleVerifyRecovery}
            disabled={isLoading}
          >
            {isLoading ? t('mfa.verifying') : t('mfa.verify')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}