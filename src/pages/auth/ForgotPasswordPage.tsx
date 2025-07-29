import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import MainLayout from '@/components/layout/MainLayout';
import { resetPassword } from '@/lib/auth';
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
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle, CheckCircle2 } from 'lucide-react';

// Define the form schema
const formSchema = z.object({
  email: z
    .string()
    .min(1, { message: 'Email is required' })
    .email({ message: 'Invalid email address' }),
});

type FormData = z.infer<typeof formSchema>;

export default function ForgotPasswordPage() {
  const { t } = useTranslation();
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  // Initialize form with validation
  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: '',
    },
  });

  // Handle form submission
  const onSubmit = async (data: FormData) => {
    setIsLoading(true);
    
    try {
      await resetPassword(data.email);
      setIsSuccess(true);
      toast.success(t('auth.resetPasswordEmailSent'));
    } catch (error) {
      console.error('Password reset error:', error);
      toast.error(t('auth.resetPasswordError'));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <MainLayout>
      <div className="flex min-h-screen items-center justify-center px-4 py-12">
        <div className="w-full max-w-md space-y-8">
          <div className="text-center">
            <h1 className="text-3xl font-bold">{t('auth.forgotPassword')}</h1>
            <p className="mt-2 text-sm text-muted-foreground">
              {t('auth.forgotPasswordDescription')}
            </p>
          </div>

          {isSuccess ? (
            <div className="mt-8">
              <Alert variant="default" className="border-green-500 bg-green-50 text-green-700">
                <CheckCircle2 className="h-4 w-4 text-green-500" />
                <AlertDescription>
                  {t('auth.resetPasswordEmailSentDescription')}
                </AlertDescription>
              </Alert>
              <div className="mt-6 text-center">
                <Button asChild variant="link">
                  <Link to="/login">{t('auth.backToLogin')}</Link>
                </Button>
              </div>
            </div>
          ) : (
            <div className="mt-8">
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

                  <div>
                    <Button 
                      type="submit" 
                      className="w-full" 
                      disabled={isLoading}
                    >
                      {isLoading ? (
                        <>
                          <span className="animate-spin mr-2">◌</span>
                          {t('auth.sending')}
                        </>
                      ) : (
                        t('auth.sendResetLink')
                      )}
                    </Button>
                  </div>
                </form>
              </Form>

              <p className="mt-8 text-center text-sm text-muted-foreground">
                {t('auth.rememberedPassword')}{' '}
                <Link
                  to="/login"
                  className="font-medium text-primary hover:text-primary/80"
                >
                  {t('auth.backToLogin')}
                </Link>
              </p>
            </div>
          )}
        </div>
      </div>
    </MainLayout>
  );
}