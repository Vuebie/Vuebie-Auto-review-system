import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useForm, Controller } from 'react-hook-form';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../hooks/use-toast';
import { supabase } from '../../lib/supabase';
import PageHeader from '../../components/layout/PageHeader';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Textarea } from '../../components/ui/textarea';
import { Label } from '../../components/ui/label';
import { Switch } from '../../components/ui/switch';
import { DatePicker } from '../../components/ui/date-picker';
import { Card, CardContent } from '../../components/ui/card';
import { Checkbox } from '../../components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';
import { ArrowLeftIcon } from '@radix-ui/react-icons';

interface FormValues {
  name: string;
  description: string;
  start_date: Date;
  end_date: Date | null;
  is_active: boolean;
  settings: {
    target_audience?: string;
    notification_enabled?: boolean;
    goal_reviews?: number;
    tracking_params?: string[];
  };
  selected_outlets: string[];
}

interface Outlet {
  id: string;
  name: string;
}

export default function CreateEditCampaignPage() {
  const { t } = useTranslation();
  const { campaignId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { showToast } = useToast();
  const [loading, setLoading] = useState<boolean>(false);
  const [outlets, setOutlets] = useState<Outlet[]>([]);
  const [selectedOutletIds, setSelectedOutletIds] = useState<string[]>([]);
  const [initialLoading, setInitialLoading] = useState<boolean>(campaignId ? true : false);

  const {
    control,
    handleSubmit,
    reset,
    formState: { errors },
    setValue,
    watch
  } = useForm<FormValues>({
    defaultValues: {
      name: '',
      description: '',
      start_date: new Date(),
      end_date: null,
      is_active: true,
      settings: {
        target_audience: '',
        notification_enabled: true,
        goal_reviews: 100,
        tracking_params: [],
      },
      selected_outlets: []
    }
  });

  // Fetch outlets for selection
  useEffect(() => {
    if (!user) return;
    
    const fetchOutlets = async () => {
      try {
        const { data, error } = await supabase
          .from('outlets')
          .select('id, name')
          .eq('merchant_id', user.id);
          
        if (error) throw error;
        
        setOutlets(data || []);
      } catch (err) {
        // Log error fetching outlets
        showToast('error', t('common.error'));
      }
    };
    
    fetchOutlets();
  }, [user, t, showToast]);

  // Fetch campaign data if editing
  useEffect(() => {
    if (!campaignId || !user) return;
    
    const fetchCampaign = async () => {
      setInitialLoading(true);
      try {
        // Fetch campaign details
        const { data: campaign, error } = await supabase
          .from('app_aa9a812f43_campaigns')
          .select('*')
          .eq('id', campaignId)
          .eq('merchant_id', user.id)
          .single();
          
        if (error) throw error;
        if (!campaign) throw new Error('Campaign not found');
        
        // Fetch campaign outlets
        const { data: campaignOutlets, error: outletsError } = await supabase
          .from('app_aa9a812f43_campaign_outlets')
          .select('outlet_id')
          .eq('campaign_id', campaignId);
          
        if (outletsError) throw outletsError;
        
        // Set form values
        reset({
          name: campaign.name,
          description: campaign.description || '',
          start_date: new Date(campaign.start_date),
          end_date: campaign.end_date ? new Date(campaign.end_date) : null,
          is_active: campaign.is_active,
          settings: campaign.settings || {
            target_audience: '',
            notification_enabled: true,
            goal_reviews: 100,
            tracking_params: [],
          },
          selected_outlets: campaignOutlets?.map(o => o.outlet_id) || []
        });
        
        // Set selected outlets
        setSelectedOutletIds(campaignOutlets?.map(o => o.outlet_id) || []);
      } catch (err) {
        // Log error fetching campaign
        showToast('error', 'Failed to load campaign');
        navigate('/campaigns');
      } finally {
        setInitialLoading(false);
      }
    };
    
    fetchCampaign();
  }, [campaignId, user, navigate, reset, showToast, t]);

  const onSubmit = async (data: FormValues) => {
    if (!user) return;
    
    setLoading(true);
    try {
      const campaignData = {
        name: data.name,
        description: data.description || null,
        start_date: data.start_date.toISOString(),
        end_date: data.end_date ? data.end_date.toISOString() : null,
        is_active: data.is_active,
        settings: data.settings,
        merchant_id: user.id
      };

      let campaign;
      
      if (campaignId) {
        // Update existing campaign
        const { data: updatedCampaign, error } = await supabase
          .from('app_aa9a812f43_campaigns')
          .update(campaignData)
          .eq('id', campaignId)
          .eq('merchant_id', user.id)
          .select()
          .single();
          
        if (error) throw error;
        campaign = updatedCampaign;
        
        // Delete existing campaign outlets
        await supabase
          .from('app_aa9a812f43_campaign_outlets')
          .delete()
          .eq('campaign_id', campaignId);
      } else {
        // Create new campaign
        const { data: newCampaign, error } = await supabase
          .from('app_aa9a812f43_campaigns')
          .insert(campaignData)
          .select()
          .single();
          
        if (error) throw error;
        campaign = newCampaign;
      }
      
      // Insert campaign outlets
      if (data.selected_outlets.length > 0) {
        const outletInserts = data.selected_outlets.map(outletId => ({
          campaign_id: campaign.id,
          outlet_id: outletId
        }));
        
        const { error: outletsError } = await supabase
          .from('app_aa9a812f43_campaign_outlets')
          .insert(outletInserts);
          
        if (outletsError) throw outletsError;
      }
      
      // Initialize campaign metrics if new campaign
      if (!campaignId) {
        await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/app_aa9a812f43_campaign_metrics`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`
          },
          body: JSON.stringify({
            campaign_id: campaign.id,
            review_count: 0,
            view_count: 0
          })
        });
      }
      
      showToast('success', campaignId ? t('campaigns.campaignUpdated') : t('campaigns.campaignCreated'));
      navigate('/campaigns');
    } catch (err) {
      // Log error saving campaign
      showToast('error', 'Failed to save campaign');
    } finally {
      setLoading(false);
    }
  };

  const handleOutletSelection = (outletId: string) => {
    setSelectedOutletIds(prevSelected => {
      if (prevSelected.includes(outletId)) {
        return prevSelected.filter(id => id !== outletId);
      } else {
        return [...prevSelected, outletId];
      }
    });
    
    const formOutlets = watch('selected_outlets');
    if (formOutlets.includes(outletId)) {
      setValue('selected_outlets', formOutlets.filter(id => id !== outletId));
    } else {
      setValue('selected_outlets', [...formOutlets, outletId]);
    }
  };

  const handleCancel = () => {
    navigate('/campaigns');
  };

  if (initialLoading) {
    return (
      <div className="p-6 max-w-7xl mx-auto">
        <div className="flex items-center mb-6">
          <Button variant="ghost" onClick={() => navigate('/campaigns')} className="mr-4">
            <ArrowLeftIcon className="w-4 h-4 mr-2" />
            {t('common.back')}
          </Button>
          <h1 className="text-2xl font-semibold">
            {t('campaigns.loadingCampaign')}
          </h1>
        </div>
        <div className="bg-white shadow rounded-lg p-8 text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500 mb-4"></div>
          <p className="text-gray-500">{t('common.loading')}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex items-center mb-6">
        <Button variant="ghost" onClick={() => navigate('/campaigns')} className="mr-4">
          <ArrowLeftIcon className="w-4 h-4 mr-2" />
          {t('common.back')}
        </Button>
        <PageHeader 
          title={campaignId ? t('campaigns.editCampaign') : t('campaigns.createCampaign')}
          description={campaignId ? '' : t('campaigns.description')}
        />
      </div>
      
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
        <Card>
          <CardContent className="p-6">
            <div className="space-y-6">
              <div className="grid grid-cols-1 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="name">{t('campaigns.campaignName')} <span className="text-red-500">*</span></Label>
                  <Controller
                    name="name"
                    control={control}
                    rules={{ required: 'Campaign name is required' }}
                    render={({ field }) => (
                      <Input 
                        id="name" 
                        placeholder={t('campaigns.campaignName')} 
                        error={errors.name?.message}
                        {...field} 
                      />
                    )}
                  />
                  {errors.name && <p className="text-sm text-red-500">{errors.name.message}</p>}
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="description">{t('campaigns.campaignDescription')}</Label>
                  <Controller
                    name="description"
                    control={control}
                    render={({ field }) => (
                      <Textarea 
                        id="description" 
                        placeholder={t('campaigns.campaignDescription')} 
                        rows={3}
                        {...field} 
                      />
                    )}
                  />
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="start_date">{t('campaigns.startDate')} <span className="text-red-500">*</span></Label>
                    <Controller
                      name="start_date"
                      control={control}
                      rules={{ required: 'Start date is required' }}
                      render={({ field }) => (
                        <DatePicker
                          date={field.value}
                          setDate={(date) => field.onChange(date)}
                        />
                      )}
                    />
                    {errors.start_date && <p className="text-sm text-red-500">{errors.start_date.message}</p>}
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="end_date">{t('campaigns.endDate')}</Label>
                    <Controller
                      name="end_date"
                      control={control}
                      render={({ field }) => (
                        <DatePicker
                          date={field.value}
                          setDate={(date) => field.onChange(date)}
                        />
                      )}
                    />
                  </div>
                </div>
                
                <div className="flex items-center space-x-2">
                  <Controller
                    name="is_active"
                    control={control}
                    render={({ field }) => (
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                        id="is_active"
                      />
                    )}
                  />
                  <Label htmlFor="is_active">{t('campaigns.status')}: {watch('is_active') ? t('campaigns.active') : t('campaigns.inactive')}</Label>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <h3 className="text-lg font-medium mb-4">{t('campaigns.settings.title')}</h3>
            <div className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="target_audience">{t('campaigns.settings.targetAudience')}</Label>
                <Controller
                  name="settings.target_audience"
                  control={control}
                  render={({ field }) => (
                    <Input 
                      id="target_audience" 
                      placeholder={t('campaigns.settings.targetAudience')} 
                      {...field} 
                    />
                  )}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="goal_reviews">{t('campaigns.settings.goals')}</Label>
                <Controller
                  name="settings.goal_reviews"
                  control={control}
                  render={({ field }) => (
                    <Input 
                      id="goal_reviews" 
                      type="number"
                      min={1}
                      placeholder="100"
                      {...field} 
                    />
                  )}
                />
              </div>
              
              <div className="flex items-center space-x-2">
                <Controller
                  name="settings.notification_enabled"
                  control={control}
                  render={({ field }) => (
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                      id="notification_enabled"
                    />
                  )}
                />
                <Label htmlFor="notification_enabled">{t('campaigns.settings.notifications')}</Label>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <h3 className="text-lg font-medium mb-4">{t('campaigns.assignOutlets')}</h3>
            
            {outlets.length > 0 ? (
              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {outlets.map(outlet => (
                    <div 
                      key={outlet.id} 
                      className="flex items-center space-x-2 p-3 border rounded-md hover:bg-gray-50 cursor-pointer"
                      onClick={() => handleOutletSelection(outlet.id)}
                    >
                      <Checkbox 
                        checked={selectedOutletIds.includes(outlet.id)} 
                        onCheckedChange={() => handleOutletSelection(outlet.id)}
                        id={`outlet-${outlet.id}`}
                      />
                      <Label 
                        htmlFor={`outlet-${outlet.id}`}
                        className="flex-1 cursor-pointer"
                      >
                        {outlet.name}
                      </Label>
                    </div>
                  ))}
                </div>
                
                <Controller
                  name="selected_outlets"
                  control={control}
                  rules={{ required: 'At least one outlet must be selected' }}
                  render={() => <></>}
                />
                {errors.selected_outlets && (
                  <p className="text-sm text-red-500">{errors.selected_outlets.message}</p>
                )}
              </div>
            ) : (
              <p className="text-gray-500">{t('campaigns.noOutlets')}</p>
            )}
          </CardContent>
        </Card>
        
        <div className="flex justify-end space-x-4">
          <Button 
            type="button" 
            variant="outline" 
            onClick={handleCancel}
            disabled={loading}
          >
            {t('common.cancel')}
          </Button>
          <Button 
            type="submit" 
            disabled={loading}
          >
            {loading ? t('common.loading') : campaignId ? t('common.save') : t('common.create')}
          </Button>
        </div>
      </form>
    </div>
  );
}