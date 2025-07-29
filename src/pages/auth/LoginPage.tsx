import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import MainLayout from '@/components/layout/MainLayout';
import { signInWithEmail, signInWithProvider } from '@/lib/auth';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';

// Define the form schema
const formSchema = z.object({
  email: z
    .string()
    .min(1, { message: 'Email is required' })
    .email({ message: 'Invalid email address' }),
  password: z.string().min(1, { message: 'Password is required' }),
});

type FormData = z.infer<typeof formSchema>;

export default function LoginPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const [isLoading, setIsLoading] = useState(false);

  // Get the redirect URL from the location state
  const from = (location.state as { from?: string })?.from || '/dashboard';

  // Initialize form with validation
  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  });

  // Handle form submission
  const onSubmit = async (data: FormData) => {
    setIsLoading(true);
    
    try {
      const result = await signInWithEmail(data.email, data.password);
      
      if (result.error) {
        console.error('Login error:', result.error);
        toast.error(result.error.message || t('auth.loginError'));
        return;
      }
      
      if (!result.user) {
        toast.error(t('auth.invalidCredentials'));
        return;
      }
      
      toast.success(t('auth.loginSuccess'));
      navigate(from);
    } catch (error) {
      console.error('Login error:', error);
      toast.error(t('auth.loginError'));
    } finally {
      setIsLoading(false);
    }
  };

  // Handle social sign-in
  const handleSocialSignIn = async (provider: 'google') => {
    try {
      await signInWithProvider(provider);
    } catch (error) {
      console.error(`${provider} sign-in error:`, error);
      toast.error(t('auth.socialLoginError'));
    }
  };

  return (
    <MainLayout>
      <div className="flex min-h-screen items-center justify-center px-4 py-12">
        <div className="w-full max-w-md space-y-8">
          <div className="text-center">
            <h1 className="text-3xl font-bold">{t('auth.signIn')}</h1>
            <p className="mt-2 text-sm text-muted-foreground">
              {t('auth.signInDescription')}
            </p>
          </div>

          <div className="mt-8">
            <div className="mt-6">
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                  <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t('auth.emailLabel')}</FormLabel>
                        <FormControl>
                          <Input 
                            type="email" 
                            placeholder="email@example.com" 
                            autoComplete="email"
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
                        <FormLabel>{t('auth.passwordLabel')}</FormLabel>
                        <FormControl>
                          <Input 
                            type="password" 
                            placeholder="••••••••" 
                            autoComplete="current-password"
                            disabled={isLoading}
                            {...field} 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="flex items-center justify-between">
                    <div className="text-sm">
                      <Link 
                        to="/forgot-password" 
                        className="font-medium text-primary hover:text-primary/80"
                      >
                        {t('auth.forgotPassword')}
                      </Link>
                    </div>
                  </div>

                  <div>
                    <Button 
                      type="submit" 
                      className="w-full" 
                      disabled={isLoading}
                    >
                      {isLoading ? (
                        <>
                          <span className="animate-spin mr-2">◌</span>
                          {t('auth.signingIn')}
                        </>
                      ) : (
                        t('auth.signIn')
                      )}
                    </Button>
                  </div>
                </form>
              </Form>
            </div>

            <div className="mt-6">
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-muted-foreground/20"></div>
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="bg-background px-2 text-muted-foreground">
                    {t('auth.orContinueWith')}
                  </span>
                </div>
              </div>

              <div className="mt-6">
                <Button
                  type="button"
                  variant="outline"
                  className="w-full"
                  onClick={() => handleSocialSignIn('google')}
                  disabled={isLoading}
                >
                  <svg
                    className="h-5 w-5 mr-2"
                    aria-hidden="true"
                    viewBox="0 0 24 24"
                  >
                    <path
                      d="M12.0003 4.75C13.7703 4.75 15.3553 5.36002 16.6053 6.54998L20.0303 3.125C17.9502 1.19 15.2353 0 12.0003 0C7.31028 0 3.25527 2.69 1.28027 6.60998L5.27028 9.70498C6.21525 6.86002 8.87028 4.75 12.0003 4.75Z"
                      fill="#EA4335"
                    />
                    <path
                      d="M23.49 12.275C23.49 11.49 23.415 10.73 23.3 10H12V14.51H18.47C18.18 15.99 17.34 17.25 16.08 18.1L19.945 21.1C22.2 19.01 23.49 15.92 23.49 12.275Z"
                      fill="#4285F4"
                    />
                    <path
                      d="M5.26498 14.2949C5.02498 13.5699 4.88501 12.7999 4.88501 11.9999C4.88501 11.1999 5.01998 10.4299 5.26498 9.7049L1.275 6.60986C0.46 8.22986 0 10.0599 0 11.9999C0 13.9399 0.46 15.7699 1.28 17.3899L5.26498 14.2949Z"
                      fill="#FBBC05"
                    />
                    <path
                      d="M12.0001 24.0001C15.2401 24.0001 17.9651 22.935 19.9451 21.095L16.0801 18.095C15.0201 18.82 13.6701 19.245 12.0001 19.245C8.8701 19.245 6.21506 17.135 5.26506 14.29L1.27506 17.385C3.25006 21.31 7.3101 24.0001 12.0001 24.0001Z"
                      fill="#34A853"
                    />
                  </svg>
                  Google
                </Button>
              </div>
            </div>

            <p className="mt-8 text-center text-sm text-muted-foreground">
              {t('auth.noAccount')}{' '}
              <Link
                to="/register"
                className="font-medium text-primary hover:text-primary/80"
              >
                {t('auth.createAccount')}
              </Link>
            </p>
          </div>
        </div>
      </div>
    </MainLayout>
  );
}