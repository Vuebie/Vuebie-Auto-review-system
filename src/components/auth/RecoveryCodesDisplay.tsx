import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { CopyIcon, CheckIcon } from '@radix-ui/react-icons';

type RecoveryCodesDisplayProps = {
  codes: string[];
};

export default function RecoveryCodesDisplay({ codes }: RecoveryCodesDisplayProps) {
  const { t } = useTranslation();
  const [copied, setCopied] = useState(false);
  
  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(codes.join('\n'));
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };
  
  const handleDownload = () => {
    const content = `${t('mfa.recoveryCodesTitle')}\n\n${codes.join('\n')}`;
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'vuebie-recovery-codes.txt';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };
  
  return (
    <div className="space-y-4">
      <div className="bg-muted rounded-md p-4">
        <div className="grid grid-cols-2 gap-2">
          {codes.map((code, index) => (
            <div 
              key={index} 
              className="font-mono text-sm p-1 bg-background rounded border"
            >
              {code}
            </div>
          ))}
        </div>
      </div>
      
      <div className="flex gap-2">
        <Button 
          variant="outline" 
          type="button" 
          className="flex-1"
          onClick={handleCopy}
        >
          {copied ? (
            <>
              <CheckIcon className="mr-2 h-4 w-4" />
              {t('common.copied')}
            </>
          ) : (
            <>
              <CopyIcon className="mr-2 h-4 w-4" />
              {t('common.copy')}
            </>
          )}
        </Button>
        
        <Button 
          variant="outline" 
          type="button" 
          className="flex-1"
          onClick={handleDownload}
        >
          {t('common.download')}
        </Button>
      </div>
    </div>
  );
}