# Permission Monitoring Dashboard User Guide

## Overview

The Permission Monitoring Dashboard provides real-time insights into the performance and security of the Vuebie V2 permission system. It allows administrators to track metrics related to permission checks, cache performance, role management, security events, and edge function performance.

## Dashboard Features

### Time Range Selection

At the top of the dashboard, you can select different time ranges to view metrics for:
- Last 24 Hours
- Last 7 Days
- Last 30 Days
- Last 90 Days

Use the "Refresh" button to manually update the data at any time.

### Summary Cards

The dashboard shows five summary cards at the top for quick insights:

1. **Cache Performance**: Shows the cache hit ratio and total hits/misses
2. **Permission Checks**: Displays the success rate for permission checks
3. **Role Management**: Shows the total number of role assignments and removals
4. **Security Events**: Indicates the number of unauthorized access attempts
5. **Edge Functions**: Shows average function latency and total calls/errors

### Detailed Metrics Tabs

Click on any of the tabs below the summary cards to view detailed metrics for each category:

#### Cache Performance

- Line chart showing cache hits and misses over time
- Pie chart showing the distribution between hits and misses
- Additional metrics like cache hit ratio and total cache requests

#### Permission Checks

- Line chart showing successful vs. denied permission checks over time
- Check results distribution chart
- Latency tracking for permission checks

#### Role Management

- Bar chart showing role assignments and removals over time
- Role change distribution metrics

#### Security Events

- Line chart tracking unauthorized access attempts over time
- Security alerts and notices based on detected events

#### Edge Functions

- Performance tracking for edge functions
- Error rate monitoring
- Latency trends over the selected time period

#### Alerts

- List of security and performance alerts
- Severity indicators (low, medium, high, critical)
- Ability to acknowledge alerts

## How to Use

1. **Access the Dashboard**: Navigate to the Monitoring section in the Vuebie V2 admin panel
2. **Select Time Range**: Choose the desired time period from the dropdown
3. **Review Summary Cards**: Get a quick overview of system performance
4. **Explore Detailed Metrics**: Click on tabs to view in-depth data for each category
5. **Acknowledge Alerts**: Review and acknowledge any pending alerts

## Performance Metrics Explained

### Cache Hit Ratio

The cache hit ratio indicates how often permission data is served from cache vs. being fetched from the database. A higher ratio means better performance.

- **Good**: >90%
- **Acceptable**: 70-90%
- **Needs Investigation**: <70%

### Permission Check Success Rate

This metric shows what percentage of permission checks are successful. A lower success rate might indicate either security issues or permission configuration problems.

- **Normal**: >95%
- **Investigate**: 90-95%
- **Potential Issue**: <90%

### Edge Function Performance

Edge functions should maintain low latency for optimal performance.

- **Good**: <50ms
- **Acceptable**: 50-100ms
- **Needs Optimization**: >100ms

## Setting Up Mock Data

For development and testing purposes, you can populate the metrics tables with sample data:

1. Connect to your Supabase database
2. Run the SQL script located at `/workspace/vuebie-v2/src/lib/permission_metrics_mock_data.sql`
3. Refresh the dashboard to see the sample data

## Troubleshooting

If the dashboard shows no data:

1. Verify that the permission monitoring service is properly configured
2. Check that the required Supabase tables exist
3. Ensure your user account has the necessary permissions to view the monitoring data
4. Check browser console for any JavaScript errors

For persistent issues, please contact the system administrator or refer to the technical documentation.