import React from 'react';
import { useTranslation } from 'react-i18next';
import AnalyticsCard from './AnalyticsCard';
import ComparisonCard from './ComparisonCard';
import ReviewsLineChart from './ReviewsLineChart';
import RatingBarChart from './RatingBarChart';
import OutletPerformanceChart from './OutletPerformanceChart';
import SentimentAnalysisChart from './SentimentAnalysisChart';
import IncentivePerformanceChart from './IncentivePerformanceChart';
import CustomerEngagementChart from './CustomerEngagementChart';
import PerformanceLeaderboard from './PerformanceLeaderboard';
import MetricSummaryTable from './MetricSummaryTable';
import { formatNumber, chartColors } from './ChartUtils';
import { DashboardData, ReviewCountData, IncentivePerformance, OutletPerformance } from '../../lib/analytics.d';

// Import necessary icons
import {
  ChatBubbleIcon,
  StarFilledIcon,
  PersonIcon,
  BarChartIcon,
  TimerIcon,
  HomeIcon,
  TargetIcon
} from '@radix-ui/react-icons';
import { Gift as GiftIcon } from 'lucide-react';

interface AnalyticsDashboardProps {
  dashboardData: DashboardData;
  timeRange: string;
  onExport: <T>(data: T[], filename: string) => void;
}

