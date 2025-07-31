import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { useAuth } from '@/contexts/AuthContext';
import { supabase, TableNames } from '@/lib/supabase';

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
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { CheckCircle2, CreditCard, Loader2, Zap } from 'lucide-react';

// Define subscription tier types
enum SubscriptionTier {
  FREE = 'free',
  STARTER = 'starter',
  PRO = 'pro',
}

// Define pricing plans
const pricingPlans = [
  {
    id: SubscriptionTier.FREE,
    name: 'Free',
    price: '0',
    features: [
      'features.outlets.free',
      'features.qrCodes.free',
      'features.templates.free',
      'features.analytics.free',
    ],
    limits: {
      outlets: 1,
      qrCodes: 3,
      reviewsPerMonth: 50,
    },
  },
  {
    id: SubscriptionTier.STARTER,
    name: 'Starter',
    price: '9.99',
    features: [
      'features.outlets.starter',
      'features.qrCodes.starter',
      'features.templates.starter',
      'features.analytics.starter',
      'features.incentives.starter',
    ],
    limits: {
      outlets: 5,
      qrCodes: 25,
      reviewsPerMonth: 250,
    },
  },
  {
    id: SubscriptionTier.PRO,
    name: 'Pro',
    price: '29.99',
    features: [
      'features.outlets.pro',
      'features.qrCodes.pro',
      'features.templates.pro',
      'features.analytics.pro',
      'features.incentives.pro',
      'features.customDomain.pro',
      'features.api.pro',
    ],
    limits: {
      outlets: 'unlimited',
      qrCodes: 'unlimited',
      reviewsPerMonth: 'unlimited',
    },
  },
];

// Define subscription type
interface Subscription {
  tier: SubscriptionTier;
  status: 'active' | 'canceled' | 'past_due' | 'trialing';
  currentPeriodEnd: string;
  cancelAtPeriodEnd: boolean;
}

