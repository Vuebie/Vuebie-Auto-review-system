import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import { supabase } from '@/lib/supabase-with-fallback';
import { securityMonitor } from '@/lib/security-monitoring';
import { mfaHelper } from '@/lib/mfa-helper';

import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import MFAVerificationModal from '@/components/auth/MFAVerificationModal';
import { ExclamationTriangleIcon } from '@radix-ui/react-icons';

const loginSchema = z.object({
  email: z.string().email({ message: 'Please enter a valid email' }),
  password: z.string().min(1, { message: 'Password is required' }),
});

type LoginFormValues = z.infer<typeof loginSchema>;

export default function LoginPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [showMFAVerification, setShowMFAVerification] = useState(false);
  const [pendingUserId, setPendingUserId] = useState('');
  const [pendingSession, setPendingSession] = useState(null);

  const form = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  });

  const onSubmit = async (data: LoginFormValues) => {
    console.log('🔑 [DEBUG] Login form submitted with email:', data.email);
    setIsLoading(true);
    setError('');

    try {
      console.log('🔐 [DEBUG] Calling supabase.auth.signInWithPassword...');
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email: data.email,
        password: data.password,
      });
      
      console.log('🔍 [DEBUG] Authentication response:', { 
        hasUser: !!authData?.user, 
        hasSession: !!authData?.session, 
        error: authError?.message 
      });

      if (authError) {
        // Log failed login attempt
        await securityMonitor.logSecurityEvent('login_failed', {
          email: data.email,
          reason: authError.message,
        });
        
        throw new Error(authError.message);
      }

      if (!authData?.user) {
        throw new Error('Authentication failed');
      }

      // Check if MFA is enabled for this user
      const mfaEnabled = await mfaHelper.isMFAEnabled(authData.user.id);

      if (mfaEnabled) {
        // Store user ID and session for after MFA verification
        setPendingUserId(authData.user.id);
        setPendingSession(authData.session);
        setShowMFAVerification(true);
        
        // Log MFA challenge sent
        await securityMonitor.logSecurityEvent('mfa_challenge', {
          user_id: authData.user.id,
          email: data.email,
        });
      } else {
        // Log successful login
        await securityMonitor.logSecurityEvent('login_success', {
          user_id: authData.user.id,
          email: data.email,
        });
        
        // Check if MFA is required but not set up
        const mfaRequired = await mfaHelper.isMFARequired(authData.user.id);
        if (mfaRequired) {
          // Redirect to MFA setup
          toast.warning(t('mfa.setupRequired'));
          navigate('/settings/security/mfa-setup');
        } else {
          // Regular login success
          toast.success(t('auth.loginSuccess'));
          navigate('/dashboard');
        }
      }
    } catch (err) {
      setError(err.message || t('auth.loginError'));
      toast.error(t('auth.loginError'));
    } finally {
      setIsLoading(false);
    }
  };

  const handleMFAVerified = async () => {
    // Log successful MFA verification
    await securityMonitor.logSecurityEvent('mfa_success', {
      user_id: pendingUserId,
    });
    
    toast.success(t('auth.loginSuccess'));
    navigate('/dashboard');
  };

  return (
    <div className="flex min-h-screen items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        <Card>
          <CardHeader className="space-y-1">
            <CardTitle className="text-2xl font-bold">{t('auth.login')}</CardTitle>
            <CardDescription>
              {t('auth.loginDescription')}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {error && (
              <Alert variant="destructive" className="mb-4">
                <ExclamationTriangleIcon className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
            
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('auth.email')}</FormLabel>
                      <FormControl>
                        <Input
                          type="email"
                          placeholder="you@example.com"
                          autoComplete="username"
                          disabled={isLoading}
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <div className="flex items-center justify-between">
                        <FormLabel>{t('auth.password')}</FormLabel>
                        <Link
                          to="/auth/forgot-password"
                          className="text-sm font-medium text-primary"
                        >
                          {t('auth.forgotPassword')}
                        </Link>
                      </div>
                      <FormControl>
                        <Input
                          type="password"
                          autoComplete="current-password"
                          disabled={isLoading}
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading ? t('auth.signingIn') : t('auth.signIn')}
                </Button>
              </form>
            </Form>
          </CardContent>
          <CardFooter>
            <div className="text-center text-sm w-full">
              {t('auth.noAccount')}{' '}
              <Link to="/auth/register" className="font-medium text-primary">
                {t('auth.signUp')}
              </Link>
            </div>
          </CardFooter>
        </Card>
      </div>
      
      <MFAVerificationModal
        isOpen={showMFAVerification}
        onClose={() => setShowMFAVerification(false)}
        onVerified={handleMFAVerified}
        userId={pendingUserId}
      />
    </div>
  );
}