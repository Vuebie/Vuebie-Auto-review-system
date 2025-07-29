import React from 'react';
import { useTranslation } from 'react-i18next';

interface TimeRangeSelectorProps {
  value: string;
  onChange: (value: string) => void;
}

export default function TimeRangeSelector({ value, onChange }: TimeRangeSelectorProps) {
  const { t } = useTranslation();
  
  const timeRanges = [
    { id: 'last7days', label: t('analytics.timeRanges.last7days') },
    { id: 'last30days', label: t('analytics.timeRanges.last30days') },
    { id: 'last90days', label: t('analytics.timeRanges.last90days') },
    { id: 'lastYear', label: t('analytics.timeRanges.lastYear') },
    { id: 'allTime', label: t('analytics.timeRanges.allTime') }
  ];

  return (
    <div className="flex items-center">
      <label htmlFor="timeRange" className="mr-3 text-sm font-medium text-gray-700">
        {t('analytics.timeRange')}:
      </label>
      <select
        id="timeRange"
        name="timeRange"
        className="block w-full rounded-md border-gray-300 py-2 pl-3 pr-10 text-sm focus:border-primary-500 focus:outline-none focus:ring-primary-500"
        value={value}
        onChange={(e) => onChange(e.target.value)}
      >
        {timeRanges.map((range) => (
          <option key={range.id} value={range.id}>
            {range.label}
          </option>
        ))}
      </select>
    </div>
  );
}