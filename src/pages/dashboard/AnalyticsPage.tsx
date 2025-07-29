import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../contexts/AuthContext';

import PageHeader from '../../components/layout/PageHeader';
import AnalyticsTabs from '../../components/analytics/AnalyticsTabs';
import TimeRangeSelector from '../../components/analytics/TimeRangeSelector';
import AnalyticsDashboard from '../../components/analytics/AnalyticsDashboard';
import MetricSummaryTable from '../../components/analytics/MetricSummaryTable';
import { 
  BarChartIcon, 
  HomeIcon, 
  PersonIcon, 
  MixerVerticalIcon,
  DownloadIcon
} from '@radix-ui/react-icons';
import { Gift as GiftIcon } from 'lucide-react';

import {
  fetchAnalyticsSummary,
  fetchReviewsOverTime,
  fetchRatingDistribution,
  fetchOutletPerformance,
  fetchSentimentAnalysis,
  fetchIncentivePerformance,
  fetchCustomerEngagement,
  exportToCSV
} from '../../lib/analytics';
import {
  AnalyticsSummary,
  ReviewCountData,
  OutletPerformance,
  SentimentAnalysis,
  IncentivePerformance,
  CustomerEngagement,
  MetricData
} from '../../lib/analytics.d';

export default function AnalyticsPage() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [timeRange, setTimeRange] = useState('last30days');
  const [compareWithPrevious, setCompareWithPrevious] = useState(false);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  
  // State for analytics data
  const [summary, setSummary] = useState<AnalyticsSummary | null>(null);
  const [reviewsOverTime, setReviewsOverTime] = useState<ReviewCountData[]>([]);
  const [previousReviewsData, setPreviousReviewsData] = useState<ReviewCountData[]>([]);
  const [ratingDistribution, setRatingDistribution] = useState<number[]>([0, 0, 0, 0, 0]);
  const [outletPerformance, setOutletPerformance] = useState<OutletPerformance[]>([]);
  const [sentimentAnalysis, setSentimentAnalysis] = useState<SentimentAnalysis>({ positive: 0, neutral: 0, negative: 0 });
  const [incentivePerformance, setIncentivePerformance] = useState<IncentivePerformance[]>([]);
  const [customerEngagement, setCustomerEngagement] = useState<CustomerEngagement[]>([]);

  useEffect(() => {
    if (!user?.user?.id) return;
    
    const loadAnalyticsData = async () => {
      setLoading(true);
      setError(null);
      
      const merchantId = user.user.id;

      try {
        // Fetch all data in parallel
        const [
          summaryData,
          reviewsData,
          ratingsData,
          outletsData,
          sentimentData,
          incentivesData,
          engagementData
        ] = await Promise.all([
          fetchAnalyticsSummary(merchantId, timeRange),
          fetchReviewsOverTime(merchantId, timeRange),
          fetchRatingDistribution(merchantId, timeRange),
          fetchOutletPerformance(merchantId, timeRange),
          fetchSentimentAnalysis(merchantId, timeRange),
          fetchIncentivePerformance(merchantId, timeRange),
          fetchCustomerEngagement(merchantId, timeRange)
        ]);

        // Update state with fetched data
        setSummary(summaryData);
        setReviewsOverTime(reviewsData);
        setRatingDistribution(ratingsData);
        setOutletPerformance(outletsData);
        setSentimentAnalysis(sentimentData);
        setIncentivePerformance(incentivesData);
        setCustomerEngagement(engagementData);

        // If comparison is enabled, load previous period data
        if (compareWithPrevious) {
          loadPreviousPeriodData(merchantId, timeRange);
        } else {
          setPreviousReviewsData([]);
        }
      } catch (err) {
        console.error('Error loading analytics data:', err);
        setError(typeof err === 'string' ? err : 'Failed to load analytics data');
      } finally {
        setLoading(false);
      }
    };

    loadAnalyticsData();
  }, [user, timeRange, compareWithPrevious]);

  // Load data for previous period for comparison
  const loadPreviousPeriodData = async (merchantId: string, currentTimeRange: string) => {
    try {
      // Get date range for previous period
      const { startDate, endDate } = getDateRangeForPreviousPeriod(currentTimeRange);
      
      // Format as time range string
      const previousPeriod = `${startDate.toISOString()}|${endDate.toISOString()}`;
      
      // Fetch previous period data
      const previousData = await fetchReviewsOverTime(merchantId, previousPeriod);
      setPreviousReviewsData(previousData);
    } catch (err) {
      console.error('Error loading previous period data:', err);
      // Don't set error state, as this is optional data
      setPreviousReviewsData([]);
    }
  };

  // Helper to calculate previous period date range
  const getDateRangeForPreviousPeriod = (currentTimeRange: string) => {
    // Get current period
    const { startDate: currentStart, endDate: currentEnd } = getDateRange(currentTimeRange);
    
    // Calculate time span
    const timespan = currentEnd.getTime() - currentStart.getTime();
    
    // Create previous period dates
    const previousStart = new Date(currentStart);
    const previousEnd = new Date(currentEnd);
    previousStart.setTime(previousStart.getTime() - timespan);
    previousEnd.setTime(previousEnd.getTime() - timespan);
    
    return { startDate: previousStart, endDate: previousEnd };
  };

  // Helper function borrowed from ChartUtils to keep component self-contained
  const getDateRange = (timeRange: string) => {
    const endDate = new Date();
    endDate.setHours(23, 59, 59, 999); // End of day
    
    const startDate = new Date();
    
    switch (timeRange) {
      case 'last7days':
        startDate.setDate(endDate.getDate() - 7);
        break;
      case 'last30days':
        startDate.setDate(endDate.getDate() - 30);
        break;
      case 'last90days':
        startDate.setDate(endDate.getDate() - 90);
        break;
      case 'lastYear':
        startDate.setFullYear(endDate.getFullYear() - 1);
        break;
      case 'allTime':
        startDate.setFullYear(2020); // Arbitrary starting point
        break;
      default:
        startDate.setDate(endDate.getDate() - 30); // Default to last 30 days
    }
    
    startDate.setHours(0, 0, 0, 0); // Start of day
    
    return { startDate, endDate };
  };

  // Handle time range change
  const handleTimeRangeChange = (newTimeRange: string) => {
    setTimeRange(newTimeRange);
  };

  // Toggle comparison with previous period
  const toggleComparison = () => {
    setCompareWithPrevious(!compareWithPrevious);
  };

  // Handle export data
  const handleExportData = <T,>(data: T[], filename: string) => {
    exportToCSV(data, filename);
  };

  // Format outlet performance data for tables
  const formatOutletData = () => {
    return outletPerformance.map(outlet => ({
      id: outlet.id,
      name: outlet.name,
      metrics: {
        reviewCount: outlet.reviewCount,
        averageRating: outlet.averageRating,
        trendPercentage: ((outlet.reviewCount / (outlet.previousReviewCount || 1)) - 1) * 100
      }
    }));
  };

  // Format incentive performance data for tables
  const formatIncentiveData = () => {
    return incentivePerformance.map(incentive => ({
      id: incentive.id,
      name: incentive.name,
      metrics: {
        issued: incentive.issued,
        claimed: incentive.claimed,
        conversionRate: incentive.conversionRate
      }
    }));
  };

  // Prepare dashboard data for the dashboard component
  const dashboardData = {
    summary,
    reviewsOverTime,
    ratingDistribution,
    outletPerformance,
    sentimentAnalysis,
    incentivePerformance,
    customerEngagement,
    compareWithPrevious,
    previousReviewsData
  };

  // Define the tabs content
  const tabs = [
    {
      id: 'overview',
      label: t('analytics.tabs.overview'),
      icon: <BarChartIcon className="h-4 w-4" />,
      content: (
        <AnalyticsDashboard 
          dashboardData={dashboardData} 
          timeRange={timeRange}
          onExport={handleExportData}
        />
      )
    },
    {
      id: 'outlets',
      label: t('analytics.tabs.outlets'),
      icon: <HomeIcon className="h-4 w-4" />,
      content: (
        <div className="p-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
            <h2 className="text-lg font-semibold text-gray-800">{t('analytics.tables.outletPerformance')}</h2>
            <div className="flex mt-4 md:mt-0">
              <button
                onClick={() => handleExportData(outletPerformance, 'outlet-performance')}
                className="inline-flex items-center px-3 py-1 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50"
              >
                <DownloadIcon className="w-4 h-4 mr-2 text-gray-500" />
                {t('analytics.exportCSV')}
              </button>
            </div>
          </div>
          
          <MetricSummaryTable
            data={formatOutletData()}
            columns={[
              {
                id: 'reviewCount',
                header: t('analytics.tables.reviewCount'),
                cell: (value) => <span className="font-medium">{value}</span>,
                sortable: true
              },
              {
                id: 'averageRating',
                header: t('analytics.tables.averageRating'),
                cell: (value) => (
                  <div className="flex items-center">
                    <span className="font-medium mr-1">{value.toFixed(1)}</span>
                    <span className="text-yellow-500">★</span>
                  </div>
                ),
                sortable: true
              },
              {
                id: 'trendPercentage',
                header: t('analytics.tables.trend'),
                cell: (value) => (
                  <span className={value > 0 ? 'text-green-600' : value < 0 ? 'text-red-600' : 'text-gray-500'}>
                    {value > 0 ? '↑' : value < 0 ? '↓' : '–'} {Math.abs(Math.round(value))}%
                  </span>
                ),
                sortable: true
              }
            ]}
            emptyMessage={t('analytics.tables.noOutletData')}
          />
        </div>
      )
    },
    {
      id: 'incentives',
      label: t('analytics.tabs.incentives'),
      icon: <GiftIcon className="h-4 w-4" />,
      content: (
        <div className="p-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
            <h2 className="text-lg font-semibold text-gray-800">{t('analytics.tables.incentivePerformance')}</h2>
            <div className="flex mt-4 md:mt-0">
              <button
                onClick={() => handleExportData(incentivePerformance, 'incentive-performance')}
                className="inline-flex items-center px-3 py-1 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50"
              >
                <DownloadIcon className="w-4 h-4 mr-2 text-gray-500" />
                {t('analytics.exportCSV')}
              </button>
            </div>
          </div>
          
          <MetricSummaryTable
            data={formatIncentiveData()}
            columns={[
              {
                id: 'issued',
                header: t('analytics.tables.issued'),
                cell: (value) => <span className="font-medium">{value}</span>,
                sortable: true
              },
              {
                id: 'claimed',
                header: t('analytics.tables.claimed'),
                cell: (value) => <span className="font-medium">{value}</span>,
                sortable: true
              },
              {
                id: 'conversionRate',
                header: t('analytics.tables.conversionRate'),
                cell: (value) => <span className="font-medium">{value}%</span>,
                sortable: true
              }
            ]}
            emptyMessage={t('analytics.tables.noIncentiveData')}
          />
        </div>
      )
    },
    {
      id: 'customers',
      label: t('analytics.tabs.customers'),
      icon: <PersonIcon className="h-4 w-4" />,
      content: (
        <div className="p-6">
          <div className="grid grid-cols-1 gap-6">
            <div className="bg-white shadow rounded-lg p-6">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
                <h2 className="text-lg font-semibold text-gray-800">{t('analytics.charts.customerEngagement')}</h2>
                <div className="flex mt-4 md:mt-0">
                  <button
                    onClick={() => handleExportData(customerEngagement, 'customer-engagement')}
                    className="inline-flex items-center px-3 py-1 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50"
                  >
                    <DownloadIcon className="w-4 h-4 mr-2 text-gray-500" />
                    {t('analytics.exportCSV')}
                  </button>
                </div>
              </div>
              
              <div className="mb-6">
                <h3 className="text-base font-medium text-gray-700 mb-2">{t('analytics.customerMetrics.title')}</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="bg-blue-50 p-4 rounded-lg">
                    <p className="text-sm text-blue-700">{t('analytics.customerMetrics.totalUnique')}</p>
                    <p className="text-2xl font-bold">
                      {customerEngagement.reduce((sum, day) => sum + day.newCustomers, 0)}
                    </p>
                  </div>
                  <div className="bg-green-50 p-4 rounded-lg">
                    <p className="text-sm text-green-700">{t('analytics.customerMetrics.returnRate')}</p>
                    <p className="text-2xl font-bold">
                      {calculateReturnRate()}%
                    </p>
                  </div>
                  <div className="bg-purple-50 p-4 rounded-lg">
                    <p className="text-sm text-purple-700">{t('analytics.customerMetrics.avgReviewsPerCustomer')}</p>
                    <p className="text-2xl font-bold">
                      {calculateAverageReviewsPerCustomer()}
                    </p>
                  </div>
                </div>
              </div>
              
              <div className="h-[400px]">
                <CustomerEngagementChart data={customerEngagement} height={400} />
              </div>
            </div>
          </div>
        </div>
      )
    }
  ];

  // Helper functions for customer metrics
  const calculateReturnRate = () => {
    const totalReturning = customerEngagement.reduce((sum, day) => sum + day.returningCustomers, 0);
    const totalNew = customerEngagement.reduce((sum, day) => sum + day.newCustomers, 0);
    const totalCustomers = totalNew + totalReturning;
    
    return totalCustomers > 0 
      ? Math.round((totalReturning / totalCustomers) * 100) 
      : 0;
  };

  const calculateAverageReviewsPerCustomer = () => {
    const totalReviews = reviewsOverTime.reduce((sum, day) => sum + day.count, 0);
    const totalCustomers = customerEngagement.reduce(
      (sum, day) => sum + day.newCustomers + day.returningCustomers, 
      0
    );
    
    return totalCustomers > 0 
      ? Math.round((totalReviews / totalCustomers) * 10) / 10 
      : 0;
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <PageHeader 
        title={t('analytics.title')}
        description={t('analytics.description')}
      />

      <div className="mb-6 flex flex-col md:flex-row md:items-center md:justify-between">
        <h2 className="text-xl font-semibold text-gray-800 mb-4 md:mb-0">
          {t('analytics.dashboardTitle')}
        </h2>
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex items-center">
            <input
              type="checkbox"
              id="compareToggle"
              checked={compareWithPrevious}
              onChange={toggleComparison}
              className="mr-2 h-4 w-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
            />
            <label htmlFor="compareToggle" className="text-sm text-gray-600">
              {t('analytics.comparePreviousPeriod')}
            </label>
          </div>
          <TimeRangeSelector value={timeRange} onChange={handleTimeRangeChange} />
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
          <button 
            onClick={() => window.location.reload()}
            className="mt-4 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary-600 hover:bg-primary-700"
          >
            {t('common.retry')}
          </button>
        </div>
      ) : (
        <AnalyticsTabs tabs={tabs} defaultTab="overview" />
      )}
    </div>
  );
}