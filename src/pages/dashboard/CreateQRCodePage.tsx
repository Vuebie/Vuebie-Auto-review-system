import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { v4 as uuidv4 } from 'uuid';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { useAuth } from '@/contexts/AuthContext';
import { supabase, TABLES } from '@/lib/supabase';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { QrCode, Building2 } from 'lucide-react';
import { toast } from 'sonner';

export default function CreateQRCodePage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    outlet_id: '',
  });
  const [outlets, setOutlets] = useState<Array<{ id: string; name: string }>>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Fetch outlets for the dropdown
  useEffect(() => {
    const fetchOutlets = async () => {
      if (!user?.id) return;

      try {
        const { data, error } = await supabase
          .from(TABLES.OUTLETS)
          .select('id, name')
          .eq('merchant_id', user.id)
          .order('name');

        if (error) throw error;
        setOutlets(data || []);
      } catch (error) {
        console.error('Error fetching outlets:', error);
        toast.error(t('common.error'));
      } finally {
        setIsLoading(false);
      }
    };

    fetchOutlets();
  }, [user?.id, t]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleOutletChange = (value: string) => {
    setFormData((prev) => ({ ...prev, outlet_id: value }));
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    
    if (!formData.name.trim()) {
      toast.error(t('common.required'));
      return;
    }

    setIsSubmitting(true);
    
    try {
      // Generate a unique code for the QR
      const code = uuidv4();
      
      // Create new QR code
      const { error } = await supabase
        .from(TABLES.QR_CODES)
        .insert({
          name: formData.name,
          outlet_id: formData.outlet_id || null,
          merchant_id: user.id,
          code: code,
          active: true
        });

      if (error) throw error;
      
      toast.success(t('merchant.addQrCode') + ' ' + t('common.success'));
      navigate('/qr-codes');
    } catch (error) {
      console.error('Error creating QR code:', error);
      toast.error(t('common.error'));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <DashboardLayout
      title={t('merchant.addQrCode')}
      description={t('qrCodes.createQrCode')}
    >
      <Card className="max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <QrCode className="h-5 w-5" />
            {t('merchant.addQrCode')}
          </CardTitle>
          <CardDescription>
            {t('qrCodes.createQrCode')}
          </CardDescription>
        </CardHeader>
        
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="name">{t('merchant.qrCodeName')} *</Label>
              <Input
                id="name"
                name="name"
                value={formData.name}
                onChange={handleChange}
                placeholder="e.g., Front Door QR, Table 5 QR"
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="outlet_id">
                <div className="flex items-center gap-1">
                  <Building2 className="h-4 w-4" />
                  {t('merchant.outlets')}
                </div>
              </Label>
              <Select
                value={formData.outlet_id}
                onValueChange={handleOutletChange}
              >
                <SelectTrigger id="outlet_id">
                  <SelectValue placeholder={isLoading ? t('common.loading') : t('qrCodes.selectOutlet')} />
                </SelectTrigger>
                <SelectContent>
                  {outlets.map((outlet) => (
                    <SelectItem key={outlet.id} value={outlet.id}>
                      {outlet.name}
                    </SelectItem>
                  ))}
                  {outlets.length === 0 && !isLoading && (
                    <SelectItem value="" disabled>
                      {t('qrCodes.noOutlets')}
                    </SelectItem>
                  )}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
          
          <CardFooter className="flex justify-between">
            <Button
              type="button"
              variant="outline"
              onClick={() => navigate('/qr-codes')}
              disabled={isSubmitting}
            >
              {t('common.cancel')}
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <div className="animate-spin mr-2 h-4 w-4 border-2 border-current border-t-transparent rounded-full" />
                  {t('common.loading')}
                </>
              ) : (
                t('common.create')
              )}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </DashboardLayout>
  );
}