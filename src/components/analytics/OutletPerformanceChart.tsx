import React from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';
import { chartColors, formatNumber } from './ChartUtils';

interface OutletData {
  id: string;
  name: string;
  reviewCount: number;
  averageRating: number;
}

interface OutletPerformanceChartProps {
  data: OutletData[];
  sortBy?: 'reviewCount' | 'averageRating';
  limit?: number;
  height?: number | string;
}

export default function OutletPerformanceChart({
  data,
  sortBy = 'reviewCount',
  limit = 10,
  height = 350
}: OutletPerformanceChartProps) {
  // Transform and sort data for the chart
  const chartData = [...data]
    .sort((a, b) => {
      if (sortBy === 'reviewCount') {
        return b.reviewCount - a.reviewCount;
      } else {
        return b.averageRating - a.averageRating;
      }
    })
    .slice(0, limit)
    .map(outlet => ({
      name: outlet.name,
      reviews: outlet.reviewCount,
      rating: outlet.averageRating
    }));

  // Determine if we're showing enough outlets to need scrolling
  const needsScroll = data.length > 5;

  return (
    <ResponsiveContainer 
      width="100%" 
      height={height}
    >
      <BarChart
        data={chartData}
        layout="vertical"
        margin={{
          top: 20,
          right: 30,
          left: 100,
          bottom: 5,
        }}
      >
        <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke={chartColors.border} />
        <XAxis 
          type="number"
          tick={{ fill: chartColors.muted, fontSize: 12 }}
          axisLine={{ stroke: chartColors.border }}
          tickLine={{ stroke: chartColors.border }}
        />
        <YAxis 
          dataKey="name"
          type="category"
          tick={{ fill: chartColors.muted, fontSize: 12 }}
          axisLine={{ stroke: chartColors.border }}
          tickLine={{ stroke: chartColors.border }}
          width={90}
        />
        <Tooltip
          formatter={(value, name) => {
            if (name === 'reviews') return [formatNumber(value as number), 'Reviews'];
            if (name === 'rating') return [value, 'Avg. Rating'];
            return [value, name];
          }}
          contentStyle={{ 
            backgroundColor: chartColors.background,
            borderColor: chartColors.border,
            borderRadius: '6px'
          }}
        />
        <Legend />
        <Bar 
          dataKey="reviews" 
          name="Reviews" 
          fill={chartColors.primary}
          radius={[0, 4, 4, 0]}
          barSize={20} 
        />
        <Bar 
          dataKey="rating" 
          name="Avg. Rating" 
          fill={chartColors.secondary}
          radius={[0, 4, 4, 0]}
          barSize={20}
        />
      </BarChart>
    </ResponsiveContainer>
  );
}