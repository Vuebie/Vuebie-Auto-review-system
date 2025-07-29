import React, { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "../ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select";
import { Alert, AlertDescription, AlertTitle } from "../ui/alert";
import { Badge } from "../ui/badge";
import { 
  LineChart, Line, BarChart, Bar, PieChart, Pie, 
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell 
} from "recharts";
import { supabase } from "../../lib/supabase";
import { AlertCircle, Clock, TrendingUp, Shield, Activity, RefreshCcw } from "lucide-react";
import { Button } from "../ui/button";

// Import monitoring-related components
import { CacheMetricsCard } from "./metrics/CacheMetricsCard";
import { PermissionChecksCard } from "./metrics/PermissionChecksCard";
import { RoleManagementCard } from "./metrics/RoleManagementCard";
import { SecurityEventsCard } from "./metrics/SecurityEventsCard";
import { EdgeFunctionsCard } from "./metrics/EdgeFunctionsCard";
import { AlertsPanel } from "./metrics/AlertsPanel";

const PermissionMonitoringDashboard: React.FC = () => {
  const [timeRange, setTimeRange] = useState<"24h" | "7d" | "30d" | "90d">("24h");
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  interface MetricsData {
    cache?: Record<string, unknown>[];
    checks?: Record<string, unknown>[];
    roles?: Record<string, unknown>[];
    security?: Record<string, unknown>[];
    edge?: Record<string, unknown>[];
    alerts?: Record<string, unknown>[];
  }
  
  const [metricsData, setMetricsData] = useState<MetricsData | null>(null);

  // Fetch metrics data based on time range
  const fetchMetricsData = async () => {
    setLoading(true);
    setError(null);
    
    try {
      // Calculate the start date based on selected time range
      const now = new Date();
      const startDate = new Date();
      
      switch (timeRange) {
        case "24h":
          startDate.setDate(now.getDate() - 1);
          break;
        case "7d":
          startDate.setDate(now.getDate() - 7);
          break;
        case "30d":
          startDate.setDate(now.getDate() - 30);
          break;
        case "90d":
          startDate.setDate(now.getDate() - 90);
          break;
      }

      // Fetch metrics data from Supabase tables
      const [
        { data: cacheData, error: cacheError },
        { data: checksData, error: checksError },
        { data: roleData, error: roleError },
        { data: securityData, error: securityError },
        { data: edgeData, error: edgeError },
        { data: alertsData, error: alertsError }
      ] = await Promise.all([
        supabase
          .from('permission_metrics_cache')
          .select('*')
          .gte('timestamp', startDate.toISOString())
          .order('timestamp', { ascending: true }),
        supabase
          .from('permission_metrics_checks')
          .select('*')
          .gte('timestamp', startDate.toISOString())
          .order('timestamp', { ascending: true }),
        supabase
          .from('permission_metrics_roles')
          .select('*')
          .gte('timestamp', startDate.toISOString())
          .order('timestamp', { ascending: true }),
        supabase
          .from('permission_metrics_security')
          .select('*')
          .gte('timestamp', startDate.toISOString())
          .order('timestamp', { ascending: true }),
        supabase
          .from('permission_metrics_edge')
          .select('*')
          .gte('timestamp', startDate.toISOString())
          .order('timestamp', { ascending: true }),
        supabase
          .from('permission_metrics_alerts')
          .select('*')
          .gte('timestamp', startDate.toISOString())
          .order('timestamp', { ascending: false })
      ]);

      if (cacheError || checksError || roleError || securityError || edgeError || alertsError) {
        throw new Error("Failed to fetch one or more metrics datasets");
      }

      // Process and set the data
      setMetricsData({
        cache: cacheData || [],
        checks: checksData || [],
        roles: roleData || [],
        security: securityData || [],
        edge: edgeData || [],
        alerts: alertsData || []
      });
    } catch (err) {
      // Handle error fetching metrics
      setError(err instanceof Error ? err.message : "Failed to load monitoring data");
    } finally {
      setLoading(false);
    }
  };

  // Initial data fetch and setup refresh interval
  useEffect(() => {
    fetchMetricsData();
    
    // Set up interval to refresh data (every 5 minutes)
    const intervalId = setInterval(fetchMetricsData, 5 * 60 * 1000);
    
    // Clean up interval on component unmount
    return () => clearInterval(intervalId);
  }, [timeRange]);

  if (loading && !metricsData) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Permission Monitoring Dashboard</h1>
          <p className="text-muted-foreground">Monitor and analyze permission system performance</p>
        </div>
        
        <div className="flex items-center space-x-4">
          <Select value={timeRange} onValueChange={(value: "24h" | "7d" | "30d" | "90d") => setTimeRange(value)}>
            <SelectTrigger className="w-36">
              <SelectValue placeholder="Select Range" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="24h">Last 24 Hours</SelectItem>
              <SelectItem value="7d">Last 7 Days</SelectItem>
              <SelectItem value="30d">Last 30 Days</SelectItem>
              <SelectItem value="90d">Last 90 Days</SelectItem>
            </SelectContent>
          </Select>
          
          <Button variant="outline" size="sm" onClick={fetchMetricsData} disabled={loading}>
            <RefreshCcw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>
      
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <CacheMetricsCard 
          data={metricsData?.cache} 
          loading={loading} 
          className="col-span-1" 
        />
        
        <PermissionChecksCard 
          data={metricsData?.checks} 
          loading={loading} 
          className="col-span-1" 
        />
        
        <RoleManagementCard 
          data={metricsData?.roles} 
          loading={loading} 
          className="col-span-1" 
        />
        
        <SecurityEventsCard 
          data={metricsData?.security} 
          loading={loading} 
          className="col-span-1" 
        />
        
        <EdgeFunctionsCard 
          data={metricsData?.edge} 
          loading={loading} 
          className="col-span-1" 
        />
      </div>

      {/* Detailed Metrics Tabs */}
      <Tabs defaultValue="cache" className="w-full">
        <TabsList>
          <TabsTrigger value="cache">Cache Performance</TabsTrigger>
          <TabsTrigger value="permissions">Permission Checks</TabsTrigger>
          <TabsTrigger value="roles">Role Management</TabsTrigger>
          <TabsTrigger value="security">Security Events</TabsTrigger>
          <TabsTrigger value="edge">Edge Functions</TabsTrigger>
          <TabsTrigger value="alerts">Alerts</TabsTrigger>
        </TabsList>
        
        <TabsContent value="cache">
          <Card>
            <CardHeader>
              <CardTitle>Cache Performance Details</CardTitle>
              <CardDescription>
                Track cache hits, misses, and performance metrics over time
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-8">
              {/* Cache Performance Chart */}
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart
                    data={metricsData?.cache?.map((item) => ({
                      timestamp: new Date((item.timestamp as string)).toLocaleString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      }),
                      hits: item.hits as number,
                      misses: item.misses as number
                    }))}
                    margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="timestamp" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Line type="monotone" dataKey="hits" stroke="#0088FE" name="Cache Hits" />
                    <Line type="monotone" dataKey="misses" stroke="#FF8042" name="Cache Misses" />
                  </LineChart>
                </ResponsiveContainer>
              </div>

              {/* Additional cache metrics cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium">Cache Hit Ratio</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {(() => {
                      const totalHits = metricsData?.cache?.reduce((sum: number, item) => sum + (item.hits as number || 0), 0) || 0;
                      const totalMisses = metricsData?.cache?.reduce((sum: number, item) => sum + (item.misses as number || 0), 0) || 0;
                      const ratio = totalHits + totalMisses > 0 ? 
                        (totalHits / (totalHits + totalMisses)) * 100 : 0;
                      
                      return (
                        <>
                          <div className="text-2xl font-bold">
                            {ratio.toFixed(2)}%
                          </div>
                          <p className="text-xs text-muted-foreground mt-1">
                            Higher hit ratio indicates better performance
                          </p>
                        </>
                      );
                    })()}
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium">Total Cache Requests</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {(() => {
                      const totalHits = metricsData?.cache?.reduce((sum: number, item) => sum + (item.hits as number || 0), 0) || 0;
                      const totalMisses = metricsData?.cache?.reduce((sum: number, item) => sum + (item.misses as number || 0), 0) || 0;
                      
                      return (
                        <>
                          <div className="text-2xl font-bold">
                            {totalHits + totalMisses}
                          </div>
                          <p className="text-xs text-muted-foreground mt-1">
                            Total cache operations
                          </p>
                        </>
                      );
                    })()}
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium">Cache Distribution</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="h-40">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={(() => {
                              const totalHits = metricsData?.cache?.reduce((sum: number, item) => sum + (item.hits as number || 0), 0) || 0;
                              const totalMisses = metricsData?.cache?.reduce((sum: number, item) => sum + (item.misses as number || 0), 0) || 0;
                              
                              return [
                                { name: 'Hits', value: totalHits },
                                { name: 'Misses', value: totalMisses }
                              ];
                            })()}
                            cx="50%"
                            cy="50%"
                            labelLine={false}
                            outerRadius={60}
                            fill="#8884d8"
                            dataKey="value"
                            label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                          >
                            <Cell fill="#0088FE" />
                            <Cell fill="#FF8042" />
                          </Pie>
                          <Tooltip />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </CardContent>
            <CardFooter>
              <p className="text-sm text-gray-500">
                <Clock className="inline-block w-4 h-4 mr-1" />
                Last updated: {new Date().toLocaleString()}
              </p>
            </CardFooter>
          </Card>
        </TabsContent>
        
        <TabsContent value="permissions">
          <PermissionChecksCard data={metricsData?.checks} loading={loading} detailed />
        </TabsContent>
        
        <TabsContent value="roles">
          <RoleManagementCard data={metricsData?.roles} loading={loading} detailed />
        </TabsContent>
        
        <TabsContent value="security">
          <SecurityEventsCard data={metricsData?.security} loading={loading} detailed />
        </TabsContent>
        
        <TabsContent value="edge">
          <EdgeFunctionsCard data={metricsData?.edge} loading={loading} detailed />
        </TabsContent>
        
        <TabsContent value="alerts">
          <AlertsPanel data={metricsData?.alerts} loading={loading} />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default PermissionMonitoringDashboard;