export default function SubscriptionPage() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [isUpgrading, setIsUpgrading] = useState(false);
  const [isCanceling, setIsCanceling] = useState(false);
  const [isResuming, setIsResuming] = useState(false);
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('monthly');

  useEffect(() => {
    const fetchSubscription = async () => {
      if (!user?.id) return;

      setIsLoading(true);
      try {
        // Fetch subscription from Supabase
        await new Promise(resolve => setTimeout(resolve, 1000));
        setSubscription({
          tier: SubscriptionTier.FREE,
          status: 'active',
          currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days from now
          cancelAtPeriodEnd: false,
        });
      } catch (error) {
        console.error('Error fetching subscription:', error);
        toast.error(t('subscription.fetchError'));
      } finally {
        setIsLoading(false);
      }
    };

    if (user?.id) {
      fetchSubscription();
    }
  }, [user?.id, t]);

  const handleUpgrade = async (tier: SubscriptionTier) => {
    setIsUpgrading(true);
    
    try {
      // Process subscription upgrade
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      toast.success(t('subscription.checkoutRedirectMessage'));
    } catch (error) {
      console.error('Error initiating checkout:', error);
      toast.error(t('subscription.checkoutError'));
    } finally {
      setIsUpgrading(false);
    }
  };

  const handleCancelSubscription = async () => {
    setIsCanceling(true);
    
    try {
      // Process subscription cancellation
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Update subscription state
      setSubscription(prev => prev ? {
        ...prev,
        cancelAtPeriodEnd: true,
      } : null);
      
      toast.success(t('subscription.cancelSuccess'));
    } catch (error) {
      console.error('Error canceling subscription:', error);
      toast.error(t('subscription.cancelError'));
    } finally {
      setIsCanceling(false);
    }
  };

  const handleResumeSubscription = async () => {
    setIsResuming(true);
    
    try {
      // Process subscription resumption
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Update subscription state
      setSubscription(prev => prev ? {
        ...prev,
        cancelAtPeriodEnd: false,
      } : null);
      
      toast.success(t('subscription.resumeSuccess'));
    } catch (error) {
      console.error('Error resuming subscription:', error);
      toast.error(t('subscription.resumeError'));
    } finally {
      setIsResuming(false);
    }
  };

  // Calculate yearly price with 20% discount
  const getYearlyPrice = (monthlyPrice: string) => {
    const price = parseFloat(monthlyPrice);
    return ((price * 12) * 0.8).toFixed(2); // 20% discount
  };

  // Function to get feature text with proper limits
  const getFeatureText = (key: string, plan: typeof pricingPlans[0]) => {
    const baseKey = key.split('.')[0];
    const featureKey = key.split('.')[1];
    
    // Check if this is a limited feature that needs the limit value
    if (baseKey === 'features' && plan.limits) {
      if (featureKey === 'outlets' || featureKey === 'qrCodes' || featureKey === 'reviewsPerMonth') {
        return t(key, { limit: plan.limits[featureKey] });
      }
    }
    
    return t(key);
  };

  return (
    <DashboardLayout
      title={t('subscription.title')}
      description={t('subscription.description')}
    >
      {/* Current Plan */}
      {isLoading ? (
        <Card>
          <CardHeader>
            <Skeleton className="h-8 w-48 mb-2" />
            <Skeleton className="h-4 w-72" />
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <Skeleton className="h-24 w-full" />
            </div>
          </CardContent>
          <CardFooter>
            <Skeleton className="h-10 w-32" />
          </CardFooter>
        </Card>
      ) : subscription ? (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>{t('subscription.currentPlan')}</CardTitle>
                <CardDescription>{t('subscription.currentPlanDescription')}</CardDescription>
              </div>
              <Badge variant={subscription.tier === SubscriptionTier.FREE ? 'outline' : 'default'}>
                {t(`subscription.tiers.${subscription.tier}`)}
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {subscription.tier !== SubscriptionTier.FREE && (
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-4 rounded-lg bg-muted">
                  <div>
                    <h3 className="font-medium">{t('subscription.billingInfo')}</h3>
                    <div className="flex items-center gap-2 mt-1 text-sm">
                      <CreditCard className="h-4 w-4" />
                      <span>••••</span>
                      <span>4242</span>
                      <Badge variant="outline" className="ml-2">
                        {billingCycle === 'monthly' ? t('subscription.monthly') : t('subscription.yearly')}
                      </Badge>
                    </div>
                    
                    {subscription.cancelAtPeriodEnd && (
                      <div className="mt-2 text-sm text-muted-foreground">
                        {t('subscription.expiresOn', { 
                          date: new Date(subscription.currentPeriodEnd).toLocaleDateString() 
                        })}
                      </div>
                    )}
                  </div>
                  
                  <div>
                    {subscription.cancelAtPeriodEnd ? (
                      <Button 
                        variant="outline" 
                        onClick={handleResumeSubscription}
                        disabled={isResuming}
                      >
                        {isResuming ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            {t('subscription.resuming')}
                          </>
                        ) : (
                          t('subscription.resumeSubscription')
                        )}
                      </Button>
                    ) : (
                      <Button 
                        variant="outline" 
                        onClick={handleCancelSubscription}
                        disabled={isCanceling}
                      >
                        {isCanceling ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            {t('subscription.canceling')}
                          </>
                        ) : (
                          t('subscription.cancelSubscription')
                        )}
                      </Button>
                    )}
                  </div>
                </div>
              )}
              
              <div>
                <h3 className="font-medium mb-2">{t('subscription.planFeatures')}</h3>
                <ul className="space-y-2">
                  {pricingPlans.find(plan => plan.id === subscription.tier)?.features.map((feature, index) => (
                    <li key={index} className="flex items-start">
                      <CheckCircle2 className="h-5 w-5 text-green-500 mr-2 mt-0.5 shrink-0" />
                      <span>{getFeatureText(feature, pricingPlans.find(plan => plan.id === subscription.tier)!)}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </CardContent>
          <CardFooter>
            {subscription.tier !== SubscriptionTier.PRO && (
              <Button onClick={() => handleUpgrade(SubscriptionTier.PRO)}>
                {t('subscription.upgradeToPro')}
              </Button>
            )}
          </CardFooter>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>{t('subscription.noSubscription')}</CardTitle>
            <CardDescription>{t('subscription.noSubscriptionDescription')}</CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => handleUpgrade(SubscriptionTier.STARTER)}>
              {t('subscription.choosePlan')}
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Pricing Plans */}
      <div className="mt-12">
        <div className="flex flex-col items-center mb-8 text-center">
          <h2 className="text-2xl font-semibold">{t('subscription.pricingPlans')}</h2>
          <p className="text-muted-foreground mt-2 mb-6 max-w-2xl">
            {t('subscription.pricingDescription')}
          </p>
          
          <div className="flex items-center space-x-2 bg-muted p-1 rounded-lg">
            <div
              className={`px-4 py-2 rounded-md cursor-pointer ${
                billingCycle === 'monthly' 
                  ? 'bg-background shadow-sm' 
                  : 'text-muted-foreground'
              }`}
              onClick={() => setBillingCycle('monthly')}
            >
              {t('subscription.monthly')}
            </div>
            <div
              className={`px-4 py-2 rounded-md cursor-pointer flex items-center ${
                billingCycle === 'yearly' 
                  ? 'bg-background shadow-sm' 
                  : 'text-muted-foreground'
              }`}
              onClick={() => setBillingCycle('yearly')}
            >
              {t('subscription.yearly')}
              <Badge variant="success" className="ml-1.5 bg-green-100 text-green-800 hover:bg-green-100">
                -20%
              </Badge>
            </div>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {pricingPlans.map((plan) => (
            <Card 
              key={plan.id} 
              className={`relative ${
                plan.id === SubscriptionTier.PRO 
                  ? 'border-primary shadow-md' 
                  : ''
              }`}
            >
              {plan.id === SubscriptionTier.PRO && (
                <div className="absolute -top-3 left-0 right-0 flex justify-center">
                  <Badge className="bg-primary hover:bg-primary">
                    {t('subscription.mostPopular')}
                  </Badge>
                </div>
              )}
              <CardHeader>
                <CardTitle>{t(`subscription.tiers.${plan.id}`)}</CardTitle>
                <div className="mt-2">
                  <span className="text-3xl font-bold">
                    ${billingCycle === 'monthly' ? plan.price : getYearlyPrice(plan.price)}
                  </span>
                  <span className="text-muted-foreground ml-1">
                    {billingCycle === 'monthly' ? t('subscription.perMonth') : t('subscription.perYear')}
                  </span>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <ul className="space-y-2">
                  {plan.features.map((feature, index) => (
                    <li key={index} className="flex items-start">
                      <CheckCircle2 className="h-5 w-5 text-green-500 mr-2 mt-0.5 shrink-0" />
                      <span>{getFeatureText(feature, plan)}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
              <CardFooter>
                <Button
                  onClick={() => handleUpgrade(plan.id as SubscriptionTier)}
                  disabled={isUpgrading || (subscription?.tier === plan.id && !subscription?.cancelAtPeriodEnd)}
                  variant={plan.id === SubscriptionTier.PRO ? 'default' : 'outline'}
                  className="w-full"
                >
                  {isUpgrading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      {t('subscription.processing')}
                    </>
                  ) : subscription?.tier === plan.id && !subscription?.cancelAtPeriodEnd ? (
                    t('subscription.currentPlanButton')
                  ) : plan.id === SubscriptionTier.FREE ? (
                    t('subscription.startWithFree')
                  ) : (
                    t('subscription.selectPlan')
                  )}
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      </div>

      {/* FAQ Section */}
      <div className="mt-16">
        <h2 className="text-2xl font-semibold mb-6 text-center">{t('subscription.faqTitle')}</h2>
        <Accordion type="single" collapsible className="max-w-3xl mx-auto">
          <AccordionItem value="item-1">
            <AccordionTrigger>{t('subscription.faq.q1')}</AccordionTrigger>
            <AccordionContent>{t('subscription.faq.a1')}</AccordionContent>
          </AccordionItem>
          <AccordionItem value="item-2">
            <AccordionTrigger>{t('subscription.faq.q2')}</AccordionTrigger>
            <AccordionContent>{t('subscription.faq.a2')}</AccordionContent>
          </AccordionItem>
          <AccordionItem value="item-3">
            <AccordionTrigger>{t('subscription.faq.q3')}</AccordionTrigger>
            <AccordionContent>{t('subscription.faq.a3')}</AccordionContent>
          </AccordionItem>
          <AccordionItem value="item-4">
            <AccordionTrigger>{t('subscription.faq.q4')}</AccordionTrigger>
            <AccordionContent>{t('subscription.faq.a4')}</AccordionContent>
          </AccordionItem>
          <AccordionItem value="item-5">
            <AccordionTrigger>{t('subscription.faq.q5')}</AccordionTrigger>
            <AccordionContent>{t('subscription.faq.a5')}</AccordionContent>
          </AccordionItem>
        </Accordion>
      </div>
    </DashboardLayout>
  );
}