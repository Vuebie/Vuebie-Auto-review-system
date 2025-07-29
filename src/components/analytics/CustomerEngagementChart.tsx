import React from 'react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';
import { chartColors, formatDate } from './ChartUtils';

interface EngagementData {
  date: string;
  newCustomers: number;
  returningCustomers: number;
}

interface CustomerEngagementChartProps {
  data: EngagementData[];
  height?: number | string;
}

export default function CustomerEngagementChart({
  data,
  height = 350
}: CustomerEngagementChartProps) {
  // Format X-axis ticks
  const formatXAxis = (dateStr: string) => {
    return formatDate(dateStr, 'short');
  };

  return (
    <ResponsiveContainer width="100%" height={height}>
      <AreaChart
        data={data}
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
          labelFormatter={(label) => formatDate(label, 'long')}
          contentStyle={{ 
            backgroundColor: chartColors.background,
            borderColor: chartColors.border,
            borderRadius: '6px'
          }}
        />
        <Legend />
        <Area
          type="monotone"
          dataKey="newCustomers"
          name="New Customers"
          stackId="1"
          stroke={chartColors.primary}
          fill={chartColors.primaryLight}
          fillOpacity={0.6}
        />
        <Area
          type="monotone"
          dataKey="returningCustomers"
          name="Returning Customers"
          stackId="1"
          stroke={chartColors.secondary}
          fill={chartColors.secondaryLight}
          fillOpacity={0.6}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}