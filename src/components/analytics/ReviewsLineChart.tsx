import React, { useMemo } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';
import { formatDate, chartColors } from './ChartUtils';

interface ReviewsLineChartProps {
  data: Array<{ date: string; count: number }>;
  comparisonData?: Array<{ date: string; count: number }>;
  showComparison?: boolean;
  height?: number | string;
}

export default function ReviewsLineChart({
  data,
  comparisonData,
  showComparison = false,
  height = 350
}: ReviewsLineChartProps) {
  // Format data for the chart
  const chartData = useMemo(() => {
    const dateMap = new Map<string, { date: string; reviews: number; comparisonReviews?: number }>();

    // Process main data
    data.forEach(item => {
      dateMap.set(item.date, {
        date: item.date,
        reviews: item.count,
      });
    });

    // Process comparison data if available
    if (showComparison && comparisonData) {
      comparisonData.forEach(item => {
        const existingEntry = dateMap.get(item.date);
        if (existingEntry) {
          dateMap.set(item.date, {
            ...existingEntry,
            comparisonReviews: item.count
          });
        } else {
          dateMap.set(item.date, {
            date: item.date,
            reviews: 0,
            comparisonReviews: item.count
          });
        }
      });
    }

    // Convert the map to an array and sort by date
    return Array.from(dateMap.values())
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  }, [data, comparisonData, showComparison]);

  // Custom tooltip formatter
  const formatTooltip = (value: number, name: string) => {
    const formattedName = name === 'reviews' ? 'Reviews' : 'Previous Period';
    return [value, formattedName];
  };

  // Format X-axis ticks
  const formatXAxis = (dateStr: string) => {
    return formatDate(dateStr, 'short');
  };

  return (
    <ResponsiveContainer width="100%" height={height}>
      <LineChart
        data={chartData}
        margin={{
          top: 10,
          right: 30,
          left: 0,
          bottom: 10,
        }}
      >
        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={chartColors.border} />
        <XAxis 
          dataKey="date" 
          tick={{ fill: chartColors.muted, fontSize: 12 }}
          tickFormatter={formatXAxis}
          axisLine={{ stroke: chartColors.border }}
          tickLine={{ stroke: chartColors.border }}
        />
        <YAxis 
          tick={{ fill: chartColors.muted, fontSize: 12 }}
          axisLine={{ stroke: chartColors.border }}
          tickLine={{ stroke: chartColors.border }}
        />
        <Tooltip 
          formatter={formatTooltip}
          labelFormatter={(label) => formatDate(label, 'long')}
          contentStyle={{ 
            backgroundColor: chartColors.background,
            borderColor: chartColors.border,
            borderRadius: '6px'
          }}
        />
        <Legend />
        <Line
          type="monotone"
          dataKey="reviews"
          name="Reviews"
          stroke={chartColors.primary}
          strokeWidth={2}
          dot={{ r: 3, fill: chartColors.primary, stroke: chartColors.primary }}
          activeDot={{ r: 6, fill: chartColors.primary, stroke: chartColors.background, strokeWidth: 2 }}
        />
        {showComparison && (
          <Line
            type="monotone"
            dataKey="comparisonReviews"
            name="Previous Period"
            stroke={chartColors.secondary}
            strokeWidth={2}
            strokeDasharray="5 5"
            dot={{ r: 3, fill: chartColors.secondary, stroke: chartColors.secondary }}
            activeDot={{ r: 6, fill: chartColors.secondary, stroke: chartColors.background, strokeWidth: 2 }}
          />
        )}
      </LineChart>
    </ResponsiveContainer>
  );
}