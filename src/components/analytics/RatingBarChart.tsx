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
import { chartColors } from './ChartUtils';

interface RatingBarChartProps {
  data: number[];
  height?: number | string;
}

export default function RatingBarChart({ data, height = 350 }: RatingBarChartProps) {
  // Transform data for the chart
  const chartData = data.map((count, index) => ({
    rating: `${index + 1} ${index + 1 === 1 ? 'Star' : 'Stars'}`,
    count,
    fill: getRatingColor(index + 1),
  }));

  // Generate color based on rating (1-5)
  function getRatingColor(rating: number): string {
    switch (rating) {
      case 1:
        return chartColors.danger;
      case 2:
        return chartColors.warning;
      case 3:
        return chartColors.muted;
      case 4:
        return chartColors.primaryLight;
      case 5:
        return chartColors.success;
      default:
        return chartColors.primary;
    }
  }

  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart
        data={chartData}
        margin={{
          top: 20,
          right: 30,
          left: 20,
          bottom: 5,
        }}
      >
        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={chartColors.border} />
        <XAxis 
          dataKey="rating"
          tick={{ fill: chartColors.muted, fontSize: 12 }}
          axisLine={{ stroke: chartColors.border }}
          tickLine={{ stroke: chartColors.border }}
        />
        <YAxis 
          tick={{ fill: chartColors.muted, fontSize: 12 }}
          axisLine={{ stroke: chartColors.border }}
          tickLine={{ stroke: chartColors.border }}
        />
        <Tooltip
          formatter={(value) => [`${value} reviews`, 'Reviews']}
          contentStyle={{ 
            backgroundColor: chartColors.background,
            borderColor: chartColors.border,
            borderRadius: '6px'
          }}
        />
        <Legend />
        <Bar 
          dataKey="count" 
          name="Reviews" 
          fill={chartColors.primary}
          radius={[4, 4, 0, 0]}
          barSize={50}
        />
      </BarChart>
    </ResponsiveContainer>
  );
}