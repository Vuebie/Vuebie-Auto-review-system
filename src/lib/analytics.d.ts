// Define interfaces for analytics data types

export interface ReviewCountData {
  date: string;
  count: number;
}

export interface RatingItem {
  rating: string;
  count: number;
}

export interface OutletPerformance {
  id: string;
  name: string;
  reviewCount: number;
  averageRating: number;
  previousReviewCount?: number;
}

export interface SentimentAnalysis {
  positive: number;
  neutral: number;
  negative: number;
}

export interface IncentivePerformance {
  id: string;
  name: string;
  issued: number;
  claimed: number;
  conversionRate: number;
}

export interface CustomerEngagement {
  date: string;
  newCustomers: number;
  returningCustomers: number;
}

export interface AnalyticsSummary {
  totalReviews: number;
  reviewsThisMonth: number;
  averageRating: number;
  previousAverageRating?: number;
  topOutlet: {
    id: string;
    name: string;
    reviewCount: number;
  } | null;
  reviewTrend: number; // Percentage change from previous period
  previousTotalReviews?: number;
  previousNewCustomers?: number;
  previousReturningCustomers?: number;
  previousQualityScore?: number;
  avgResponseTime?: number;
  prevAvgResponseTime?: number;
}

export interface DashboardData {
  summary: AnalyticsSummary | null;
  reviewsOverTime: ReviewCountData[];
  ratingDistribution: number[];
  outletPerformance: OutletPerformance[];
  sentimentAnalysis: SentimentAnalysis;
  incentivePerformance: IncentivePerformance[];
  customerEngagement: CustomerEngagement[];
  compareWithPrevious: boolean;
  previousReviewsData?: ReviewCountData[];
}

export interface MetricData {
  id: string;
  name: string;
  metrics: Record<string, number | string>;
}