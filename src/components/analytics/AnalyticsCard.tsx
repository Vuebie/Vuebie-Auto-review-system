import React, { ReactNode } from 'react';

interface AnalyticsCardProps {
  title: string;
  value: string | number;
  icon?: ReactNode;
  trend?: {
    value: number;
    label: string;
  };
  className?: string;
}

export default function AnalyticsCard({ 
  title, 
  value, 
  icon, 
  trend, 
  className = '' 
}: AnalyticsCardProps) {
  const isPositive = trend && trend.value >= 0;
  
  return (
    <div className={`p-6 bg-white rounded-lg shadow border border-gray-100 ${className}`}>
      <div className="flex justify-between items-start">
        <div>
          <h3 className="text-sm font-medium text-gray-500">{title}</h3>
          <p className="mt-2 text-3xl font-semibold text-gray-900">{value}</p>
        </div>
        {icon && (
          <div className="p-2 rounded-md bg-primary-50">
            {icon}
          </div>
        )}
      </div>
      
      {trend && (
        <div className="mt-4 flex items-center">
          <span className={`inline-flex items-center px-2 py-0.5 rounded text-sm ${
            isPositive ? 'text-green-800 bg-green-100' : 'text-red-800 bg-red-100'
          }`}>
            <svg 
              className={`-ml-1 mr-0.5 h-4 w-4 ${isPositive ? 'text-green-500' : 'text-red-500'}`} 
              fill="currentColor" 
              viewBox="0 0 20 20" 
              xmlns="http://www.w3.org/2000/svg"
            >
              <path 
                fillRule="evenodd" 
                d={isPositive 
                  ? "M5.293 9.707a1 1 0 010-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 01-1.414 1.414L11 7.414V15a1 1 0 11-2 0V7.414L6.707 9.707a1 1 0 01-1.414 0z" 
                  : "M14.707 10.293a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 111.414-1.414L9 12.586V5a1 1 0 012 0v7.586l2.293-2.293a1 1 0 011.414 0z"
                } 
                clipRule="evenodd" 
              />
            </svg>
            <span>{isPositive ? '+' : ''}{trend.value}%</span>
          </span>
          <span className="text-gray-500 text-sm ml-2">{trend.label}</span>
        </div>
      )}
    </div>
  );
}