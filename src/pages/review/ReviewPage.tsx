import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useSearchParams } from 'react-router-dom';
import MainLayout from '@/components/layout/MainLayout';
import { checkRateLimit, getDeviceFingerprint } from '@/lib/fingerprint';
import { generateReview, getQRCodeInfo, submitReview } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';

import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { toast } from 'sonner';
import { Star, Loader2, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';
import { AiReviewSuggestions } from '@/components/review/AiReviewSuggestions';

// Types
interface QRCodeInfo {
  id: string;
  code: string;
  merchantId: string;
  merchantName: string;
  outletId: string;
  outletName: string;
  outletCity: string;
  outletCountry: string;
  incentiveId?: string;
  incentiveDescription?: string;
}

interface ReviewFormData {
  rating: number;
  comment: string;
}

export default function ReviewPage() {
  const { t, i18n } = useTranslation();
  const [searchParams] = useSearchParams();
  const { user } = useAuth();
  
  const [qrCodeInfo, setQrCodeInfo] = useState<QRCodeInfo | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState<ReviewFormData>({
    rating: 0,
    comment: '',
  });
  const [isSuccess, setIsSuccess] = useState(false);
  const [rateLimitExceeded, setRateLimitExceeded] = useState(false);
  const [deviceFingerprint, setDeviceFingerprint] = useState<string | null>(null);
  
  // AI suggestion states
  const [isLoadingSuggestions, setIsLoadingSuggestions] = useState(false);
  const [mainSuggestion, setMainSuggestion] = useState('');
  const [alternativeSuggestions, setAlternativeSuggestions] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  
  const qrCode = searchParams.get('code');
  
  // Generate a device fingerprint once on component mount
  useEffect(() => {
    const generateFingerprint = async () => {
      try {
        const fingerprint = await getDeviceFingerprint();
        setDeviceFingerprint(fingerprint);
      } catch (error) {
        console.error('Error generating fingerprint:', error);
      }
    };
    
    generateFingerprint();
  }, []);
  
  useEffect(() => {
    const loadQRCodeInfo = async () => {
      if (!qrCode) {
        setError(t('review.invalidQrCode'));
        setIsLoading(false);
        return;
      }
      
      try {
        // First check rate limit
        const isLimited = await checkRateLimit();
        if (isLimited) {
          setRateLimitExceeded(true);
          setIsLoading(false);
          return;
        }
        
        // Then get QR code info
        const info = await getQRCodeInfo(qrCode);
        setQrCodeInfo(info);
        
        // Log the scan for analytics
      } catch (error) {
        console.error('Error loading QR code info:', error);
        setError(t('review.qrCodeError'));
      } finally {
        setIsLoading(false);
      }
    };
    
    loadQRCodeInfo();
  }, [qrCode, t]);
  
  // Generate AI suggestion when rating changes to 3+ stars
  useEffect(() => {
    if (formData.rating >= 3 && qrCodeInfo && !mainSuggestion && !isLoadingSuggestions) {
      generateAiSuggestion();
    }
  }, [formData.rating, qrCodeInfo]);
  
  const generateAiSuggestion = async () => {
    if (!qrCodeInfo || isLoadingSuggestions) return;
    
    setIsLoadingSuggestions(true);
    setShowSuggestions(true);
    
    try {
      const language = i18n.language || 'en';
      const response = await generateReview(
        qrCodeInfo.id,
        formData.rating,
        language
      );
      
      setMainSuggestion(response.review);
      setAlternativeSuggestions(response.alternatives || []);
    } catch (error) {
      console.error('Error generating AI suggestion:', error);
      toast.error(t('review.aiSuggestionError'));
    } finally {
      setIsLoadingSuggestions(false);
    }
  };
  
  const handleRatingClick = (rating: number) => {
    setFormData({ ...formData, rating });
    
    // Clear suggestions when rating changes
    if (rating !== formData.rating) {
      setMainSuggestion('');
      setAlternativeSuggestions([]);
      
      // Only show suggestions for 3+ stars
      if (rating >= 3) {
        setShowSuggestions(true);
      } else {
        setShowSuggestions(false);
      }
    }
  };
  
  const handleSuggestionSelect = (suggestion: string) => {
    setFormData({ ...formData, comment: suggestion });
  };
  
  const handleRefreshSuggestions = () => {
    generateAiSuggestion();
  };
  
  const handleCommentChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setFormData({ ...formData, comment: e.target.value });
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!qrCodeInfo || !deviceFingerprint) return;
    if (formData.rating === 0) {
      toast.error(t('review.ratingRequired'));
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      await submitReview({
        qrCodeId: qrCodeInfo.id,
        merchantId: qrCodeInfo.merchantId,
        outletId: qrCodeInfo.outletId,
        rating: formData.rating,
        comment: formData.comment,
        userId: user?.user?.id,
        deviceFingerprint: deviceFingerprint,
      });
      
      setIsSuccess(true);
      toast.success(t('review.submitSuccess'));
    } catch (error) {
      console.error('Error submitting review:', error);
      toast.error(t('review.submitError'));
    } finally {
      setIsSubmitting(false);
    }
  };
  
  if (isLoading) {
    return (
      <MainLayout hideHeader className="bg-background">
        <div className="flex flex-col items-center justify-center min-h-screen p-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
          <p>{t('review.loading')}</p>
        </div>
      </MainLayout>
    );
  }
  
  if (error || !qrCodeInfo) {
    return (
      <MainLayout hideHeader className="bg-background">
        <div className="flex flex-col items-center justify-center min-h-screen p-4 text-center">
          <div className="bg-red-100 text-red-800 rounded-full p-4 mb-4">
            <AlertTriangle className="h-8 w-8" />
          </div>
          <h1 className="text-2xl font-bold mb-2">{t('review.error')}</h1>
          <p className="text-muted-foreground mb-6">{error || t('review.genericError')}</p>
          <Button asChild>
            <a href="/">{t('review.backToHome')}</a>
          </Button>
        </div>
      </MainLayout>
    );
  }
  
  if (rateLimitExceeded) {
    return (
      <MainLayout hideHeader className="bg-background">
        <div className="flex flex-col items-center justify-center min-h-screen p-4 text-center">
          <div className="bg-amber-100 text-amber-800 rounded-full p-4 mb-4">
            <Clock className="h-8 w-8" />
          </div>
          <h1 className="text-2xl font-bold mb-2">{t('review.rateLimitTitle')}</h1>
          <p className="text-muted-foreground mb-6">{t('review.rateLimitDescription')}</p>
          <Button asChild>
            <a href="/">{t('review.backToHome')}</a>
          </Button>
        </div>
      </MainLayout>
    );
  }
  
  return (
    <MainLayout hideHeader className="bg-background">
      <div className="flex flex-col items-center justify-center min-h-screen p-4">
        <Card className="w-full max-w-md">
          {isSuccess ? (
            <>
              <CardHeader>
                <CardTitle className="text-center">
                  {t('review.thankYou')}
                </CardTitle>
                <CardDescription className="text-center">
                  {t('review.feedbackReceived')}
                </CardDescription>
              </CardHeader>
              <CardContent className="flex flex-col items-center">
                <div className="bg-green-100 text-green-800 rounded-full p-4 mb-6">
                  <CheckCircle className="h-8 w-8" />
                </div>
                
                {qrCodeInfo.incentiveDescription && (
                  <div className="bg-muted p-4 rounded-lg text-center mt-6">
                    <h3 className="font-semibold mb-2">{t('review.yourReward')}</h3>
                    <p>{qrCodeInfo.incentiveDescription}</p>
                  </div>
                )}
              </CardContent>
              <CardFooter>
                <Button asChild className="w-full">
                  <a href="/">{t('review.backToHome')}</a>
                </Button>
              </CardFooter>
            </>
          ) : (
            <>
              <CardHeader>
                <CardTitle>{qrCodeInfo.merchantName}</CardTitle>
                <CardDescription>
                  {qrCodeInfo.outletName}, {qrCodeInfo.outletCity}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit}>
                  <div className="space-y-6">
                    <div>
                      <label className="block text-sm font-medium mb-2">
                        {t('review.ratingLabel')}
                      </label>
                      <div className="flex items-center justify-center space-x-1">
                        {[1, 2, 3, 4, 5].map((rating) => (
                          <button
                            key={rating}
                            type="button"
                            onClick={() => handleRatingClick(rating)}
                            className="focus:outline-none p-1"
                          >
                            <Star
                              className={cn(
                                "w-8 h-8 transition-all",
                                formData.rating >= rating
                                  ? "fill-yellow-400 text-yellow-400"
                                  : "text-gray-300"
                              )}
                            />
                          </button>
                        ))}
                      </div>
                      {formData.rating > 0 && (
                        <p className="text-center text-sm mt-2 text-muted-foreground">
                          {t(`review.ratingText.${formData.rating}`)}
                        </p>
                      )}
                    </div>
                    
                    <div>
                      <label htmlFor="comment" className="block text-sm font-medium mb-2">
                        {t('review.commentLabel')}
                      </label>
                      <Textarea
                        id="comment"
                        placeholder={t('review.commentPlaceholder')}
                        rows={4}
                        value={formData.comment}
                        onChange={handleCommentChange}
                      />
                    </div>
                    
                    {/* AI Review Suggestions */}
                    {showSuggestions && formData.rating >= 3 && (
                      <div className="mt-4">
                        <AiReviewSuggestions
                          isLoading={isLoadingSuggestions}
                          mainSuggestion={mainSuggestion}
                          alternativeSuggestions={alternativeSuggestions}
                          onSelectSuggestion={handleSuggestionSelect}
                          onRefreshSuggestions={handleRefreshSuggestions}
                          rating={formData.rating}
                        />
                      </div>
                    )}
                    
                    {/* If rating is below 3, show a message that AI suggestions are only for 3+ stars */}
                    {formData.rating > 0 && formData.rating < 3 && (
                      <div className="mt-4 text-sm text-muted-foreground text-center p-2 bg-muted/30 rounded">
                        <p>{t('review.noSuggestionsForLowRating', 'AI suggestions are available for 3+ star ratings')}</p>
                      </div>
                    )}
                    
                    {qrCodeInfo.incentiveDescription && (
                      <div className="bg-muted p-4 rounded-lg text-center mt-4">
                        <h3 className="font-semibold mb-2">{t('review.incentive')}</h3>
                        <p>{qrCodeInfo.incentiveDescription}</p>
                      </div>
                    )}
                    
                    <Button 
                      type="submit" 
                      className="w-full" 
                      disabled={isSubmitting || formData.rating === 0}
                    >
                      {isSubmitting ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          {t('review.submitting')}
                        </>
                      ) : (
                        t('review.submit')
                      )}
                    </Button>
                  </div>
                </form>
              </CardContent>
            </>
          )}
        </Card>
      </div>
    </MainLayout>
  );
}

// Add missing icons
function AlertTriangle(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z" />
      <path d="M12 9v4" />
      <path d="M12 17h.01" />
    </svg>
  );
}

function CheckCircle(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
      <path d="m9 11 3 3L22 4" />
    </svg>
  );
}

function Clock(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="12" cy="12" r="10" />
      <polyline points="12 6 12 12 16 14" />
    </svg>
  );
}