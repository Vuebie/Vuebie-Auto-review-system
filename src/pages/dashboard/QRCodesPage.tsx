import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { useAuth } from '@/contexts/AuthContext';
import { supabase, TABLES } from '@/lib/supabase';
import { downloadQrCode } from '@/lib/qrcode';

import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import {
  QrCode,
  Plus,
  MoreHorizontal,
  Search,
  Download,
  Building2,
  Link as LinkIcon,
  Eye,
} from 'lucide-react';
import { toast } from 'sonner';

// Define QR code type
interface QRCode {
  id: string;
  name: string;
  outlet_id: string;
  outlet_name: string;
  code: string;
  scans_count: number;
  reviews_count: number;
  created_at: string;
}

export default function QRCodesPage() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [qrCodes, setQrCodes] = useState<QRCode[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    const fetchQrCodes = async () => {
      if (!user?.user?.id) return;

      setIsLoading(true);
      try {
        // Fetch QR codes with outlet information, scans count, and reviews count
        const { data, error } = await supabase
          .from(TABLES.QR_CODES)
          .select(`
            id, name, code, created_at,
            outlets:${TABLES.OUTLETS}(id, name),
            scans:${TABLES.QR_SCANS}(id),
            reviews:${TABLES.REVIEW_SESSIONS}(id)
          `)
          .eq('merchant_id', user.user.id)
          .order('created_at', { ascending: false });

        if (error) throw error;

        // Transform the data to include counts and outlet name
        const transformedQrCodes = data.map((qrCode) => ({
          id: qrCode.id,
          name: qrCode.name,
          outlet_id: qrCode.outlets?.id || '',
          outlet_name: qrCode.outlets?.name || t('qrCodes.noOutlet'),
          code: qrCode.code,
          scans_count: qrCode.scans?.length || 0,
          reviews_count: qrCode.reviews?.length || 0,
          created_at: qrCode.created_at,
        }));

        setQrCodes(transformedQrCodes);
      } catch (error) {
        console.error('Error fetching QR codes:', error);
        toast.error(t('qrCodes.fetchError'));
      } finally {
        setIsLoading(false);
      }
    };

    if (user?.user?.id) {
      fetchQrCodes();
    }
  }, [user?.user?.id, t]);

  // Filter QR codes based on search query
  const filteredQrCodes = qrCodes.filter(
    (qrCode) =>
      qrCode.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      qrCode.outlet_name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Handle QR code download
  const handleDownload = async (qrCode: QRCode) => {
    try {
      const appUrl = window.location.origin;
      const reviewUrl = `${appUrl}/review?code=${qrCode.code}`;
      
      await downloadQrCode(reviewUrl, qrCode.name);
      toast.success(t('qrCodes.downloadSuccess'));
    } catch (error) {
      console.error('Error downloading QR code:', error);
      toast.error(t('qrCodes.downloadError'));
    }
  };

  return (
    <DashboardLayout
      title={t('qrCodes.title')}
      description={t('qrCodes.description')}
    >
      {/* Actions Bar */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div className="relative w-full sm:w-64">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder={t('qrCodes.searchPlaceholder')}
            className="pl-8"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <Button asChild>
          <Link to="/qr-codes/new">
            <Plus className="mr-2 h-4 w-4" /> {t('qrCodes.createQrCode')}
          </Link>
        </Button>
      </div>

      {/* QR Codes Grid/List */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(3)].map((_, i) => (
            <Card key={i}>
              <CardHeader>
                <Skeleton className="h-6 w-3/4 mb-2" />
                <Skeleton className="h-4 w-1/2" />
              </CardHeader>
              <CardContent className="flex justify-center py-6">
                <Skeleton className="h-32 w-32" />
              </CardContent>
              <CardFooter className="flex justify-between">
                <Skeleton className="h-8 w-20" />
                <Skeleton className="h-8 w-8 rounded-full" />
              </CardFooter>
            </Card>
          ))}
        </div>
      ) : filteredQrCodes.length === 0 ? (
        <div className="text-center py-12">
          {qrCodes.length === 0 ? (
            <>
              <QrCode className="mx-auto h-12 w-12 text-muted-foreground/50 mb-4" />
              <h3 className="text-lg font-medium">{t('qrCodes.noQrCodesYet')}</h3>
              <p className="text-muted-foreground mt-2 mb-6 max-w-md mx-auto">
                {t('qrCodes.createFirstQrCode')}
              </p>
              <Button asChild>
                <Link to="/qr-codes/new">
                  <Plus className="mr-2 h-4 w-4" /> {t('qrCodes.createQrCode')}
                </Link>
              </Button>
            </>
          ) : (
            <>
              <Search className="mx-auto h-12 w-12 text-muted-foreground/50 mb-4" />
              <h3 className="text-lg font-medium">{t('qrCodes.noSearchResults')}</h3>
              <p className="text-muted-foreground mt-2">
                {t('qrCodes.tryDifferentSearch')}
              </p>
            </>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredQrCodes.map((qrCode) => (
            <Card key={qrCode.id}>
              <CardHeader>
                <CardTitle>{qrCode.name}</CardTitle>
                <CardDescription className="flex items-center">
                  <Building2 className="h-3.5 w-3.5 mr-1" />
                  {qrCode.outlet_name}
                </CardDescription>
              </CardHeader>
              <CardContent className="flex justify-center py-6">
                {/* QR Code Image Placeholder - In a real app, this would be the actual QR code */}
                <div className="bg-white p-2 rounded-lg shadow-sm">
                  <QrCode className="h-32 w-32 text-black" />
                </div>
              </CardContent>
              <CardFooter className="flex justify-between">
                <div className="flex space-x-2">
                  <Button variant="outline" size="sm" onClick={() => handleDownload(qrCode)}>
                    <Download className="h-4 w-4 mr-1" />
                    {t('qrCodes.download')}
                  </Button>
                </div>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon">
                      <MoreHorizontal className="h-4 w-4" />
                      <span className="sr-only">{t('qrCodes.actions')}</span>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem asChild>
                      <Link to={`/qr-codes/${qrCode.id}`}>
                        <Eye className="h-4 w-4 mr-2" />
                        {t('qrCodes.viewDetails')}
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => {
                      const appUrl = window.location.origin;
                      const reviewUrl = `${appUrl}/review?code=${qrCode.code}`;
                      navigator.clipboard.writeText(reviewUrl);
                      toast.success(t('qrCodes.linkCopied'));
                    }}>
                      <LinkIcon className="h-4 w-4 mr-2" />
                      {t('qrCodes.copyLink')}
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleDownload(qrCode)}>
                      <Download className="h-4 w-4 mr-2" />
                      {t('qrCodes.download')}
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem className="text-destructive">
                      {t('qrCodes.delete')}
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}
    </DashboardLayout>
  );
}