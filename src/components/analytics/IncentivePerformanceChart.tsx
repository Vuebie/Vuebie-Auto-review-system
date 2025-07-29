import React from 'react';
import {
  ComposedChart,
  Line,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';
import { chartColors } from './ChartUtils';

interface IncentiveData {
  name: string;
  issued: number;
  claimed: number;
  conversionRate: number;
}

interface IncentivePerformanceChartProps {
  data: IncentiveData[];
  height?: number | string;
}

export default function IncentivePerformanceChart({
  data,
  height = 350
}: IncentivePerformanceChartProps) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <ComposedChart
        data={data}
        margin={{
          top: 20,
          right: 30,
          left: 20,
          bottom: 60,
        }}
      >
        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={chartColors.border} />
        <XAxis
          dataKey="name"
          tick={{ fill: chartColors.muted, fontSize: 12 }}
          angle={-45}
          textAnchor="end"
          height={70}
          axisLine={{ stroke: chartColors.border }}
          tickLine={{ stroke: chartColors.border }}
        />
        <YAxis 
          yAxisId="left"
          tick={{ fill: chartColors.muted, fontSize: 12 }}
          axisLine={{ stroke: chartColors.border }}
          tickLine={{ stroke: chartColors.border }}
        />
        <YAxis
          yAxisId="right"
          orientation="right"
          domain={[0, 100]}
          tickFormatter={(value) => `${value}%`}
          tick={{ fill: chartColors.muted, fontSize: 12 }}
          axisLine={{ stroke: chartColors.border }}
          tickLine={{ stroke: chartColors.border }}
        />
        <Tooltip
          formatter={(value, name) => {
            if (name === 'conversionRate') return [`${value}%`, 'Conversion Rate'];
            if (name === 'issued') return [value, 'Issued'];
            if (name === 'claimed') return [value, 'Claimed'];
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
          yAxisId="left"
          dataKey="issued" 
          name="Issued"
          fill={chartColors.primary} 
          radius={[4, 4, 0, 0]}
          barSize={25}
        />
        <Bar
          yAxisId="left"
          dataKey="claimed"
          name="Claimed"
          fill={chartColors.secondary}
          radius={[4, 4, 0, 0]}
          barSize={25}
        />
        <Line
          yAxisId="right"
          type="monotone"
          dataKey="conversionRate"
          name="Conversion Rate"
          stroke={chartColors.success}
          strokeWidth={2}
          dot={{ r: 4, fill: chartColors.success, stroke: chartColors.success }}
          activeDot={{ r: 6, fill: chartColors.success, stroke: chartColors.background, strokeWidth: 2 }}
        />
      </ComposedChart>
    </ResponsiveContainer>
  );
}