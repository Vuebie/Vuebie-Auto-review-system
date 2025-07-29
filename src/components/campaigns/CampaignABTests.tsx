import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../hooks/use-toast';
import { supabase } from '../../lib/supabase';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '../ui/dialog';
import { Switch } from '../ui/switch';
import { Badge } from '../ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { useForm, Controller } from 'react-hook-form';
import {
  PlayIcon,
  PauseIcon,
  Trash2Icon,
  PlusCircleIcon,
  AlertTriangleIcon,
  CheckCircle2Icon,
} from 'lucide-react';
import { format } from 'date-fns';

interface ABTest {
  id: string;
  campaign_id: string;
  name: string;
  status: 'running' | 'paused' | 'completed';
  metric_type: string;
  variant_a: {
    name: string;
    description?: string;
    views: number;
    conversions: number;
    conversion_rate?: number;
  };
  variant_b: {
    name: string;
    description?: string;
    views: number;
    conversions: number;
    conversion_rate?: number;
  };
  winner?: 'A' | 'B' | null;
  confidence_level?: number;
  start_date: string;
  end_date?: string;
  created_at: string;
  updated_at: string;
}

interface TestFormValues {
  name: string;
  metric_type: string;
  variant_a_name: string;
  variant_a_description: string;
  variant_b_name: string;
  variant_b_description: string;
  active: boolean;
}

interface CampaignABTestsProps {
  campaignId: string;
  campaignName: string;
}

