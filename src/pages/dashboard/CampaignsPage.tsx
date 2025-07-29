import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../hooks/use-toast';
import PageHeader from '../../components/layout/PageHeader';
import CampaignTabs from '../../components/campaigns/CampaignTabs';
import CampaignList from '../../components/campaigns/CampaignList';
import CampaignDetail from '../../components/campaigns/CampaignDetail';
import CampaignReports from '../../components/campaigns/CampaignReports';
import CampaignABTests from '../../components/campaigns/CampaignABTests';
import CampaignComparison from '../../components/campaigns/CampaignComparison';
import { Button } from '../../components/ui/button';
import { PlusIcon } from '@radix-ui/react-icons';
import { supabase } from '../../lib/supabase';

export interface Campaign {
  id: string;
  name: string;
  description: string | null;
  start_date: string;
  end_date: string | null;
  is_active: boolean;
  settings: {
    goal_reviews?: number;
    notification_enabled?: boolean;
    tracking_params?: string[];
    outlet_count?: number;
    target_audience?: string;
    [key: string]: unknown;
  };
  created_at: string;
  updated_at: string;
  merchant_id: string;
}

export interface CampaignMetrics {
  id: string | null;
  campaign_id: string;
  review_count: number;
  view_count: number;
  conversion_rate: number;
  demographic_data: Record<string, unknown>;
  engagement_data: Record<string, unknown>;
  updated_at: string;
}

export default function CampaignsPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { showToast } = useToast();
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [selectedCampaign, setSelectedCampaign] = useState<Campaign | null>(null);
  const [campaignMetrics, setCampaignMetrics] = useState<Record<string, CampaignMetrics>>({});
  const [activeTab, setActiveTab] = useState<string>('list');
  const [selectedCampaignsForComparison, setSelectedCampaignsForComparison] = useState<string[]>([]);

  useEffect(() => {
    if (!user) return;
    
    const loadCampaigns = async () => {
      setLoading(true);
      setError(null);

      try {
        // Fetch all campaigns for this merchant
        const { data, error } = await supabase
          .from('app_aa9a812f43_campaigns')
          .select('*')
          .eq('merchant_id', user.id)
          .order('created_at', { ascending: false });
          
        if (error) throw error;
        
        setCampaigns(data || []);
        
        // If there are campaigns, fetch their metrics
        if (data && data.length > 0) {
          const metricsPromises = data.map(async (campaign) => {
            const session = await supabase.auth.getSession();
            return fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/app_aa9a812f43_campaign_metrics/${campaign.id}`, {
              method: 'GET',
              headers: {
                Authorization: `Bearer ${session.data.session?.access_token}`
              }
            }).then(res => res.json());
          });
          
          const metricsResults = await Promise.all(metricsPromises);
          
          // Create a mapping of campaign_id to metrics
          const metricsMap: Record<string, CampaignMetrics> = {};
          metricsResults.forEach((metrics, index) => {
            if (!metrics.error) {
              metricsMap[data[index].id] = metrics;
            }
          });
          
          setCampaignMetrics(metricsMap);
        }
      } catch (err) {
        // Log error loading campaigns
        setError(typeof err === 'string' ? err : 'Failed to load campaigns');
      } finally {
        setLoading(false);
      }
    };

    loadCampaigns();
  }, [user]);

  const handleCreateCampaign = () => {
    navigate('/campaigns/new');
  };

  const handleSelectCampaign = (campaign: Campaign) => {
    setSelectedCampaign(campaign);
    setActiveTab('details');
  };

  const handleComparisonSelect = (campaignId: string) => {
    setSelectedCampaignsForComparison(prev => {
      if (prev.includes(campaignId)) {
        return prev.filter(id => id !== campaignId);
      } else {
        return [...prev, campaignId];
      }
    });
  };

  const handleTabChange = (tab: string) => {
    setActiveTab(tab);
    if (tab === 'list') {
      setSelectedCampaign(null);
    }
  };

  const renderTabContent = () => {
    switch (activeTab) {
      case 'list':
        return (
          <CampaignList 
            campaigns={campaigns}
            campaignMetrics={campaignMetrics}
            onSelectCampaign={handleSelectCampaign}
            selectedCampaignsForComparison={selectedCampaignsForComparison}
            onComparisonSelect={handleComparisonSelect}
          />
        );
      case 'details':
        return selectedCampaign ? (
          <CampaignDetail 
            campaign={selectedCampaign}
            metrics={campaignMetrics[selectedCampaign.id]}
          />
        ) : (
          <div className="p-6 text-center">
            <p>{t('campaigns.selectCampaign')}</p>
          </div>
        );
      case 'reports':
        return selectedCampaign ? (
          <CampaignReports campaignId={selectedCampaign.id} campaignName={selectedCampaign.name} />
        ) : (
          <div className="p-6 text-center">
            <p>{t('campaigns.selectCampaign')}</p>
          </div>
        );
      case 'abtests':
        return selectedCampaign ? (
          <CampaignABTests campaignId={selectedCampaign.id} campaignName={selectedCampaign.name} />
        ) : (
          <div className="p-6 text-center">
            <p>{t('campaigns.selectCampaign')}</p>
          </div>
        );
      case 'comparison':
        return (
          <CampaignComparison 
            campaigns={campaigns.filter(c => selectedCampaignsForComparison.includes(c.id))}
            metrics={campaignMetrics}
          />
        );
      default:
        return null;
    }
  };

  const tabs = [
    { id: 'list', label: t('campaigns.title') },
    { id: 'details', label: t('campaigns.campaignDetails'), disabled: !selectedCampaign },
    { id: 'reports', label: t('campaigns.reports.title'), disabled: !selectedCampaign },
    { id: 'abtests', label: t('campaigns.abTesting.title'), disabled: !selectedCampaign },
    { id: 'comparison', label: t('campaigns.comparison.title'), disabled: selectedCampaignsForComparison.length < 2 }
  ];

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
        <PageHeader 
          title={t('campaigns.title')}
          description={t('campaigns.description')}
        />
        <div className="mt-4 md:mt-0">
          <Button onClick={handleCreateCampaign} className="ml-2">
            <PlusIcon className="w-4 h-4 mr-2" />
            {t('campaigns.createCampaign')}
          </Button>
        </div>
      </div>

      {loading ? (
        <div className="bg-white shadow rounded-lg p-8 text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500 mb-4"></div>
          <p className="text-gray-500">{t('common.loading')}</p>
        </div>
      ) : error ? (
        <div className="bg-white shadow rounded-lg p-8 text-center">
          <svg className="mx-auto h-12 w-12 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <p className="mt-4 text-lg text-gray-500">{error}</p>
          <Button 
            onClick={() => window.location.reload()}
            className="mt-4"
          >
            {t('common.retry')}
          </Button>
        </div>
      ) : (
        <div className="bg-white shadow rounded-lg overflow-hidden">
          <CampaignTabs tabs={tabs} activeTab={activeTab} onChange={handleTabChange} />
          <div className="p-0">
            {renderTabContent()}
          </div>
        </div>
      )}
    </div>
  );
}