export default function AnalyticsDashboard({
  dashboardData,
  timeRange,
  onExport
}: AnalyticsDashboardProps) {
  const { t } = useTranslation();
  const {
    summary,
    reviewsOverTime,
    ratingDistribution,
    outletPerformance,
    sentimentAnalysis,
    incentivePerformance,
    customerEngagement,
    compareWithPrevious,
    previousReviewsData
  } = dashboardData;

  // Format data for review trends
  const formatReviewsData = () => {
    return reviewsOverTime.map(item => ({
      date: item.date,
      reviews: item.count
    }));
  };

  // Format data for rating distribution
  const formatRatingData = () => {
    return [
      { rating: '1 ★', count: ratingDistribution[0] },
      { rating: '2 ★', count: ratingDistribution[1] },
      { rating: '3 ★', count: ratingDistribution[2] },
      { rating: '4 ★', count: ratingDistribution[3] },
      { rating: '5 ★', count: ratingDistribution[4] }
    ];
  };

  // Format data for incentive performance
  const formatIncentiveData = () => {
    return incentivePerformance.map(item => ({
      name: item.name,
      issued: item.issued,
      claimed: item.claimed,
      conversionRate: item.conversionRate
    }));
  };

  // Calculate review quality score (weighted average)
  const calculateReviewQualityScore = () => {
    const totalReviews = ratingDistribution.reduce((sum, count, index) => sum + count, 0);
    if (totalReviews === 0) return 0;

    // Weight factors (higher stars have higher weights)
    const weights = [0.2, 0.4, 0.6, 0.8, 1.0];
    
    // Calculate weighted sum
    const weightedSum = ratingDistribution.reduce(
      (sum, count, index) => sum + count * weights[index], 
      0
    );
    
    // Score out of 100
    return Math.round((weightedSum / totalReviews) * 100);
  };

  // Calculate average review response time (in hours)

  const calculateAvgResponseTime = () => {
    return summary.avgResponseTime || 0;
  };

  // Calculate previous period's response time
  const calculatePrevResponseTime = () => {
    return summary.prevAvgResponseTime || 0;
  };

  // Prepare outlet leaderboard data
  const outletLeaderboardData = outletPerformance
    .map(outlet => ({
      id: outlet.id,
      name: outlet.name,
      value: outlet.reviewCount,
      secondaryValue: outlet.averageRating,
      change: Math.round((outlet.reviewCount / (outlet.previousReviewCount || 1) - 1) * 100) || 0,
      icon: <HomeIcon className="w-4 h-4 text-blue-500" />
    }))
    .sort((a, b) => b.value - a.value);

  // Prepare incentives leaderboard data
  const incentivesLeaderboardData = incentivePerformance
    .map(incentive => ({
      id: incentive.id,
      name: incentive.name,
      value: incentive.conversionRate,
      secondaryValue: incentive.issued,
      icon: <GiftIcon className="w-4 h-4 text-green-500" />
    }))
    .sort((a, b) => b.value - a.value);

  // Calculate total reviews in current period
  const totalCurrentReviews = reviewsOverTime.reduce((sum, item) => sum + item.count, 0);
  
  // Calculate total reviews in previous period (if available)
  const totalPreviousReviews = previousReviewsData 
    ? previousReviewsData.reduce((sum, item) => sum + item.count, 0) 
    : summary.previousTotalReviews || 0;

  // Calculate total new customers in current period
  const totalNewCustomers = customerEngagement.reduce((sum, item) => sum + item.newCustomers, 0);
  
  // Calculate total returning customers in current period
  const totalReturningCustomers = customerEngagement.reduce((sum, item) => sum + item.returningCustomers, 0);
  
  // Calculate previous period's customer counts
  const previousNewCustomers = summary.previousNewCustomers || 0;
  const previousReturningCustomers = summary.previousReturningCustomers || 0;

  // Review quality score
  const reviewQualityScore = calculateReviewQualityScore();
  const previousQualityScore = summary.previousQualityScore || 80; // Default if not available

  // Average response time
  const avgResponseTime = calculateAvgResponseTime();
  const prevResponseTime = calculatePrevResponseTime();

  return (
    <div className="space-y-8">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <ComparisonCard 
          title={t('analytics.cards.totalReviews')}
          currentValue={totalCurrentReviews}
          previousValue={totalPreviousReviews}
          icon={<ChatBubbleIcon className="h-6 w-6 text-blue-500" />}
        />
        
        <ComparisonCard 
          title={t('analytics.cards.averageRating')}
          currentValue={summary.averageRating || 0}
          previousValue={summary.previousAverageRating || 0}
          valueFormatter={(val) => val.toFixed(1)}
          icon={<StarFilledIcon className="h-6 w-6 text-yellow-500" />}
        />
        
        <ComparisonCard 
          title={t('analytics.cards.reviewQuality')}
          currentValue={reviewQualityScore}
          previousValue={previousQualityScore}
          valueFormatter={(val) => `${val}/100`}
          icon={<TargetIcon className="h-6 w-6 text-green-500" />}
        />
        
        <ComparisonCard 
          title={t('analytics.cards.avgResponseTime')}
          currentValue={avgResponseTime}
          previousValue={prevResponseTime}
          valueFormatter={(val) => `${val.toFixed(1)}h`}
          inverseColors={true} // Lower is better for response time
          icon={<TimerIcon className="h-6 w-6 text-purple-500" />}
        />
      </div>
      
      {/* Reviews Over Time Chart */}
      <div className="bg-white shadow rounded-lg p-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
          <h2 className="text-lg font-semibold text-gray-800">
            {t('analytics.charts.reviewsOverTime')}
          </h2>
          <div className="flex mt-4 md:mt-0">
            <button
              onClick={() => onExport(reviewsOverTime, 'reviews-over-time')}
              className="inline-flex items-center px-3 py-1 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50"
            >
              <svg className="w-4 h-4 mr-2 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              {t('analytics.exportCSV')}
            </button>
          </div>
        </div>
        <ReviewsLineChart 
          data={formatReviewsData()} 
          comparisonData={previousReviewsData} 
          showComparison={compareWithPrevious} 
          height={350} 
        />
      </div>
      
      {/* Rating and Sentiment Analysis */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white shadow rounded-lg p-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-6">{t('analytics.charts.ratingDistribution')}</h2>
          <RatingBarChart data={formatRatingData()} height={300} />
        </div>
        
        <div className="bg-white shadow rounded-lg p-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-6">{t('analytics.charts.sentimentAnalysis')}</h2>
          <SentimentAnalysisChart data={sentimentAnalysis} height={300} />
        </div>
      </div>
      
      {/* Outlet Performance and Customer Engagement */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <PerformanceLeaderboard
          title={t('analytics.leaderboards.topOutlets')}
          items={outletLeaderboardData}
          valueLabel={t('analytics.leaderboards.reviews')}
          secondaryValueLabel={t('analytics.leaderboards.avgRating')}
          formatSecondaryValue={(val) => val.toFixed(1)}
          showTrend={true}
        />
        
        <PerformanceLeaderboard
          title={t('analytics.leaderboards.topIncentives')}
          items={incentivesLeaderboardData}
          valueLabel={t('analytics.leaderboards.conversionRate')}
          secondaryValueLabel={t('analytics.leaderboards.issued')}
          formatValue={(val) => `${val}%`}
          showTrend={false}
        />
      </div>
      
      {/* Customer Engagement Chart */}
      <div className="bg-white shadow rounded-lg p-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
          <h2 className="text-lg font-semibold text-gray-800">
            {t('analytics.charts.customerEngagement')}
          </h2>
          <div className="grid grid-cols-2 gap-4 mt-4 md:mt-0">
            <ComparisonCard 
              title={t('analytics.cards.newCustomers')}
              currentValue={totalNewCustomers}
              previousValue={previousNewCustomers}
              valueFormatter={(val) => formatNumber(val)}
              icon={<PersonIcon className="h-5 w-5 text-blue-500" />}
            />
            <ComparisonCard 
              title={t('analytics.cards.returningCustomers')}
              currentValue={totalReturningCustomers}
              previousValue={previousReturningCustomers}
              valueFormatter={(val) => formatNumber(val)}
              icon={<PersonIcon className="h-5 w-5 text-green-500" />}
            />
          </div>
        </div>
        <CustomerEngagementChart data={customerEngagement} height={350} />
      </div>
    </div>
  );
}