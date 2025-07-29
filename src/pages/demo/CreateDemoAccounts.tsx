import { useState } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { createDemoAccounts } from "@/lib/auth";
import { toast } from 'sonner';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { CopyIcon, CheckIcon, RefreshCcw } from 'lucide-react';
import { Spinner } from '@/components/ui/spinner';
import { useTranslation } from 'react-i18next';

interface Credentials {
  email: string;
  password: string;
}

export default function CreateDemoAccounts() {
  const { t } = useTranslation();
  const [merchantCredentials, setMerchantCredentials] = useState<Credentials | null>(null);
  const [adminCredentials, setAdminCredentials] = useState<Credentials | null>(null);
  const [loadingMerchant, setLoadingMerchant] = useState(false);
  const [loadingAdmin, setLoadingAdmin] = useState(false);
  const [copiedMerchantEmail, setCopiedMerchantEmail] = useState(false);
  const [copiedMerchantPassword, setCopiedMerchantPassword] = useState(false);
  const [copiedAdminEmail, setCopiedAdminEmail] = useState(false);
  const [copiedAdminPassword, setCopiedAdminPassword] = useState(false);

  const handleCreateMerchant = async () => {
    setLoadingMerchant(true);
    try {
      const result = await createDemoAccounts('merchant', 1);
      if (result.error) {
        throw new Error(result.error.message);
      }
      if (result.accounts && result.accounts.length > 0) {
        setMerchantCredentials({
          email: result.accounts[0].email,
          password: result.accounts[0].password
        });
        toast.success(t('demo.merchant_account_created'));
      }
    } catch (error) {
      console.error('Error creating demo merchant:', error);
      toast.error(t('demo.error_creating_account'));
    } finally {
      setLoadingMerchant(false);
    }
  };

  const handleCreateAdmin = async () => {
    setLoadingAdmin(true);
    try {
      const result = await createDemoAccounts('admin', 1);
      if (result.error) {
        throw new Error(result.error.message);
      }
      if (result.accounts && result.accounts.length > 0) {
        setAdminCredentials({
          email: result.accounts[0].email,
          password: result.accounts[0].password
        });
        toast.success(t('demo.admin_account_created'));
      }
    } catch (error) {
      console.error('Error creating demo admin:', error);
      toast.error(t('demo.error_creating_account'));
    } finally {
      setLoadingAdmin(false);
    }
  };

  const copyToClipboard = (text: string, setCopied: (value: boolean) => void) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="container max-w-4xl py-10">
      <h1 className="text-3xl font-bold mb-6">{t('demo.create_demo_accounts')}</h1>
      <p className="text-muted-foreground mb-8">
        {t('demo.accounts_description')}
      </p>

      <Tabs defaultValue="merchant" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="merchant">{t('demo.merchant_account')}</TabsTrigger>
          <TabsTrigger value="admin">{t('demo.admin_account')}</TabsTrigger>
        </TabsList>

        <TabsContent value="merchant">
          <Card>
            <CardHeader>
              <CardTitle>{t('demo.merchant_account')}</CardTitle>
              <CardDescription>
                {t('demo.merchant_description')}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {merchantCredentials ? (
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="merchant-email">{t('auth.email')}</Label>
                    <div className="flex mt-2">
                      <Input 
                        id="merchant-email"
                        value={merchantCredentials.email}
                        readOnly
                        className="flex-1 mr-2"
                      />
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => copyToClipboard(merchantCredentials.email, setCopiedMerchantEmail)}
                      >
                        {copiedMerchantEmail ? <CheckIcon className="h-4 w-4" /> : <CopyIcon className="h-4 w-4" />}
                      </Button>
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="merchant-password">{t('auth.password')}</Label>
                    <div className="flex mt-2">
                      <Input 
                        id="merchant-password"
                        value={merchantCredentials.password}
                        type="text"
                        readOnly
                        className="flex-1 mr-2"
                      />
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => copyToClipboard(merchantCredentials.password, setCopiedMerchantPassword)}
                      >
                        {copiedMerchantPassword ? <CheckIcon className="h-4 w-4" /> : <CopyIcon className="h-4 w-4" />}
                      </Button>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-6">
                  <p className="mb-4">{t('demo.no_merchant_account')}</p>
                  <Button 
                    onClick={handleCreateMerchant} 
                    disabled={loadingMerchant}
                    className="w-full sm:w-auto"
                  >
                    {loadingMerchant ? (
                      <>
                        <Spinner className="mr-2" />
                        {t('common.creating')}...
                      </>
                    ) : (
                      <>
                        <RefreshCcw className="mr-2 h-4 w-4" />
                        {t('demo.create_merchant_account')}
                      </>
                    )}
                  </Button>
                </div>
              )}
            </CardContent>
            {merchantCredentials && (
              <CardFooter>
                <div className="w-full">
                  <Separator className="my-4" />
                  <div className="flex flex-col sm:flex-row gap-2 w-full justify-end">
                    <Button variant="outline" onClick={handleCreateMerchant} disabled={loadingMerchant}>
                      {loadingMerchant ? (
                        <>
                          <Spinner className="mr-2" />
                          {t('common.creating')}...
                        </>
                      ) : (
                        <>
                          <RefreshCcw className="mr-2 h-4 w-4" />
                          {t('demo.create_new')}
                        </>
                      )}
                    </Button>
                    <Button variant="default" asChild>
                      <a href="/login" target="_blank" rel="noopener noreferrer">{t('auth.login')}</a>
                    </Button>
                  </div>
                </div>
              </CardFooter>
            )}
          </Card>
        </TabsContent>

        <TabsContent value="admin">
          <Card>
            <CardHeader>
              <CardTitle>{t('demo.admin_account')}</CardTitle>
              <CardDescription>
                {t('demo.admin_description')}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {adminCredentials ? (
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="admin-email">{t('auth.email')}</Label>
                    <div className="flex mt-2">
                      <Input 
                        id="admin-email"
                        value={adminCredentials.email}
                        readOnly
                        className="flex-1 mr-2"
                      />
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => copyToClipboard(adminCredentials.email, setCopiedAdminEmail)}
                      >
                        {copiedAdminEmail ? <CheckIcon className="h-4 w-4" /> : <CopyIcon className="h-4 w-4" />}
                      </Button>
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="admin-password">{t('auth.password')}</Label>
                    <div className="flex mt-2">
                      <Input 
                        id="admin-password"
                        value={adminCredentials.password}
                        type="text"
                        readOnly
                        className="flex-1 mr-2"
                      />
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => copyToClipboard(adminCredentials.password, setCopiedAdminPassword)}
                      >
                        {copiedAdminPassword ? <CheckIcon className="h-4 w-4" /> : <CopyIcon className="h-4 w-4" />}
                      </Button>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-6">
                  <p className="mb-4">{t('demo.no_admin_account')}</p>
                  <Button 
                    onClick={handleCreateAdmin} 
                    disabled={loadingAdmin}
                    className="w-full sm:w-auto"
                  >
                    {loadingAdmin ? (
                      <>
                        <Spinner className="mr-2" />
                        {t('common.creating')}...
                      </>
                    ) : (
                      <>
                        <RefreshCcw className="mr-2 h-4 w-4" />
                        {t('demo.create_admin_account')}
                      </>
                    )}
                  </Button>
                </div>
              )}
            </CardContent>
            {adminCredentials && (
              <CardFooter>
                <div className="w-full">
                  <Separator className="my-4" />
                  <div className="flex flex-col sm:flex-row gap-2 w-full justify-end">
                    <Button variant="outline" onClick={handleCreateAdmin} disabled={loadingAdmin}>
                      {loadingAdmin ? (
                        <>
                          <Spinner className="mr-2" />
                          {t('common.creating')}...
                        </>
                      ) : (
                        <>
                          <RefreshCcw className="mr-2 h-4 w-4" />
                          {t('demo.create_new')}
                        </>
                      )}
                    </Button>
                    <Button variant="default" asChild>
                      <a href="/login" target="_blank" rel="noopener noreferrer">{t('auth.login')}</a>
                    </Button>
                  </div>
                </div>
              </CardFooter>
            )}
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}