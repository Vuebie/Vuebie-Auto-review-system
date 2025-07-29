import React from 'react';
import { useTranslation } from 'react-i18next';
import { format } from 'date-fns';
import { useNavigate } from 'react-router-dom';
import { Campaign, CampaignMetrics } from '../../pages/dashboard/CampaignsPage';
import { Button } from '../ui/button';
import { Pencil1Icon } from '@radix-ui/react-icons';
import { Badge } from '../ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import {
  CircleCheck as CircleCheckIcon,
  Clock as CircleClockIcon,
  CircleX as CircleXIcon,
  TrendingUp as TrendingUpIcon,
  Star as StarIcon,
  Users as UsersIcon,
  Calendar as CalendarIcon,
  Building as BuildingIcon,
  Eye as EyeIcon,
  MessageSquareText as MessageSquareTextIcon,
} from 'lucide-react';

interface CampaignDetailProps {
  campaign: Campaign;
  metrics?: CampaignMetrics;
}

export default function CampaignDetail({ campaign, metrics }: CampaignDetailProps) {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const getCampaignStatus = (campaign: Campaign) => {
    const now = new Date();
    const startDate = new Date(campaign.start_date);
    const endDate = campaign.end_date ? new Date(campaign.end_date) : null;
    
    if (!campaign.is_active) {
      return 'inactive';
    }
    
    if (startDate > now) {
      return 'upcoming';
    }
    
    if (endDate && endDate < now) {
      return 'completed';
    }
    
    return 'active';
  };
  
  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'active':
        return 'success';
      case 'upcoming':
        return 'info';
      case 'completed':
        return 'secondary';
      case 'inactive':
        return 'outline';
      default:
        return 'default';
    }
  };
  
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active':
        return <CircleCheckIcon className="h-5 w-5 text-green-500" />;
      case 'upcoming':
        return <CircleClockIcon className="h-5 w-5 text-blue-500" />;
      case 'completed':
        return <StarIcon className="h-5 w-5 text-purple-500" />;
      case 'inactive':
        return <CircleXIcon className="h-5 w-5 text-gray-500" />;
      default:
        return null;
    }
  };

  const handleEditCampaign = () => {
    navigate(`/campaigns/edit/${campaign.id}`);
  };
  
  const status = getCampaignStatus(campaign);
  const statusVariant = getStatusBadgeVariant(status);
  const StatusIcon = getStatusIcon(status);
  
  return (
    <div className="p-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6">
        <div className="flex items-center mb-4 sm:mb-0">
          <h2 className="text-2xl font-bold mr-3">{campaign.name}</h2>
          <Badge variant={statusVariant as "success" | "info" | "secondary" | "outline" | "default"} className="flex items-center gap-1 px-2 py-1">
            {StatusIcon}
            <span>{t(`campaigns.${status}`)}</span>
          </Badge>
        </div>
        
        <Button onClick={handleEditCampaign} className="flex items-center">
          <Pencil1Icon className="mr-2 h-4 w-4" />
          {t('common.edit')}
        </Button>
      </div>
      
      {campaign.description && (
        <p className="text-gray-600 mb-6">{campaign.description}</p>
      )}
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center">
              <CalendarIcon className="h-5 w-5 text-blue-500 mr-3" />
              <div>
                <p className="text-sm font-medium text-gray-500">{t('campaigns.startDate')}</p>
                <p className="font-semibold">{format(new Date(campaign.start_date), 'MMM d, yyyy')}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center">
              <CalendarIcon className="h-5 w-5 text-purple-500 mr-3" />
              <div>
                <p className="text-sm font-medium text-gray-500">{t('campaigns.endDate')}</p>
                <p className="font-semibold">
                  {campaign.end_date 
                    ? format(new Date(campaign.end_date), 'MMM d, yyyy')
                    : t('campaigns.noEndDate')}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center">
              <BuildingIcon className="h-5 w-5 text-amber-500 mr-3" />
              <div>
                <p className="text-sm font-medium text-gray-500">{t('campaigns.outlets')}</p>
                <p className="font-semibold">
                  {/* Placeholder - would come from the actual outlets data */}
                  {campaign.settings?.outlet_count || '—'}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center">
              <UsersIcon className="h-5 w-5 text-emerald-500 mr-3" />
              <div>
                <p className="text-sm font-medium text-gray-500">{t('campaigns.settings.targetAudience')}</p>
                <p className="font-semibold">{campaign.settings?.target_audience || '—'}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
      
      <div className="mb-8">
        <h3 className="text-lg font-semibold mb-4">{t('campaigns.metrics.title')}</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center">
                <EyeIcon className="h-10 w-10 text-blue-500 p-2 bg-blue-50 rounded-full mr-4" />
                <div>
                  <p className="text-sm font-medium text-gray-500">{t('campaigns.metrics.views')}</p>
                  <p className="text-2xl font-bold">{metrics?.view_count.toLocaleString() || '0'}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center">
                <MessageSquareTextIcon className="h-10 w-10 text-green-500 p-2 bg-green-50 rounded-full mr-4" />
                <div>
                  <p className="text-sm font-medium text-gray-500">{t('campaigns.metrics.reviews')}</p>
                  <p className="text-2xl font-bold">{metrics?.review_count.toLocaleString() || '0'}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center">
                <TrendingUpIcon className="h-10 w-10 text-purple-500 p-2 bg-purple-50 rounded-full mr-4" />
                <div>
                  <p className="text-sm font-medium text-gray-500">{t('campaigns.metrics.conversionRate')}</p>
                  <p className="text-2xl font-bold">{metrics?.conversion_rate.toFixed(1) || '0'}%</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
      
      {/* Campaign Settings */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>{t('campaigns.settings.title')}</CardTitle>
        </CardHeader>
        <CardContent>
          <dl className="divide-y">
            <div className="grid grid-cols-1 sm:grid-cols-2 py-3">
              <dt className="font-medium text-gray-500">{t('campaigns.settings.goals')}</dt>
              <dd>{campaign.settings?.goal_reviews || '—'} reviews</dd>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 py-3">
              <dt className="font-medium text-gray-500">{t('campaigns.settings.notifications')}</dt>
              <dd>{campaign.settings?.notification_enabled ? 'Enabled' : 'Disabled'}</dd>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 py-3">
              <dt className="font-medium text-gray-500">{t('campaigns.settings.tracking')}</dt>
              <dd>{campaign.settings?.tracking_params?.join(', ') || '—'}</dd>
            </div>
          </dl>
        </CardContent>
      </Card>
      
      {/* Campaign Demographics - Placeholder for future data */}
      {metrics?.demographic_data && Object.keys(metrics.demographic_data).length > 0 && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>{t('campaigns.metrics.demographics')}</CardTitle>
          </CardHeader>
          <CardContent>
            {/* Demographics data visualization would go here */}
            <p className="text-muted-foreground">{t('analytics.noData')}</p>
          </CardContent>
        </Card>
      )}
      
      {/* Campaign Engagement - Placeholder for future data */}
      {metrics?.engagement_data && Object.keys(metrics.engagement_data).length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>{t('campaigns.metrics.engagement')}</CardTitle>
          </CardHeader>
          <CardContent>
            {/* Engagement data visualization would go here */}
            <p className="text-muted-foreground">{t('analytics.noData')}</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}