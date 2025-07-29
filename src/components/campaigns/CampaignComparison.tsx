import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { format } from 'date-fns';
import { Campaign, CampaignMetrics } from '../../pages/dashboard/CampaignsPage';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../ui/table';

interface CampaignComparisonProps {
  campaigns: Campaign[];
  metrics: Record<string, CampaignMetrics>;
}

export default function CampaignComparison({ campaigns, metrics }: CampaignComparisonProps) {
  const { t } = useTranslation();
  const [selectedMetric, setSelectedMetric] = useState<string>('conversion_rate');

  // Prepare chart data
  const chartData = campaigns.map(campaign => {
    const campaignMetrics = metrics[campaign.id] || {
      view_count: 0,
      review_count: 0,
      conversion_rate: 0
    };
    
    return {
      name: campaign.name,
      views: campaignMetrics.view_count,
      reviews: campaignMetrics.review_count,
      conversion_rate: campaignMetrics.conversion_rate
    };
  });

  const getChartColor = (index: number) => {
    const colors = ['#2563eb', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];
    return colors[index % colors.length];
  };

  const renderMetricBar = () => {
    switch (selectedMetric) {
      case 'views':
        return (
          <Bar
            dataKey="views"
            fill="#2563eb"
            name={t('campaigns.metrics.views')}
            radius={[4, 4, 0, 0]}
          />
        );
      case 'reviews':
        return (
          <Bar
            dataKey="reviews"
            fill="#10b981"
            name={t('campaigns.metrics.reviews')}
            radius={[4, 4, 0, 0]}
          />
        );
      case 'conversion_rate':
        return (
          <Bar
            dataKey="conversion_rate"
            fill="#8b5cf6"
            name={t('campaigns.metrics.conversionRate')}
            radius={[4, 4, 0, 0]}
            unit="%"
          />
        );
      default:
        return null;
    }
  };

  const getMaxValue = () => {
    if (selectedMetric === 'conversion_rate') {
      return Math.max(...chartData.map(d => d.conversion_rate), 100);
    } else if (selectedMetric === 'views') {
      return Math.max(...chartData.map(d => d.views)) * 1.2;
    } else if (selectedMetric === 'reviews') {
      return Math.max(...chartData.map(d => d.reviews)) * 1.2;
    }
    return 100;
  };

  return (
    <div className="p-6">
      <div className="mb-6">
        <h2 className="text-2xl font-bold mb-2">{t('campaigns.comparison.title')}</h2>
        <p className="text-gray-500">{t('campaigns.comparison.description')}</p>
      </div>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle>{t('campaigns.comparison.metrics')}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex space-x-2 mb-4">
            <button
              className={`px-4 py-2 rounded-md text-sm ${
                selectedMetric === 'views'
                  ? 'bg-primary text-white'
                  : 'bg-gray-100 hover:bg-gray-200'
              }`}
              onClick={() => setSelectedMetric('views')}
            >
              {t('campaigns.metrics.views')}
            </button>
            <button
              className={`px-4 py-2 rounded-md text-sm ${
                selectedMetric === 'reviews'
                  ? 'bg-primary text-white'
                  : 'bg-gray-100 hover:bg-gray-200'
              }`}
              onClick={() => setSelectedMetric('reviews')}
            >
              {t('campaigns.metrics.reviews')}
            </button>
            <button
              className={`px-4 py-2 rounded-md text-sm ${
                selectedMetric === 'conversion_rate'
                  ? 'bg-primary text-white'
                  : 'bg-gray-100 hover:bg-gray-200'
              }`}
              onClick={() => setSelectedMetric('conversion_rate')}
            >
              {t('campaigns.metrics.conversionRate')}
            </button>
          </div>

          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={chartData}
                margin={{
                  top: 20,
                  right: 30,
                  left: 20,
                  bottom: 5,
                }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis domain={[0, getMaxValue()]} />
                <Tooltip 
                  formatter={(value, name) => {
                    if (name === t('campaigns.metrics.conversionRate')) {
                      return [`${value}%`, name];
                    }
                    return [value, name];
                  }}
                />
                <Legend />
                {renderMetricBar()}
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{t('campaigns.comparison.performance')}</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t('campaigns.campaignName')}</TableHead>
                <TableHead>{t('campaigns.startDate')}</TableHead>
                <TableHead>{t('campaigns.status')}</TableHead>
                <TableHead className="text-right">{t('campaigns.metrics.views')}</TableHead>
                <TableHead className="text-right">{t('campaigns.metrics.reviews')}</TableHead>
                <TableHead className="text-right">{t('campaigns.metrics.conversionRate')}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {campaigns.map((campaign, index) => {
                const campaignMetrics = metrics[campaign.id] || {
                  view_count: 0,
                  review_count: 0,
                  conversion_rate: 0
                };
                
                const status = getCampaignStatus(campaign);
                
                return (
                  <TableRow key={campaign.id}>
                    <TableCell className="font-medium">
                      <div className="flex items-center">
                        <span
                          className="w-3 h-3 rounded-full mr-2"
                          style={{ backgroundColor: getChartColor(index) }}
                        ></span>
                        {campaign.name}
                      </div>
                    </TableCell>
                    <TableCell>{format(new Date(campaign.start_date), 'MMM d, yyyy')}</TableCell>
                    <TableCell>{t(`campaigns.${status}`)}</TableCell>
                    <TableCell className="text-right">{campaignMetrics.view_count.toLocaleString()}</TableCell>
                    <TableCell className="text-right">{campaignMetrics.review_count.toLocaleString()}</TableCell>
                    <TableCell className="text-right">{campaignMetrics.conversion_rate.toFixed(1)}%</TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}

// Utility function for campaign status
function getCampaignStatus(campaign: Campaign) {
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
}