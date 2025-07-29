import React from 'react';
import { ArrowUpIcon, ArrowDownIcon, MinusIcon } from '@radix-ui/react-icons';
import { calculatePercentageChange } from './ChartUtils';

interface ComparisonCardProps {
  title: string;
  currentValue: number;
  previousValue: number;
  valueFormatter?: (value: number) => string;
  isPercentage?: boolean;
  inverseColors?: boolean;
  icon?: React.ReactNode;
}

export default function ComparisonCard({
  title,
  currentValue,
  previousValue,
  valueFormatter = (value) => value.toString(),
  isPercentage = false,
  inverseColors = false,
  icon
}: ComparisonCardProps) {
  const percentChange = calculatePercentageChange(currentValue, previousValue);
  const isPositiveChange = percentChange > 0;
  const isNeutralChange = percentChange === 0;
  
  // Determine color based on change direction and whether inverse colors should be used
  // For some metrics like "average response time", a decrease is actually positive
  const isPositiveOutcome = inverseColors ? !isPositiveChange : isPositiveChange;
  
  const getTrendColor = () => {
    if (isNeutralChange) return 'text-gray-500';
    return isPositiveOutcome ? 'text-green-600' : 'text-red-600';
  };

  const getTrendBgColor = () => {
    if (isNeutralChange) return 'bg-gray-100';
    return isPositiveOutcome ? 'bg-green-50' : 'bg-red-50';
  };

  const getTrendIcon = () => {
    if (isNeutralChange) {
      return <MinusIcon className="h-4 w-4" />;
    }
    
    return isPositiveChange ? 
      <ArrowUpIcon className="h-4 w-4" /> : 
      <ArrowDownIcon className="h-4 w-4" />;
  };

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-medium text-gray-500">{title}</p>
          <p className="mt-2 text-3xl font-semibold text-gray-900">
            {valueFormatter(currentValue)}
          </p>
        </div>
        {icon && (
          <div className="p-2 bg-blue-50 rounded-md">
            {icon}
          </div>
        )}
      </div>
      
      <div className="mt-4 flex items-center">
        <span className={`inline-flex items-center px-2 py-0.5 rounded text-sm font-medium ${getTrendColor()} ${getTrendBgColor()}`}>
          {getTrendIcon()}
          <span className="ml-1">
            {Math.abs(percentChange)}%
          </span>
        </span>
        <span className="text-sm text-gray-500 ml-2">
          vs. previous period
        </span>
      </div>
      
      <div className="mt-1 text-sm text-gray-500">
        Previous: {valueFormatter(previousValue)}
      </div>
    </div>
  );
}