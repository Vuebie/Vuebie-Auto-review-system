import React from 'react';
import { formatNumber, formatDate } from './ChartUtils';

import { MetricData } from '../../lib/analytics.d';

interface MetricSummaryTableProps {
  data: MetricData[];
  columns: {
    id: string;
    header: string;
    cell: (value: number | string) => React.ReactNode;
    sortable?: boolean;
  }[];
  initialSortField?: string;
  emptyMessage?: string;
}

export default function MetricSummaryTable({
  data,
  columns,
  initialSortField = columns[0]?.id,
  emptyMessage = 'No data available'
}: MetricSummaryTableProps) {
  const [sortField, setSortField] = React.useState<string>(initialSortField);
  const [sortDirection, setSortDirection] = React.useState<'asc' | 'desc'>('desc');

  const handleSort = (field: string) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
  };

  const sortedData = React.useMemo(() => {
    if (!data.length) return [];

    return [...data].sort((a, b) => {
      const aValue = a.metrics[sortField] || 0;
      const bValue = b.metrics[sortField] || 0;

      if (typeof aValue === 'string' && typeof bValue === 'string') {
        return sortDirection === 'asc' 
          ? aValue.localeCompare(bValue) 
          : bValue.localeCompare(aValue);
      }

      return sortDirection === 'asc' 
        ? Number(aValue) - Number(bValue) 
        : Number(bValue) - Number(aValue);
    });
  }, [data, sortField, sortDirection]);

  if (!data.length) {
    return (
      <div className="py-12 text-center border rounded-md">
        <p className="text-gray-500">{emptyMessage}</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Name
            </th>
            {columns.map((column) => (
              <th 
                key={column.id}
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                onClick={column.sortable ? () => handleSort(column.id) : undefined}
                style={{ cursor: column.sortable ? 'pointer' : 'default' }}
              >
                <div className="flex items-center">
                  {column.header}
                  {column.sortable && sortField === column.id && (
                    <span className="ml-2">
                      {sortDirection === 'asc' ? '↑' : '↓'}
                    </span>
                  )}
                </div>
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {sortedData.map((item) => (
            <tr key={item.id}>
              <td className="px-6 py-4 whitespace-nowrap">
                <div className="text-sm font-medium text-gray-900">
                  {item.name}
                </div>
              </td>
              {columns.map((column) => (
                <td key={column.id} className="px-6 py-4 whitespace-nowrap">
                  {column.cell(item.metrics[column.id])}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}