import React from 'react';
import { chartColors } from './ChartUtils';

interface LeaderboardItem {
  id: string;
  name: string;
  value: number;
  secondaryValue?: number;
  change?: number;
  icon?: React.ReactNode;
}

interface PerformanceLeaderboardProps {
  items: LeaderboardItem[];
  title: string;
  valueLabel: string;
  secondaryValueLabel?: string;
  maxItems?: number;
  showTrend?: boolean;
  formatValue?: (value: number) => string;
  formatSecondaryValue?: (value: number) => string;
}

export default function PerformanceLeaderboard({
  items,
  title,
  valueLabel,
  secondaryValueLabel,
  maxItems = 5,
  showTrend = false,
  formatValue = (val) => val.toString(),
  formatSecondaryValue = (val) => val.toString(),
}: PerformanceLeaderboardProps) {
  const displayItems = items.slice(0, maxItems);
  const maxValue = Math.max(...items.map(item => item.value));

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h3 className="text-lg font-semibold text-gray-800 mb-4">{title}</h3>
      
      <div className="space-y-4">
        {displayItems.map((item, index) => (
          <div key={item.id} className="flex items-center">
            <div className="flex-shrink-0 w-8 text-center">
              <span className={`
                w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium
                ${index === 0 ? 'bg-yellow-100 text-yellow-800' : 
                 index === 1 ? 'bg-gray-100 text-gray-800' : 
                 index === 2 ? 'bg-amber-100 text-amber-800' : 
                 'bg-gray-50 text-gray-600'}
              `}>
                {index + 1}
              </span>
            </div>
            
            <div className="ml-2 flex-grow">
              <div className="flex items-center">
                {item.icon && <span className="mr-2">{item.icon}</span>}
                <span className="text-sm font-medium text-gray-900 truncate" title={item.name}>
                  {item.name}
                </span>
              </div>
              
              <div className="mt-1 w-full bg-gray-100 rounded-full h-2">
                <div
                  className="bg-blue-500 h-2 rounded-full"
                  style={{ width: `${(item.value / maxValue) * 100}%` }}
                ></div>
              </div>
            </div>
            
            <div className="flex-shrink-0 ml-4 text-right">
              <div className="text-sm font-medium text-gray-900">
                {formatValue(item.value)} <span className="text-xs text-gray-500">{valueLabel}</span>
              </div>
              
              {secondaryValueLabel && item.secondaryValue !== undefined && (
                <div className="text-xs text-gray-500">
                  {formatSecondaryValue(item.secondaryValue)} {secondaryValueLabel}
                </div>
              )}
              
              {showTrend && item.change !== undefined && (
                <div className={`text-xs ${item.change > 0 ? 'text-green-600' : item.change < 0 ? 'text-red-600' : 'text-gray-500'}`}>
                  {item.change > 0 ? '↑' : item.change < 0 ? '↓' : '–'} {Math.abs(item.change)}%
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
      
      {items.length > maxItems && (
        <div className="mt-4 pt-3 border-t border-gray-100 text-center">
          <span className="text-sm text-gray-500">
            +{items.length - maxItems} more
          </span>
        </div>
      )}
    </div>
  );
}