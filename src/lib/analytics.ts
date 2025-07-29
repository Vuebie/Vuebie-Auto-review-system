import { supabase, TABLES } from './supabase';
import { getDateRange, generateDateRange } from '../components/analytics/ChartUtils';

// Interface definitions
export interface AnalyticsSummary {
  totalReviews: number;
  reviewsThisMonth: number;
  averageRating: number;
  topOutlet: {
    id: string;
    name: string;
    reviewCount: number;
  } | null;
  reviewTrend: number; // Percentage change from previous period
}

export interface ReviewCountData {
  date: string;
  count: number;
}

export interface RatingDistribution {
  oneStar: number;
  twoStars: number;
  threeStars: number;
  fourStars: number;
  fiveStars: number;
}

export interface OutletPerformance {
  id: string;
  name: string;
  reviewCount: number;
  averageRating: number;
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

// Fetch overall analytics summary
export async function fetchAnalyticsSummary(
  merchantId: string,
  timeRange: string = 'last30days'
): Promise<AnalyticsSummary> {
  const { startDate, endDate } = getDateRange(timeRange);
  const startDateIso = startDate.toISOString();
  const endDateIso = endDate.toISOString();

  // Fetch total reviews in time period
  const { data: reviewsData, error: reviewsError } = await supabase
    .from(TABLES.REVIEW_SESSIONS)
    .select('id, created_at')
    .eq('merchant_id', merchantId)
    .eq('review_posted', true)
    .gte('created_at', startDateIso)
    .lte('created_at', endDateIso);

  if (reviewsError) {
    // Handle error fetching reviews
    throw new Error('Failed to fetch reviews data');
  }

  // Fetch reviews this month
  const thisMonthStart = new Date();
  thisMonthStart.setDate(1); // First day of current month
  thisMonthStart.setHours(0, 0, 0, 0);
  
  const { data: monthlyReviewsData, error: monthlyReviewsError } = await supabase
    .from(TABLES.REVIEW_SESSIONS)
    .select('id')
    .eq('merchant_id', merchantId)
    .eq('review_posted', true)
    .gte('created_at', thisMonthStart.toISOString());

  if (monthlyReviewsError) {
    // Handle error fetching monthly reviews
    throw new Error('Failed to fetch monthly reviews data');
  }

  // Fetch average rating (assuming there's a rating field, adjust as needed)
  const { data: ratingsData, error: ratingsError } = await supabase
    .from(TABLES.REVIEW_SESSIONS)
    .select('review_rating')
    .eq('merchant_id', merchantId)
    .eq('review_posted', true)
    .gte('created_at', startDateIso)
    .lte('created_at', endDateIso)
    .not('review_rating', 'is', null);

  if (ratingsError) {
    // Handle error fetching ratings
    throw new Error('Failed to fetch ratings data');
  }

  // Calculate average rating
  const validRatings = ratingsData.filter(r => r.review_rating !== null);
  const averageRating = validRatings.length > 0
    ? validRatings.reduce((sum, curr) => sum + (curr.review_rating || 0), 0) / validRatings.length
    : 0;

  // Fetch top outlet by review count
  const { data: outletsData, error: outletsError } = await supabase
    .from(TABLES.REVIEW_SESSIONS)
    .select(`
      outlet_id,
      ${TABLES.OUTLETS}!inner (
        id,
        name
      ),
      count
    `)
    .eq('merchant_id', merchantId)
    .eq('review_posted', true)
    .gte('created_at', startDateIso)
    .lte('created_at', endDateIso)
    .not('outlet_id', 'is', null)
    .group('outlet_id, outlets.id, outlets.name')
    .order('count', { ascending: false })
    .limit(1);

  if (outletsError) {
    // Handle error fetching outlets
    throw new Error('Failed to fetch outlets data');
  }

  // Calculate review trend (compare with previous period)
  const previousStartDate = new Date(startDate);
  const previousEndDate = new Date(endDate);
  const timespan = endDate.getTime() - startDate.getTime();
  previousStartDate.setTime(previousStartDate.getTime() - timespan);
  previousEndDate.setTime(previousEndDate.getTime() - timespan);

  const { data: previousPeriodData, error: previousPeriodError } = await supabase
    .from(TABLES.REVIEW_SESSIONS)
    .select('id')
    .eq('merchant_id', merchantId)
    .eq('review_posted', true)
    .gte('created_at', previousStartDate.toISOString())
    .lte('created_at', previousEndDate.toISOString());

  if (previousPeriodError) {
    // Handle error fetching previous period data
    throw new Error('Failed to fetch previous period data');
  }

  // Calculate trend percentage
  const currentCount = reviewsData.length;
  const previousCount = previousPeriodData.length;
  let trendPercentage = 0;

  if (previousCount > 0) {
    trendPercentage = ((currentCount - previousCount) / previousCount) * 100;
  } else if (currentCount > 0) {
    trendPercentage = 100; // If there were no reviews before and now there are
  }

  // Format top outlet data
  let topOutlet = null;
  if (outletsData && outletsData.length > 0) {
    topOutlet = {
      id: outletsData[0].outlets?.id || '',
      name: outletsData[0].outlets?.name || 'Unknown',
      reviewCount: outletsData[0].count
    };
  }

  return {
    totalReviews: reviewsData.length,
    reviewsThisMonth: monthlyReviewsData.length,
    averageRating: Math.round(averageRating * 10) / 10, // Round to 1 decimal
    topOutlet,
    reviewTrend: Math.round(trendPercentage * 10) / 10 // Round to 1 decimal
  };
}

// Fetch review count data over time for time-series charts
export async function fetchReviewsOverTime(
  merchantId: string,
  timeRange: string = 'last30days'
): Promise<ReviewCountData[]> {
  const { startDate, endDate } = getDateRange(timeRange);
  const startDateIso = startDate.toISOString();
  const endDateIso = endDate.toISOString();

  const { data, error } = await supabase
    .from(TABLES.REVIEW_SESSIONS)
    .select('created_at')
    .eq('merchant_id', merchantId)
    .eq('review_posted', true)
    .gte('created_at', startDateIso)
    .lte('created_at', endDateIso)
    .order('created_at', { ascending: true });

  if (error) {
    // Handle error fetching review timeline data
    throw new Error('Failed to fetch review timeline data');
  }

  // Generate an array of all dates in the range
  const dateRange = generateDateRange(startDate, endDate);
  
  // Group reviews by date
  const countByDate: { [date: string]: number } = {};
  
  // Initialize all dates with 0
  dateRange.forEach(date => {
    countByDate[date] = 0;
  });
  
  // Count reviews per date
  data.forEach(review => {
    const date = new Date(review.created_at).toISOString().split('T')[0];
    countByDate[date] = (countByDate[date] || 0) + 1;
  });
  
  // Convert to array format for charting
  return Object.entries(countByDate).map(([date, count]) => ({
    date,
    count
  }));
}

// Fetch rating distribution (1-5 stars)
export async function fetchRatingDistribution(
  merchantId: string,
  timeRange: string = 'last30days'
): Promise<number[]> {
  const { startDate, endDate } = getDateRange(timeRange);
  const startDateIso = startDate.toISOString();
  const endDateIso = endDate.toISOString();

  const { data, error } = await supabase
    .from(TABLES.REVIEW_SESSIONS)
    .select('review_rating')
    .eq('merchant_id', merchantId)
    .eq('review_posted', true)
    .gte('created_at', startDateIso)
    .lte('created_at', endDateIso)
    .not('review_rating', 'is', null);

  if (error) {
    // Handle error fetching rating distribution
    throw new Error('Failed to fetch rating distribution');
  }

  // Initialize counts for 1-5 stars
  const distribution = [0, 0, 0, 0, 0];
  
  data.forEach(review => {
    const rating = review.review_rating;
    if (rating >= 1 && rating <= 5) {
      distribution[rating - 1]++;
    }
  });

  return distribution;
}

// Fetch outlet performance data
export async function fetchOutletPerformance(
  merchantId: string,
  timeRange: string = 'last30days'
): Promise<OutletPerformance[]> {
  const { startDate, endDate } = getDateRange(timeRange);
  const startDateIso = startDate.toISOString();
  const endDateIso = endDate.toISOString();

  // First get all outlets
  const { data: outlets, error: outletsError } = await supabase
    .from(TABLES.OUTLETS)
    .select('id, name')
    .eq('merchant_id', merchantId);

  if (outletsError) {
    // Handle error fetching outlets
    throw new Error('Failed to fetch outlets');
  }

  // For each outlet, get review count and average rating
  const outletPerformance: OutletPerformance[] = [];
  
  for (const outlet of outlets) {
    // Get review count
    const { data: reviews, error: reviewsError } = await supabase
      .from(TABLES.REVIEW_SESSIONS)
      .select('review_rating')
      .eq('merchant_id', merchantId)
      .eq('outlet_id', outlet.id)
      .eq('review_posted', true)
      .gte('created_at', startDateIso)
      .lte('created_at', endDateIso);

    if (reviewsError) {
      // Handle error fetching reviews for outlet
      continue;
    }

    // Calculate average rating
    let totalRating = 0;
    let ratingCount = 0;

    reviews.forEach(review => {
      if (review.review_rating) {
        totalRating += review.review_rating;
        ratingCount++;
      }
    });

    const averageRating = ratingCount > 0 ? totalRating / ratingCount : 0;

    outletPerformance.push({
      id: outlet.id,
      name: outlet.name,
      reviewCount: reviews.length,
      averageRating: Math.round(averageRating * 10) / 10 // Round to 1 decimal
    });
  }

  // Sort by review count descending
  return outletPerformance.sort((a, b) => b.reviewCount - a.reviewCount);
}

// Fetch sentiment analysis data
export async function fetchSentimentAnalysis(
  merchantId: string,
  timeRange: string = 'last30days'
): Promise<SentimentAnalysis> {
  const { startDate, endDate } = getDateRange(timeRange);
  const startDateIso = startDate.toISOString();
  const endDateIso = endDate.toISOString();

  // For simplicity, we'll categorize based on ratings for now
  // Use sentiment analysis to classify review sentiment
  const { data, error } = await supabase
    .from(TABLES.REVIEW_SESSIONS)
    .select('review_rating')
    .eq('merchant_id', merchantId)
    .eq('review_posted', true)
    .gte('created_at', startDateIso)
    .lte('created_at', endDateIso)
    .not('review_rating', 'is', null);

  if (error) {
    // Handle error fetching sentiment data
    throw new Error('Failed to fetch sentiment data');
  }

  let positive = 0;
  let neutral = 0;
  let negative = 0;

  data.forEach(review => {
    const rating = review.review_rating || 0;
    if (rating >= 4) {
      positive++;
    } else if (rating >= 3) {
      neutral++;
    } else {
      negative++;
    }
  });

  return {
    positive,
    neutral,
    negative
  };
}

// Fetch incentive performance data
export async function fetchIncentivePerformance(
  merchantId: string,
  timeRange: string = 'last30days'
): Promise<IncentivePerformance[]> {
  const { startDate, endDate } = getDateRange(timeRange);
  const startDateIso = startDate.toISOString();
  const endDateIso = endDate.toISOString();

  // Get all incentives for the merchant
  const { data: incentives, error: incentivesError } = await supabase
    .from(TABLES.INCENTIVES)
    .select('id, name')
    .eq('merchant_id', merchantId);

  if (incentivesError) {
    // Handle error fetching incentives
    throw new Error('Failed to fetch incentives');
  }

  // For each incentive, get performance data
  const incentivePerformance: IncentivePerformance[] = [];
  
  for (const incentive of incentives) {
    // Get issued incentives
    const { data: issued, error: issuedError } = await supabase
      .from(TABLES.REVIEW_SESSIONS)
      .select('id')
      .eq('merchant_id', merchantId)
      .eq('incentive_id', incentive.id)
      .gte('created_at', startDateIso)
      .lte('created_at', endDateIso);

    if (issuedError) {
      // Handle error fetching issued incentives
      continue;
    }

    // Get claimed incentives
    const { data: claimed, error: claimedError } = await supabase
      .from(TABLES.REVIEW_SESSIONS)
      .select('id')
      .eq('merchant_id', merchantId)
      .eq('incentive_id', incentive.id)
      .eq('incentive_claimed', true)
      .gte('created_at', startDateIso)
      .lte('created_at', endDateIso);

    if (claimedError) {
      // Handle error fetching claimed incentives
      continue;
    }

    // Calculate conversion rate
    const issuedCount = issued.length;
    const claimedCount = claimed.length;
    const conversionRate = issuedCount > 0 
      ? Math.round((claimedCount / issuedCount) * 100) 
      : 0;

    incentivePerformance.push({
      id: incentive.id,
      name: incentive.name,
      issued: issuedCount,
      claimed: claimedCount,
      conversionRate: conversionRate
    });
  }

  // Sort by issued count descending
  return incentivePerformance.sort((a, b) => b.issued - a.issued);
}

// Fetch customer engagement data
export async function fetchCustomerEngagement(
  merchantId: string,
  timeRange: string = 'last30days'
): Promise<CustomerEngagement[]> {
  const { startDate, endDate } = getDateRange(timeRange);
  const startDateIso = startDate.toISOString();
  const endDateIso = endDate.toISOString();

  // Fetch all review sessions in date range
  const { data, error } = await supabase
    .from(TABLES.REVIEW_SESSIONS)
    .select('device_fingerprint, created_at')
    .eq('merchant_id', merchantId)
    .gte('created_at', startDateIso)
    .lte('created_at', endDateIso)
    .order('created_at', { ascending: true });

  if (error) {
    // Handle error fetching customer engagement data
    throw new Error('Failed to fetch customer engagement data');
  }

  // Get all unique fingerprints in the current range
  const fingerprintsInRange = new Set(data.map(session => session.device_fingerprint));

  // For each date, calculate new vs returning customers
  const dateRange = generateDateRange(startDate, endDate);
  const result: CustomerEngagement[] = [];
  
  // Keep track of all fingerprints seen so far
  const seenFingerprints = new Set<string>();

  for (const date of dateRange) {
    // Get sessions for this date
    const sessionsOnDate = data.filter(session => {
      const sessionDate = new Date(session.created_at).toISOString().split('T')[0];
      return sessionDate === date;
    });
    
    // Count new vs returning customers
    let newCustomers = 0;
    let returningCustomers = 0;
    
    // Create a set of unique fingerprints for this day
    const dayFingerprints = new Set<string>();
    
    sessionsOnDate.forEach(session => {
      const fingerprint = session.device_fingerprint;
      
      // Only count each unique fingerprint once per day
      if (!dayFingerprints.has(fingerprint)) {
        dayFingerprints.add(fingerprint);
        
        // Check if we've seen this fingerprint before
        if (seenFingerprints.has(fingerprint)) {
          returningCustomers++;
        } else {
          newCustomers++;
          seenFingerprints.add(fingerprint);
        }
      }
    });
    
    result.push({
      date,
      newCustomers,
      returningCustomers
    });
  }
  
  return result;
}

// Function to export analytics data as CSV
export function exportToCSV<T>(data: T[], filename: string): void {
  if (data.length === 0) {
    // Handle case when there's no data to export
    return;
  }
  
  // Get headers from first data item
  const headers = Object.keys(data[0]);
  
  // Create CSV rows
  const csvRows = [
    headers.join(','), // Header row
    ...data.map(row => 
      headers.map(header => {
        // Wrap value in quotes if it contains comma
        const value = row[header] !== undefined && row[header] !== null ? String(row[header]) : '';
        return value.includes(',') ? `"${value}"` : value;
      }).join(',')
    )
  ];
  
  // Create CSV content
  const csvContent = csvRows.join('\n');
  
  // Create download link
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  
  // Create link element
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `${filename}-${new Date().toISOString().slice(0, 10)}.csv`);
  document.body.appendChild(link);
  
  // Trigger download and clean up
  link.click();
  document.body.removeChild(link);
}