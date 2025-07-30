import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase-client';
import { 
  Card, CardContent, CardDescription, CardHeader, CardTitle 
} from '@/components/ui/card';
import { 
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow 
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  AlertTriangle, Search, RefreshCw, Download, Shield, Activity,
  Database, Server, Clock, XCircle, CheckCircle, Info, HardDrive
} from 'lucide-react';
import { 
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';
import { ChartContainer, AreaChart, BarChart } from '@/components/ui/charts';

interface SecurityEvent {
  id: string;
  created_at: string;
  event_type: string;
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  user_id: string | null;
  ip_address: string | null;
  description: string;
  metadata: Record<string, unknown>;
}

interface SystemMetric {
  id: string;
  timestamp: string;
  metric_name: string;
  metric_value: number;
  category: string;
  unit: string;
}

interface ApiEndpoint {
  path: string;
  method: string;
  avg_response_time: number;
  requests_per_minute: number;
  error_rate: number;
  p95_response_time: number;
}

const SystemMonitoring: React.FC = () => {
  const [activeTab, setActiveTab] = useState('security');
  const [loading, setLoading] = useState(true);
  const [securityEvents, setSecurityEvents] = useState<SecurityEvent[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [severityFilter, setSeverityFilter] = useState<string | null>(null);
  const [systemMetrics, setSystemMetrics] = useState<SystemMetric[]>([]);
  const [apiPerformance, setApiPerformance] = useState<ApiEndpoint[]>([]);
  
  useEffect(() => {
    fetchData();
    
    // Set up real-time subscription for critical security events
    const subscription = supabase
      .channel('security_events_channel')
      .on('postgres_changes', 
        { 
          event: 'INSERT', 
          schema: 'public', 
          table: 'security_events' 
        }, 
        payload => {
          // Add new event to the list
          const newEvent = payload.new as SecurityEvent;
          setSecurityEvents(prev => [newEvent, ...prev.slice(0, 99)]); // Keep max 100 events
        }
      )
      .subscribe();
    
    return () => {
      supabase.removeChannel(subscription);
    };
  }, []);
  
  const fetchData = async () => {
    setLoading(true);
    try {
      // Fetch security events
      const { data: eventsData, error: eventsError } = await supabase
        .from('security_events')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(100);
      
      if (eventsError) throw eventsError;
      setSecurityEvents(eventsData || []);
      
      // Fetch system metrics (mocked data for now)
      // In real implementation, this would come from a system_metrics table
      const mockMetrics: SystemMetric[] = [];
      
      // Generate 24 hours of hourly CPU metrics
      for (let i = 0; i < 24; i++) {
        const timestamp = new Date();
        timestamp.setHours(timestamp.getHours() - 24 + i);
        
        mockMetrics.push({
          id: `cpu-${i}`,
          timestamp: timestamp.toISOString(),
          metric_name: 'cpu_usage',
          metric_value: Math.random() * 50 + 10, // 10-60% CPU usage
          category: 'server',
          unit: '%'
        });
        
        mockMetrics.push({
          id: `memory-${i}`,
          timestamp: timestamp.toISOString(),
          metric_name: 'memory_usage',
          metric_value: Math.random() * 40 + 30, // 30-70% memory usage
          category: 'server',
          unit: '%'
        });
        
        mockMetrics.push({
          id: `storage-${i}`,
          timestamp: timestamp.toISOString(),
          metric_name: 'storage_usage',
          metric_value: Math.random() * 5 + 45, // 45-50% storage usage (gradually increasing)
          category: 'database',
          unit: '%'
        });
        
        mockMetrics.push({
          id: `response-${i}`,
          timestamp: timestamp.toISOString(),
          metric_name: 'api_response_time',
          metric_value: Math.random() * 100 + 50, // 50-150ms response time
          category: 'api',
          unit: 'ms'
        });
      }
      
      setSystemMetrics(mockMetrics);
      
      // Mock API performance data
      const mockApiEndpoints: ApiEndpoint[] = [
        {
          path: '/api/v1/users',
          method: 'GET',
          avg_response_time: 47.3,
          requests_per_minute: 120.5,
          error_rate: 0.02,
          p95_response_time: 72.1
        },
        {
          path: '/api/v1/merchants',
          method: 'GET',
          avg_response_time: 84.6,
          requests_per_minute: 45.2,
          error_rate: 0.05,
          p95_response_time: 142.8
        },
        {
          path: '/api/v1/transactions',
          method: 'POST',
          avg_response_time: 112.3,
          requests_per_minute: 78.3,
          error_rate: 0.08,
          p95_response_time: 198.4
        },
        {
          path: '/api/v1/auth/login',
          method: 'POST',
          avg_response_time: 68.9,
          requests_per_minute: 35.7,
          error_rate: 0.12,
          p95_response_time: 95.2
        },
        {
          path: '/api/v1/products',
          method: 'GET',
          avg_response_time: 92.1,
          requests_per_minute: 65.8,
          error_rate: 0.01,
          p95_response_time: 124.6
        }
      ];
      
      setApiPerformance(mockApiEndpoints);
      
    } catch (error) {
      console.error('Error fetching monitoring data:', error);
    } finally {
      setLoading(false);
    }
  };
  
  const filteredEvents = securityEvents.filter(event => {
    // Apply search filter
    if (searchQuery && !event.description.toLowerCase().includes(searchQuery.toLowerCase()) && 
        !event.event_type.toLowerCase().includes(searchQuery.toLowerCase())) {
      return false;
    }
    
    // Apply severity filter
    if (severityFilter && event.severity !== severityFilter) {
      return false;
    }
    
    return true;
  });
  
  const handleSearch = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(event.target.value);
  };
  
  const handleSeverityFilter = (severity: string | null) => {
    setSeverityFilter(severity);
  };
  
  const getSeverityBadge = (severity: string) => {
    switch (severity) {
      case 'CRITICAL':
        return <Badge className="bg-red-100 text-red-800">Critical</Badge>;
      case 'HIGH':
        return <Badge className="bg-orange-100 text-orange-800">High</Badge>;
      case 'MEDIUM':
        return <Badge className="bg-yellow-100 text-yellow-800">Medium</Badge>;
      case 'LOW':
        return <Badge className="bg-green-100 text-green-800">Low</Badge>;
      default:
        return <Badge className="bg-gray-100 text-gray-800">{severity}</Badge>;
    }
  };
  
  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return new Intl.DateTimeFormat('en-US', {
      dateStyle: 'short',
      timeStyle: 'short'
    }).format(date);
  };
  
  // Create chart data from system metrics
  const prepareChartData = (metricName: string) => {
    const filteredMetrics = systemMetrics
      .filter(metric => metric.metric_name === metricName)
      .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
    
    return filteredMetrics.map(metric => ({
      name: new Date(metric.timestamp).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
      value: metric.metric_value
    }));
  };
  
  const cpuData = prepareChartData('cpu_usage');
  const memoryData = prepareChartData('memory_usage');
  const storageData = prepareChartData('storage_usage');
  const responseTimeData = prepareChartData('api_response_time');
  
  return (
    <div className="container mx-auto p-4 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">System Monitoring</h1>
        <div className="flex space-x-2">
          <Button variant="outline" size="sm" onClick={() => fetchData()}>
            <RefreshCw className="h-4 w-4 mr-1" /> Refresh
          </Button>
          <Button variant="outline" size="sm">
            <Download className="h-4 w-4 mr-1" /> Export
          </Button>
        </div>
      </div>
      
      <Tabs defaultValue={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="security">Security Events</TabsTrigger>
          <TabsTrigger value="system">System Performance</TabsTrigger>
          <TabsTrigger value="api">API Monitoring</TabsTrigger>
        </TabsList>
        
        {/* Security Events Tab */}
        <TabsContent value="security">
          <div className="mb-4 flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-gray-400" />
              <Input 
                placeholder="Search security events..." 
                className="pl-8" 
                value={searchQuery}
                onChange={handleSearch}
              />
            </div>
            
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline">
                  <Shield className="h-4 w-4 mr-1" /> 
                  {severityFilter || 'All Severities'}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuItem onClick={() => handleSeverityFilter(null)}>
                  All Severities
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleSeverityFilter('CRITICAL')}>
                  Critical
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleSeverityFilter('HIGH')}>
                  High
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleSeverityFilter('MEDIUM')}>
                  Medium
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleSeverityFilter('LOW')}>
                  Low
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center">
                <AlertTriangle className="h-5 w-5 mr-2" />
                Security Events
              </CardTitle>
              <CardDescription>
                {filteredEvents.length} {filteredEvents.length === 1 ? 'event' : 'events'} found
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="space-y-2">
                  {[...Array(5)].map((_, i) => (
                    <div key={i} className="flex items-center space-x-4">
                      <Skeleton className="h-12 w-12 rounded-full" />
                      <div className="space-y-2 flex-1">
                        <Skeleton className="h-4 w-full" />
                        <Skeleton className="h-4 w-5/6" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Time</TableHead>
                        <TableHead>Severity</TableHead>
                        <TableHead>Event Type</TableHead>
                        <TableHead>Description</TableHead>
                        <TableHead>User ID</TableHead>
                        <TableHead>IP Address</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredEvents.length > 0 ? (
                        filteredEvents.map((event) => (
                          <TableRow key={event.id}>
                            <TableCell className="whitespace-nowrap">{formatDate(event.created_at)}</TableCell>
                            <TableCell>{getSeverityBadge(event.severity)}</TableCell>
                            <TableCell>{event.event_type}</TableCell>
                            <TableCell>{event.description}</TableCell>
                            <TableCell>{event.user_id || 'N/A'}</TableCell>
                            <TableCell>{event.ip_address || 'N/A'}</TableCell>
                          </TableRow>
                        ))
                      ) : (
                        <TableRow>
                          <TableCell colSpan={6} className="text-center py-6 text-gray-500">
                            {searchQuery || severityFilter 
                              ? 'No security events found matching the current filters'
                              : 'No security events found in the system'}
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        
        {/* System Performance Tab */}
        <TabsContent value="system">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center">
                  <Activity className="h-5 w-5 mr-2" />
                  CPU Usage
                </CardTitle>
                <CardDescription>24-hour trend</CardDescription>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="h-64 flex items-center justify-center">
                    <Skeleton className="h-48 w-full" />
                  </div>
                ) : (
                  <ChartContainer>
                    <AreaChart 
                      data={cpuData} 
                      xAxis="name" 
                      yAxis="value" 
                      categories={['value']} 
                      yAxisWidth={40}
                      height={250}
                    />
                  </ChartContainer>
                )}
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center">
                  <HardDrive className="h-5 w-5 mr-2" />
                  Memory Usage
                </CardTitle>
                <CardDescription>24-hour trend</CardDescription>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="h-64 flex items-center justify-center">
                    <Skeleton className="h-48 w-full" />
                  </div>
                ) : (
                  <ChartContainer>
                    <AreaChart 
                      data={memoryData} 
                      xAxis="name" 
                      yAxis="value" 
                      categories={['value']} 
                      yAxisWidth={40}
                      height={250}
                    />
                  </ChartContainer>
                )}
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center">
                  <Database className="h-5 w-5 mr-2" />
                  Database Storage
                </CardTitle>
                <CardDescription>24-hour trend</CardDescription>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="h-64 flex items-center justify-center">
                    <Skeleton className="h-48 w-full" />
                  </div>
                ) : (
                  <ChartContainer>
                    <AreaChart 
                      data={storageData} 
                      xAxis="name" 
                      yAxis="value" 
                      categories={['value']} 
                      yAxisWidth={40}
                      height={250}
                    />
                  </ChartContainer>
                )}
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center">
                  <Clock className="h-5 w-5 mr-2" />
                  API Response Time
                </CardTitle>
                <CardDescription>24-hour trend (milliseconds)</CardDescription>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="h-64 flex items-center justify-center">
                    <Skeleton className="h-48 w-full" />
                  </div>
                ) : (
                  <ChartContainer>
                    <AreaChart 
                      data={responseTimeData} 
                      xAxis="name" 
                      yAxis="value" 
                      categories={['value']} 
                      yAxisWidth={40}
                      height={250}
                    />
                  </ChartContainer>
                )}
              </CardContent>
            </Card>
          </div>
          
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Server className="h-5 w-5 mr-2" />
                System Health Status
              </CardTitle>
              <CardDescription>Current status of all system components</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-green-50 p-4 rounded-lg flex items-center justify-between">
                  <div>
                    <div className="text-sm text-gray-500">API Server</div>
                    <div className="font-medium">Healthy</div>
                  </div>
                  <CheckCircle className="h-6 w-6 text-green-600" />
                </div>
                
                <div className="bg-green-50 p-4 rounded-lg flex items-center justify-between">
                  <div>
                    <div className="text-sm text-gray-500">Database</div>
                    <div className="font-medium">Operational</div>
                  </div>
                  <CheckCircle className="h-6 w-6 text-green-600" />
                </div>
                
                <div className="bg-green-50 p-4 rounded-lg flex items-center justify-between">
                  <div>
                    <div className="text-sm text-gray-500">Storage Service</div>
                    <div className="font-medium">Available</div>
                  </div>
                  <CheckCircle className="h-6 w-6 text-green-600" />
                </div>
                
                <div className="bg-yellow-50 p-4 rounded-lg flex items-center justify-between">
                  <div>
                    <div className="text-sm text-gray-500">Cache Service</div>
                    <div className="font-medium">Degraded</div>
                  </div>
                  <Info className="h-6 w-6 text-yellow-600" />
                </div>
                
                <div className="bg-green-50 p-4 rounded-lg flex items-center justify-between">
                  <div>
                    <div className="text-sm text-gray-500">Email Service</div>
                    <div className="font-medium">Operational</div>
                  </div>
                  <CheckCircle className="h-6 w-6 text-green-600" />
                </div>
                
                <div className="bg-green-50 p-4 rounded-lg flex items-center justify-between">
                  <div>
                    <div className="text-sm text-gray-500">Authentication</div>
                    <div className="font-medium">Available</div>
                  </div>
                  <CheckCircle className="h-6 w-6 text-green-600" />
                </div>
                
                <div className="bg-green-50 p-4 rounded-lg flex items-center justify-between">
                  <div>
                    <div className="text-sm text-gray-500">Background Jobs</div>
                    <div className="font-medium">Running</div>
                  </div>
                  <CheckCircle className="h-6 w-6 text-green-600" />
                </div>
                
                <div className="bg-red-50 p-4 rounded-lg flex items-center justify-between">
                  <div>
                    <div className="text-sm text-gray-500">Analytics Service</div>
                    <div className="font-medium">Offline</div>
                  </div>
                  <XCircle className="h-6 w-6 text-red-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        {/* API Monitoring Tab */}
        <TabsContent value="api">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Activity className="h-5 w-5 mr-2" />
                API Performance Metrics
              </CardTitle>
              <CardDescription>Monitor API endpoints performance</CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="space-y-2">
                  {[...Array(5)].map((_, i) => (
                    <Skeleton key={i} className="h-12 w-full" />
                  ))}
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Endpoint</TableHead>
                        <TableHead>Method</TableHead>
                        <TableHead>Avg Response Time</TableHead>
                        <TableHead>p95 Response</TableHead>
                        <TableHead>Req/Min</TableHead>
                        <TableHead>Error Rate</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {apiPerformance.map((endpoint, index) => (
                        <TableRow key={index}>
                          <TableCell className="font-medium">{endpoint.path}</TableCell>
                          <TableCell>
                            <Badge className={
                              endpoint.method === 'GET' 
                                ? 'bg-blue-100 text-blue-800'
                                : endpoint.method === 'POST'
                                  ? 'bg-green-100 text-green-800'
                                  : endpoint.method === 'PUT'
                                    ? 'bg-orange-100 text-orange-800'
                                    : 'bg-red-100 text-red-800'
                            }>
                              {endpoint.method}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            {endpoint.avg_response_time.toFixed(1)} ms
                          </TableCell>
                          <TableCell>
                            {endpoint.p95_response_time.toFixed(1)} ms
                          </TableCell>
                          <TableCell>
                            {endpoint.requests_per_minute.toFixed(1)}
                          </TableCell>
                          <TableCell>
                            <span className={
                              endpoint.error_rate < 0.05 
                                ? 'text-green-600'
                                : endpoint.error_rate < 0.1 
                                  ? 'text-yellow-600' 
                                  : 'text-red-600'
                            }>
                              {(endpoint.error_rate * 100).toFixed(2)}%
                            </span>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
          
          <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center">
                  <Clock className="h-5 w-5 mr-2" />
                  Average Response Time by Endpoint
                </CardTitle>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <Skeleton className="h-64 w-full" />
                ) : (
                  <ChartContainer>
                    <BarChart
                      data={apiPerformance.map(endpoint => ({
                        name: endpoint.path.split('/').pop() || endpoint.path,
                        value: endpoint.avg_response_time
                      }))}
                      xAxis="name"
                      yAxis="value"
                      height={250}
                    />
                  </ChartContainer>
                )}
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center">
                  <AlertTriangle className="h-5 w-5 mr-2" />
                  Error Rates by Endpoint
                </CardTitle>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <Skeleton className="h-64 w-full" />
                ) : (
                  <ChartContainer>
                    <BarChart
                      data={apiPerformance.map(endpoint => ({
                        name: endpoint.path.split('/').pop() || endpoint.path,
                        value: endpoint.error_rate * 100
                      }))}
                      xAxis="name"
                      yAxis="value"
                      height={250}
                    />
                  </ChartContainer>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default SystemMonitoring;