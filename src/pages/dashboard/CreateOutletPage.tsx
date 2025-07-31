import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { useAuth } from '@/contexts/AuthContext';
import { supabase, TABLES } from '@/lib/supabase';
import { useToast } from '@/hooks/use-toast';

import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { ArrowLeft, Building2 } from 'lucide-react';

// Form validation schema
const outletSchema = z.object({
  name: z.string().min(1, "Name is required"),
  address: z.string().min(1, "Address is required"),
  phone: z.string().optional(),
});

type OutletFormData = z.infer<typeof outletSchema>;

export default function CreateOutletPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<OutletFormData>({
    resolver: zodResolver(outletSchema),
    defaultValues: {
      name: '',
      address: '',
      city: '',
      country: '',
      phone: '',
      website: '',
      description: '',
    },
  });

  const onSubmit = async (data: OutletFormData) => {
    if (!user?.id) {
      toast({
        title: t('common.error'),
        description: t('auth.notAuthenticated'),
        variant: 'destructive',
      });
      return;
    }

    setIsLoading(true);

    try {
      const { error } = await supabase
        .from(TABLES.OUTLETS)
        .insert({
          name: data.name,
          address: data.address,
          contact_phone: data.phone || null,
          merchant_id: user.id,
        });

      if (error) {
        console.error('Error creating outlet:', error);
        toast({
          title: t('common.error'),
          description: t('outlets.createError'),
          variant: 'destructive',
        });
        return;
      }

      toast({
        title: t('common.success'),
        description: t('outlets.createSuccess'),
      });

      navigate('/outlets');
    } catch (error) {
      console.error('Error creating outlet:', error);
      toast({
        title: t('common.error'),
        description: t('outlets.createError'),
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center space-x-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate('/outlets')}
            className="flex items-center space-x-2"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>{t('common.back')}</span>
          </Button>
        </div>

        <div className="flex items-center space-x-3">
          <Building2 className="h-8 w-8 text-primary" />
          <div>
            <h1 className="text-3xl font-bold tracking-tight">{t('outlets.createOutlet')}</h1>
            <p className="text-muted-foreground">{t('outlets.createOutletDescription')}</p>
          </div>
        </div>

        {/* Form */}
        <Card className="max-w-2xl">
          <CardHeader>
            <CardTitle>{t('outlets.outletDetails')}</CardTitle>
            <CardDescription>{t('outlets.fillOutletInfo')}</CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t('outlets.name')} *</FormLabel>
                        <FormControl>
                          <Input placeholder={t('outlets.namePlaceholder')} {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="phone"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t('outlets.phone')}</FormLabel>
                        <FormControl>
                          <Input placeholder={t('outlets.phonePlaceholder')} {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="address"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('outlets.address')} *</FormLabel>
                      <FormControl>
                        <Input placeholder={t('outlets.addressPlaceholder')} {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />





                <div className="flex justify-end space-x-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => navigate('/outlets')}
                    disabled={isLoading}
                  >
                    {t('common.cancel')}
                  </Button>
                  <Button type="submit" disabled={isLoading}>
                    {isLoading ? t('common.creating') : t('outlets.createOutlet')}
                  </Button>
                </div>
              </form>
            </Form>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}