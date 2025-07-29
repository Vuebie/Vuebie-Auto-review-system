import React from 'react';
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';
import { chartColors } from './ChartUtils';

interface SentimentAnalysisChartProps {
  data: {
    positive: number;
    neutral: number;
    negative: number;
  };
  height?: number | string;
}

export default function SentimentAnalysisChart({
  data,
  height = 350
}: SentimentAnalysisChartProps) {
  const chartData = [
    { name: 'Positive', value: data.positive, color: chartColors.success },
    { name: 'Neutral', value: data.neutral, color: chartColors.muted },
    { name: 'Negative', value: data.negative, color: chartColors.danger }
  ];
  
  const totalReviews = data.positive + data.neutral + data.negative;

  const RADIAN = Math.PI / 180;
  const renderCustomizedLabel = ({ 
    cx, 
    cy, 
    midAngle, 
    innerRadius, 
    outerRadius, 
    percent 
  }: {
    cx: number;
    cy: number;
    midAngle: number;
    innerRadius: number;
    outerRadius: number;
    percent: number;
  }) => {
    const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
    const x = cx + radius * Math.cos(-midAngle * RADIAN);
    const y = cy + radius * Math.sin(-midAngle * RADIAN);

    return percent > 0.05 ? (
      <text
        x={x}
        y={y}
        fill="white"
        textAnchor="middle"
        dominantBaseline="central"
        fontSize={14}
        fontWeight="bold"
      >
        {`${(percent * 100).toFixed(0)}%`}
      </text>
    ) : null;
  };

  return (
    <ResponsiveContainer width="100%" height={height}>
      <PieChart>
        <Pie
          data={chartData}
          cx="50%"
          cy="50%"
          labelLine={false}
          label={renderCustomizedLabel}
          outerRadius={140}
          innerRadius={80}
          dataKey="value"
        >
          {chartData.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={entry.color} />
          ))}
        </Pie>
        <Tooltip
          formatter={(value) => [
            `${value} reviews (${((value as number / totalReviews) * 100).toFixed(1)}%)`,
            'Reviews'
          ]}
          contentStyle={{ 
            backgroundColor: chartColors.background,
            borderColor: chartColors.border,
            borderRadius: '6px'
          }}
        />
        <Legend />
      </PieChart>
    </ResponsiveContainer>
  );
}