export default function CampaignABTests({ campaignId, campaignName }: CampaignABTestsProps) {
  const { t } = useTranslation();
  const { user } = useAuth();
  const { showToast } = useToast();
  const [tests, setTests] = useState<ABTest[]>([]);
  const [loading, setLoading] = useState(true);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [activeTestId, setActiveTestId] = useState<string | null>(null);

  const {
    control,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<TestFormValues>({
    defaultValues: {
      name: '',
      metric_type: 'conversion_rate',
      variant_a_name: 'Original',
      variant_a_description: '',
      variant_b_name: 'Variation',
      variant_b_description: '',
      active: true
    }
  });

  useEffect(() => {
    fetchTests();
  }, [campaignId]);

  const fetchTests = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('app_aa9a812f43_ab_tests')
        .select('*')
        .eq('campaign_id', campaignId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setTests(data || []);
    } catch (err) {
      // Log error fetching AB tests
      showToast('error', t('common.error'));
    } finally {
      setLoading(false);
    }
  };

  const onCreateTest = async (data: TestFormValues) => {
    try {
      const now = new Date().toISOString();
      
      const newTest = {
        campaign_id: campaignId,
        name: data.name,
        status: data.active ? 'running' : 'paused',
        metric_type: data.metric_type,
        variant_a: {
          name: data.variant_a_name,
          description: data.variant_a_description,
          views: 0,
          conversions: 0,
          conversion_rate: 0
        },
        variant_b: {
          name: data.variant_b_name,
          description: data.variant_b_description,
          views: 0,
          conversions: 0,
          conversion_rate: 0
        },
        start_date: now
      };
      
      const { error } = await supabase
        .from('app_aa9a812f43_ab_tests')
        .insert([newTest]);
        
      if (error) throw error;
      
      showToast('success', t('campaigns.abTesting.testCreated'));
      setCreateDialogOpen(false);
      reset();
      fetchTests();
    } catch (err) {
      // Log error creating test
      showToast('error', t('common.error'));
    }
  };

  const handleStatusChange = async (testId: string, newStatus: 'running' | 'paused' | 'completed') => {
    try {
      const updates: {
        status: string;
        end_date?: string;
        winner?: string | null;
        confidence_level?: number;
      } = {
        status: newStatus
      };
      
      // If completing the test, set the end date
      if (newStatus === 'completed') {
        updates.end_date = new Date().toISOString();
        
        // Calculate the winner
        const test = tests.find(t => t.id === testId);
        if (test) {
          const variantA = test.variant_a;
          const variantB = test.variant_b;
          
          // Calculate conversion rates
          const rateA = variantA.views > 0 ? (variantA.conversions / variantA.views) * 100 : 0;
          const rateB = variantB.views > 0 ? (variantB.conversions / variantB.views) * 100 : 0;
          
          // Determine winner - this is a simplified approach
          if (rateA > rateB && (rateA - rateB) / rateB > 0.1) {
            // A is 10% better than B
            updates.winner = 'A';
            updates.confidence_level = 95; // Simplified
          } else if (rateB > rateA && (rateB - rateA) / rateA > 0.1) {
            // B is 10% better than A
            updates.winner = 'B';
            updates.confidence_level = 95; // Simplified
          } else {
            // No clear winner
            updates.winner = null;
            updates.confidence_level = 0;
          }
        }
      }
      
      const { error } = await supabase
        .from('app_aa9a812f43_ab_tests')
        .update(updates as Record<string, unknown>)
        .eq('id', testId);
        
      if (error) throw error;
      
      showToast('success', t(`campaigns.abTesting.test${newStatus.charAt(0).toUpperCase() + newStatus.slice(1)}`));
      fetchTests();
    } catch (err) {
      // Log error updating test status
      showToast('error', t('common.error'));
    }
  };

  const handleDeleteTest = async (testId: string) => {
    try {
      const { error } = await supabase
        .from('app_aa9a812f43_ab_tests')
        .delete()
        .eq('id', testId);
        
      if (error) throw error;
      
      showToast('success', t('campaigns.abTesting.testDeleted'));
      setConfirmDeleteId(null);
      fetchTests();
    } catch (err) {
      // Log error deleting test
      showToast('error', t('common.error'));
    }
  };
  
  const getMetricLabel = (metricType: string) => {
    switch (metricType) {
      case 'conversion_rate':
        return t('campaigns.abTesting.conversionRate');
      case 'click_rate':
        return t('incentives.clickRate');
      case 'engagement_time':
        return t('analytics.timeSpent');
      default:
        return metricType;
    }
  };

  const renderTestResults = (test: ABTest) => {
    // Calculate stats
    const variantA = test.variant_a;
    const variantB = test.variant_b;
    
    const conversionRateA = variantA.views > 0 
      ? (variantA.conversions / variantA.views) * 100 
      : 0;
    
    const conversionRateB = variantB.views > 0 
      ? (variantB.conversions / variantB.views) * 100 
      : 0;
    
    // Calculate improvement
    let improvement = 0;
    let improvementText = '';
    
    if (conversionRateA > 0 && conversionRateB > 0) {
      if (conversionRateB > conversionRateA) {
        improvement = ((conversionRateB - conversionRateA) / conversionRateA) * 100;
        improvementText = `+${improvement.toFixed(1)}%`;
      } else if (conversionRateA > conversionRateB) {
        improvement = ((conversionRateA - conversionRateB) / conversionRateB) * 100;
        improvementText = `-${improvement.toFixed(1)}%`;
      }
    }

    return (
      <Tabs defaultValue="results" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="results">{t('campaigns.abTesting.testResults')}</TabsTrigger>
          <TabsTrigger value="details">{t('common.details')}</TabsTrigger>
        </TabsList>
        
        <TabsContent value="results" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
            <div className="space-y-4">
              <div className="font-medium">{t('campaigns.abTesting.variantA')}: {variantA.name}</div>
              {variantA.description && (
                <p className="text-sm text-gray-500">{variantA.description}</p>
              )}
              <div className="grid grid-cols-3 gap-2 text-center">
                <div className="bg-gray-50 p-3 rounded-md">
                  <div className="text-sm text-gray-500">{t('campaigns.metrics.views')}</div>
                  <div className="text-xl font-semibold">{variantA.views}</div>
                </div>
                <div className="bg-gray-50 p-3 rounded-md">
                  <div className="text-sm text-gray-500">{t('campaigns.abTesting.conversions')}</div>
                  <div className="text-xl font-semibold">{variantA.conversions}</div>
                </div>
                <div className="bg-gray-50 p-3 rounded-md">
                  <div className="text-sm text-gray-500">{t('campaigns.abTesting.conversionRate')}</div>
                  <div className="text-xl font-semibold">{conversionRateA.toFixed(1)}%</div>
                </div>
              </div>
            </div>
            
            <div className="space-y-4">
              <div className="font-medium">{t('campaigns.abTesting.variantB')}: {variantB.name}</div>
              {variantB.description && (
                <p className="text-sm text-gray-500">{variantB.description}</p>
              )}
              <div className="grid grid-cols-3 gap-2 text-center">
                <div className="bg-gray-50 p-3 rounded-md">
                  <div className="text-sm text-gray-500">{t('campaigns.metrics.views')}</div>
                  <div className="text-xl font-semibold">{variantB.views}</div>
                </div>
                <div className="bg-gray-50 p-3 rounded-md">
                  <div className="text-sm text-gray-500">{t('campaigns.abTesting.conversions')}</div>
                  <div className="text-xl font-semibold">{variantB.conversions}</div>
                </div>
                <div className="bg-gray-50 p-3 rounded-md">
                  <div className="text-sm text-gray-500">{t('campaigns.abTesting.conversionRate')}</div>
                  <div className="text-xl font-semibold">{conversionRateB.toFixed(1)}%</div>
                </div>
              </div>
            </div>
          </div>
          
          {test.status === 'completed' && (
            <Card className="mt-6">
              <CardContent className="pt-6">
                <div className="text-center mb-4">
                  <div className="text-lg font-medium mb-2">{t('campaigns.abTesting.testResults')}</div>
                  
                  {test.winner ? (
                    <Badge variant="success" className="text-base px-3 py-1">
                      <CheckCircle2Icon className="h-4 w-4 mr-1" />
                      {test.winner === 'A' 
                        ? t('campaigns.abTesting.variantA') 
                        : t('campaigns.abTesting.variantB')} {t('campaigns.abTesting.winner')}
                    </Badge>
                  ) : (
                    <Badge variant="outline" className="text-base px-3 py-1">
                      <AlertTriangleIcon className="h-4 w-4 mr-1" />
                      {t('campaigns.abTesting.noWinner')}
                    </Badge>
                  )}
                </div>
                
                {test.winner && (
                  <div className="flex justify-center items-center space-x-2 mt-4">
                    <div className="text-sm text-gray-500">{t('campaigns.abTesting.improvement')}:</div>
                    <div className="text-green-600 font-medium">{improvementText}</div>
                    <div className="text-sm text-gray-500">•</div>
                    <div className="text-sm text-gray-500">{t('campaigns.abTesting.confidenceLevel')}:</div>
                    <div className="font-medium">{test.confidence_level}%</div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </TabsContent>
        
        <TabsContent value="details" className="space-y-4">
          <div className="space-y-2">
            <div className="text-sm text-gray-500">{t('campaigns.abTesting.testName')}</div>
            <div className="font-medium">{test.name}</div>
          </div>
          
          <div className="space-y-2">
            <div className="text-sm text-gray-500">{t('campaigns.abTesting.selectMetric')}</div>
            <div className="font-medium">{getMetricLabel(test.metric_type)}</div>
          </div>
          
          <div className="space-y-2">
            <div className="text-sm text-gray-500">{t('campaigns.startDate')}</div>
            <div className="font-medium">{format(new Date(test.start_date), 'MMM d, yyyy')}</div>
          </div>
          
          {test.end_date && (
            <div className="space-y-2">
              <div className="text-sm text-gray-500">{t('campaigns.endDate')}</div>
              <div className="font-medium">{format(new Date(test.end_date), 'MMM d, yyyy')}</div>
            </div>
          )}
          
          <div className="space-y-2">
            <div className="text-sm text-gray-500">{t('campaigns.abTesting.testStatus')}</div>
            <div>
              {test.status === 'running' && (
                <Badge variant="success">{t('campaigns.abTesting.running')}</Badge>
              )}
              {test.status === 'paused' && (
                <Badge variant="warning">{t('campaigns.abTesting.paused')}</Badge>
              )}
              {test.status === 'completed' && (
                <Badge variant="secondary">{t('campaigns.abTesting.completed')}</Badge>
              )}
            </div>
          </div>
        </TabsContent>
      </Tabs>
    );
  };
  
  const metricOptions = [
    { value: 'conversion_rate', label: t('campaigns.abTesting.conversionRate') },
    { value: 'click_rate', label: t('incentives.clickRate') },
    { value: 'engagement_time', label: t('analytics.timeSpent') }
  ];

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">{t('campaigns.abTesting.title')}</h2>
        <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <PlusCircleIcon className="mr-2 h-4 w-4" />
              {t('campaigns.abTesting.createTest')}
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[550px]">
            <DialogHeader>
              <DialogTitle>{t('campaigns.abTesting.createTest')}</DialogTitle>
              <DialogDescription>
                {t('campaigns.abTesting.description')}
              </DialogDescription>
            </DialogHeader>
            
            <form onSubmit={handleSubmit(onCreateTest)} className="space-y-4 pt-4">
              <div className="space-y-2">
                <Label htmlFor="name">{t('campaigns.abTesting.testName')} <span className="text-red-500">*</span></Label>
                <Controller
                  name="name"
                  control={control}
                  rules={{ required: 'Test name is required' }}
                  render={({ field }) => (
                    <Input id="name" placeholder="Test Name" {...field} />
                  )}
                />
                {errors.name && <p className="text-sm text-red-500">{errors.name.message}</p>}
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="metric_type">{t('campaigns.abTesting.selectMetric')} <span className="text-red-500">*</span></Label>
                <Controller
                  name="metric_type"
                  control={control}
                  rules={{ required: 'Metric is required' }}
                  render={({ field }) => (
                    <Select 
                      onValueChange={field.onChange} 
                      defaultValue={field.value}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select Metric" />
                      </SelectTrigger>
                      <SelectContent>
                        {metricOptions.map(option => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
                {errors.metric_type && <p className="text-sm text-red-500">{errors.metric_type.message}</p>}
              </div>
              
              <div className="space-y-2">
                <h3 className="font-medium">{t('campaigns.abTesting.variantA')}</h3>
                <div className="space-y-2">
                  <Label htmlFor="variant_a_name">{t('campaigns.abTesting.testName')} <span className="text-red-500">*</span></Label>
                  <Controller
                    name="variant_a_name"
                    control={control}
                    rules={{ required: 'Variant name is required' }}
                    render={({ field }) => (
                      <Input id="variant_a_name" placeholder="Original" {...field} />
                    )}
                  />
                  {errors.variant_a_name && <p className="text-sm text-red-500">{errors.variant_a_name.message}</p>}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="variant_a_description">{t('campaigns.campaignDescription')}</Label>
                  <Controller
                    name="variant_a_description"
                    control={control}
                    render={({ field }) => (
                      <Input id="variant_a_description" placeholder="Description (optional)" {...field} />
                    )}
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <h3 className="font-medium">{t('campaigns.abTesting.variantB')}</h3>
                <div className="space-y-2">
                  <Label htmlFor="variant_b_name">{t('campaigns.abTesting.testName')} <span className="text-red-500">*</span></Label>
                  <Controller
                    name="variant_b_name"
                    control={control}
                    rules={{ required: 'Variant name is required' }}
                    render={({ field }) => (
                      <Input id="variant_b_name" placeholder="Variation" {...field} />
                    )}
                  />
                  {errors.variant_b_name && <p className="text-sm text-red-500">{errors.variant_b_name.message}</p>}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="variant_b_description">{t('campaigns.campaignDescription')}</Label>
                  <Controller
                    name="variant_b_description"
                    control={control}
                    render={({ field }) => (
                      <Input id="variant_b_description" placeholder="Description (optional)" {...field} />
                    )}
                  />
                </div>
              </div>
              
              <div className="flex items-center space-x-2">
                <Controller
                  name="active"
                  control={control}
                  render={({ field }) => (
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                      id="active"
                    />
                  )}
                />
                <Label htmlFor="active">{t('campaigns.abTesting.startTest')}</Label>
              </div>
              
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setCreateDialogOpen(false)} disabled={isSubmitting}>
                  {t('common.cancel')}
                </Button>
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? t('common.loading') : t('common.create')}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>
      
      <p className="text-gray-500 mb-8">{t('campaigns.abTesting.description')}</p>
      
      {loading ? (
        <div className="flex justify-center p-8">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500"></div>
        </div>
      ) : tests.length === 0 ? (
        <div className="text-center p-12 border rounded-lg bg-gray-50">
          <h3 className="text-lg font-medium mb-2">{t('campaigns.abTesting.noTests')}</h3>
          <p className="text-gray-500 mb-6">{t('campaigns.abTesting.createTestPrompt')}</p>
          <Button onClick={() => setCreateDialogOpen(true)}>
            {t('campaigns.abTesting.createTest')}
          </Button>
        </div>
      ) : (
        <div className="space-y-6">
          {tests.map((test) => (
            <Card key={test.id} className="overflow-hidden">
              <CardHeader className="bg-gray-50 pb-4">
                <div className="flex justify-between items-center">
                  <div>
                    <CardTitle className="flex items-center">
                      {test.name}
                      {test.status === 'running' && (
                        <Badge variant="success" className="ml-2">
                          {t('campaigns.abTesting.running')}
                        </Badge>
                      )}
                      {test.status === 'paused' && (
                        <Badge variant="warning" className="ml-2">
                          {t('campaigns.abTesting.paused')}
                        </Badge>
                      )}
                      {test.status === 'completed' && (
                        <Badge variant="secondary" className="ml-2">
                          {t('campaigns.abTesting.completed')}
                        </Badge>
                      )}
                    </CardTitle>
                    <CardDescription>
                      {getMetricLabel(test.metric_type)} • {format(new Date(test.start_date), 'MMM d, yyyy')}
                    </CardDescription>
                  </div>
                  
                  <div className="flex space-x-2">
                    {test.status !== 'completed' && (
                      <>
                        {test.status === 'running' ? (
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => handleStatusChange(test.id, 'paused')}
                          >
                            <PauseIcon className="h-4 w-4 mr-1" />
                            {t('campaigns.abTesting.pauseTest')}
                          </Button>
                        ) : (
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => handleStatusChange(test.id, 'running')}
                          >
                            <PlayIcon className="h-4 w-4 mr-1" />
                            {t('campaigns.abTesting.resumeTest')}
                          </Button>
                        )}
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => handleStatusChange(test.id, 'completed')}
                        >
                          {t('campaigns.abTesting.endTest')}
                        </Button>
                      </>
                    )}
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="text-destructive" 
                      onClick={() => setConfirmDeleteId(test.id)}
                    >
                      <Trash2Icon className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pt-6">
                {renderTestResults(test)}
              </CardContent>
              <CardFooter className="bg-gray-50 border-t">
                <div className="text-xs text-gray-500">
                  {t('common.created')}: {format(new Date(test.created_at), 'MMM d, yyyy')} • 
                  {t('common.updated')}: {format(new Date(test.updated_at), 'MMM d, yyyy')}
                </div>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}
      
      {/* Delete confirmation dialog */}
      <Dialog open={!!confirmDeleteId} onOpenChange={() => setConfirmDeleteId(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('campaigns.abTesting.deleteTest')}</DialogTitle>
            <DialogDescription>
              {t('campaigns.deleteWarning')}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmDeleteId(null)}>
              {t('common.cancel')}
            </Button>
            <Button 
              variant="destructive" 
              onClick={() => confirmDeleteId && handleDeleteTest(confirmDeleteId)}
            >
              {t('common.delete')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}