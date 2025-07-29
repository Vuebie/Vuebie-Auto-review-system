/**
 * Chart utilities and common formatting functions for analytics components
 */

// Common chart colors
export const chartColors = {
  primary: '#3b82f6', // Blue
  primaryLight: '#93c5fd',
  secondary: '#6366f1', // Indigo
  secondaryLight: '#a5b4fc',
  success: '#22c55e', // Green
  successLight: '#86efac',
  danger: '#ef4444', // Red
  dangerLight: '#fca5a5',
  warning: '#f97316', // Orange
  warningLight: '#fdba74',
  info: '#06b6d4', // Cyan
  infoLight: '#67e8f9',
  muted: '#9ca3af', // Gray
  border: '#e5e7eb',
  background: '#ffffff',
  gridLines: '#f3f4f6'
};

// Date formatting functions
export function formatDate(dateStr: string, format: 'short' | 'long' | 'month' = 'short'): string {
  const date = new Date(dateStr);
  
  if (format === 'short') {
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric'
    }).format(date);
  } else if (format === 'month') {
    return new Intl.DateTimeFormat('en-US', {
      month: 'short'
    }).format(date);
  } else {
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    }).format(date);
  }
}

// Calculate date range based on time range selection
export function getDateRange(timeRange: string): { startDate: Date, endDate: Date } {
  const endDate = new Date();
  endDate.setHours(23, 59, 59, 999); // End of day
  
  const startDate = new Date();
  
  switch (timeRange) {
    case 'last7days':
      startDate.setDate(endDate.getDate() - 7);
      break;
    case 'last30days':
      startDate.setDate(endDate.getDate() - 30);
      break;
    case 'last90days':
      startDate.setDate(endDate.getDate() - 90);
      break;
    case 'lastYear':
      startDate.setFullYear(endDate.getFullYear() - 1);
      break;
    case 'allTime':
      startDate.setFullYear(2020); // Arbitrary starting point
      break;
    default:
      startDate.setDate(endDate.getDate() - 30); // Default to last 30 days
  }
  
  startDate.setHours(0, 0, 0, 0); // Start of day
  
  return { startDate, endDate };
}

// Generate an array of all dates between two dates
export function generateDateRange(startDate: Date, endDate: Date): string[] {
  const dates: string[] = [];
  const currentDate = new Date(startDate);
  
  // Clone the dates to avoid modifying the originals
  const start = new Date(startDate);
  const end = new Date(endDate);
  
  // Set the hours to ensure proper comparison
  start.setHours(0, 0, 0, 0);
  end.setHours(23, 59, 59, 999);
  
  while (currentDate <= end) {
    dates.push(currentDate.toISOString().split('T')[0]);
    currentDate.setDate(currentDate.getDate() + 1);
  }
  
  return dates;
}

// Format number with K/M/B suffix for large numbers
export function formatNumber(num: number): string {
  if (num === null || num === undefined) return '0';
  
  if (num >= 1000000000) {
    return (num / 1000000000).toFixed(1) + 'B';
  }
  
  if (num >= 1000000) {
    return (num / 1000000).toFixed(1) + 'M';
  }
  
  if (num >= 1000) {
    return (num / 1000).toFixed(1) + 'K';
  }
  
  return num.toString();
}

// Calculate percentage change between two values
export function calculatePercentageChange(current: number, previous: number): number {
  if (previous === 0) {
    return current > 0 ? 100 : 0;
  }
  
  return Math.round(((current - previous) / previous) * 100);
}

// Generate gradient for area charts
export function createGradient(ctx: CanvasRenderingContext2D, color: string): CanvasGradient {
  const gradient = ctx.createLinearGradient(0, 0, 0, ctx.canvas.height);
  gradient.addColorStop(0, color + '99'); // Add alpha
  gradient.addColorStop(1, color + '00'); // Transparent
  return gradient;
}

// Format money values with currency symbol
export function formatCurrency(value: number, currency: string = 'USD'): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency,
  }).format(value);
}

// Convert hex color to rgba for transparency
export function hexToRgba(hex: string, alpha: number = 1): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

// Format duration in milliseconds to human-readable format
export function formatDuration(milliseconds: number): string {
  const seconds = Math.floor(milliseconds / 1000);
  
  if (seconds < 60) {
    return `${seconds}s`;
  }
  
  const minutes = Math.floor(seconds / 60);
  
  if (minutes < 60) {
    return `${minutes}m ${seconds % 60}s`;
  }
  
  const hours = Math.floor(minutes / 60);
  
  if (hours < 24) {
    return `${hours}h ${minutes % 60}m`;
  }
  
  const days = Math.floor(hours / 24);
  return `${days}d ${hours % 24}h`;
}