import React from 'react';
import { render, screen } from '@testing-library/react';
import { CacheMetricsCard } from '../../../../components/monitoring';

// Mock data for testing
const mockCacheData = [
  { timestamp: '2025-07-25T10:00:00Z', hits: 250, misses: 50 },
  { timestamp: '2025-07-25T11:00:00Z', hits: 300, misses: 45 },
  { timestamp: '2025-07-25T12:00:00Z', hits: 275, misses: 40 },
];

describe('CacheMetricsCard', () => {
  test('renders loading state when loading is true', () => {
    render(<CacheMetricsCard data={[]} loading={true} />);
    
    // Check that the loading spinner is shown
    expect(document.querySelector('.animate-spin')).toBeInTheDocument();
    expect(screen.getByText('Cache Performance')).toBeInTheDocument();
  });

  test('renders cache metrics correctly when data is provided', () => {
    render(<CacheMetricsCard data={mockCacheData} loading={false} />);
    
    // Calculate expected values
    const totalHits = mockCacheData.reduce((sum, item) => sum + item.hits, 0); // 825
    const totalMisses = mockCacheData.reduce((sum, item) => sum + item.misses, 0); // 135
    const ratio = ((totalHits / (totalHits + totalMisses)) * 100).toFixed(1); // 85.9%
    
    // Check that the metrics are displayed correctly
    expect(screen.getByText('Cache Performance')).toBeInTheDocument();
    expect(screen.getByText(`${ratio}%`)).toBeInTheDocument();
    expect(screen.getByText(`Hits: ${totalHits.toLocaleString()} | Misses: ${totalMisses.toLocaleString()}`)).toBeInTheDocument();
  });

  test('renders detailed view when detailed prop is true', () => {
    render(<CacheMetricsCard data={mockCacheData} loading={false} detailed={true} />);
    
    // Check that the chart is rendered in detailed mode
    expect(document.querySelector('svg')).toBeInTheDocument();
  });

  test('handles empty data gracefully', () => {
    render(<CacheMetricsCard data={[]} loading={false} />);
    
    // Should show 0% for ratio and 0 for hits and misses
    expect(screen.getByText('0.0%')).toBeInTheDocument();
    expect(screen.getByText('Hits: 0 | Misses: 0')).toBeInTheDocument();
  });
});