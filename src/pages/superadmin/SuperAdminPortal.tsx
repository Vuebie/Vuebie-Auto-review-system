import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { supabase } from '@/lib/supabase-client';
import { ChartContainer, BarChart, AreaChart } from '@/components/ui/charts';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  Activity, Users, AlertTriangle, Shield, CheckCircle, 
  XCircle, Clock, TrendingUp, Database, Server 
} from 'lucide-react';

interface DashboardMetrics {
  totalMerchants: number;
  activeMerchants: number;
  inactiveMerchants: number;
  pendingApplications: number;
  criticalEvents: number;
  highEvents: number;
  mediumEvents: number;
  lowEvents: number;
  apiResponseTime: number;
  databaseUsage: number;
  storageUsage: number;
}

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

const SuperAdminPortal: React.FC = () => {
  const [activeTab, setActiveTab] = useState('overview');
  const [loading, setLoading] = useState(true);
  const [metrics, setMetrics] = useState<DashboardMetrics>({
    totalMerchants: 0,
    activeMerchants: 0,
    inactiveMerchants: 0,
    pendingApplications: 0,
    criticalEvents: 0,
    highEvents: 0,
    mediumEvents: 0,
    lowEvents: 0,
    apiResponseTime: 0,
    databaseUsage: 0,
    storageUsage: 0
  });
  const [recentSecurityEvents, setRecentSecurityEvents] = useState<SecurityEvent[]>([]);
  
  useEffect(() => {
    async function fetchDashboardData() {
      try {
        setLoading(true);
        
        // Fetch merchant statistics
        const { data: merchantData, error: merchantError } = await supabase
          .from('merchant_profiles')
          .select('id, status');
        
        if (merchantError) throw merchantError;
        
        // Fetch security events
        const { data: securityEvents, error: securityError } = await supabase
          .from('security_events')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(10);
        
        if (securityError) throw securityError;
        
        // Calculate metrics
        const active = merchantData?.filter(m => m.status === 'active').length || 0;
        const inactive = merchantData?.filter(m => m.status === 'inactive').length || 0;
        const pending = merchantData?.filter(m => m.status === 'pending').length || 0;
        
        // Count security events by severity
        const criticalCount = securityEvents?.filter(e => e.severity === 'CRITICAL').length || 0;
        const highCount = securityEvents?.filter(e => e.severity === 'HIGH').length || 0;
        const mediumCount = securityEvents?.filter(e => e.severity === 'MEDIUM').length || 0;
        const lowCount = securityEvents?.filter(e => e.severity === 'LOW').length || 0;
        
        // Update state
        setMetrics({
          totalMerchants: merchantData?.length || 0,
          activeMerchants: active,
          inactiveMerchants: inactive,
          pendingApplications: pending,
          criticalEvents: criticalCount,
          highEvents: highCount,
          mediumEvents: mediumCount,
          lowEvents: lowCount,
          apiResponseTime: Math.random() * 100 + 50, // Mock data
          databaseUsage: Math.random() * 60 + 20,    // Mock data
          storageUsage: Math.random() * 70 + 10      // Mock data
        });
        
        setRecentSecurityEvents(securityEvents || []);
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
      } finally {
        setLoading(false);
      }
    }
    
    fetchDashboardData();
    
    // Set up real-time subscription for security events
    const subscription = supabase
      .channel('security_events_channel')
      .on('postgres_changes', 
        { 
          event: 'INSERT', 
          schema: 'public', 
          table: 'security_events',
          filter: 'severity=eq.CRITICAL'
        }, 
        payload => {
          // Add new critical event to the list
          setRecentSecurityEvents(prev => [payload.new as SecurityEvent, ...prev.slice(0, 9)]);
          setMetrics(prev => ({
            ...prev,
            criticalEvents: prev.criticalEvents + 1
          }));
        }
      )
      .subscribe();
    
    return () => {
      supabase.removeChannel(subscription);
    };
  }, []);
  
  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'CRITICAL': return 'bg-red-100 text-red-800';
      case 'HIGH': return 'bg-orange-100 text-orange-800';
      case 'MEDIUM': return 'bg-yellow-100 text-yellow-800';
      case 'LOW': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };
  
  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'CRITICAL': return <AlertTriangle className="h-4 w-4 text-red-600" />;
      case 'HIGH': return <AlertTriangle className="h-4 w-4 text-orange-600" />;
      case 'MEDIUM': return <Clock className="h-4 w-4 text-yellow-600" />;
      case 'LOW': return <CheckCircle className="h-4 w-4 text-green-600" />;
      default: return <AlertTriangle className="h-4 w-4 text-gray-600" />;
    }
  };
  
  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return new Intl.DateTimeFormat('en-US', {
      dateStyle: 'short',
      timeStyle: 'short'
    }).format(date);
  };
  
  const handleTabChange = (value: string) => {
    setActiveTab(value);
  };
  
  return (
    <div className="container mx-auto p-4 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Super Admin Portal</h1>
        <div className="flex space-x-2">
          <button className="btn btn-outline">Export Data</button>
          <button className="btn btn-primary">Take Action</button>
        </div>
      </div>
      
      <Tabs defaultValue="overview" value={activeTab} onValueChange={handleTabChange} className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="merchants">Merchant Management</TabsTrigger>
          <TabsTrigger value="security">Security Monitoring</TabsTrigger>
          <TabsTrigger value="analytics">Analytics & Reporting</TabsTrigger>
        </TabsList>
        
        <TabsContent value="overview">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            {/* Merchant Statistics Card */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center">
                  <Users className="h-5 w-5 mr-2" />
                  Merchant Statistics
                </CardTitle>
                <CardDescription>Overview of merchant accounts</CardDescription>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="space-y-2">
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-3/4" />
                    <Skeleton className="h-4 w-5/6" />
                    <Skeleton className="h-4 w-2/3" />
                  </div>
                ) : (
                  <>
                    <div className="grid grid-cols-2 gap-2 mb-4">
                      <div className="bg-blue-50 p-3 rounded-lg">
                        <div className="text-sm text-gray-500">Total Merchants</div>
                        <div className="text-2xl font-bold">{metrics.totalMerchants}</div>
                      </div>
                      <div className="bg-green-50 p-3 rounded-lg">
                        <div className="text-sm text-gray-500">Active</div>
                        <div className="text-2xl font-bold text-green-600">{metrics.activeMerchants}</div>
                      </div>
                      <div className="bg-red-50 p-3 rounded-lg">
                        <div className="text-sm text-gray-500">Inactive</div>
                        <div className="text-2xl font-bold text-red-600">{metrics.inactiveMerchants}</div>
                      </div>
                      <div className="bg-yellow-50 p-3 rounded-lg">
                        <div className="text-sm text-gray-500">Pending Approval</div>
                        <div className="text-2xl font-bold text-yellow-600">{metrics.pendingApplications}</div>
                      </div>
                    </div>
                    <ChartContainer>
                      <BarChart
                        data={[
                          { name: 'Active', value: metrics.activeMerchants },
                          { name: 'Inactive', value: metrics.inactiveMerchants },
                          { name: 'Pending', value: metrics.pendingApplications }
                        ]}
                        xAxis="name"
                        yAxis="value"
                      />
                    </ChartContainer>
                  </>
                )}
              </CardContent>
            </Card>
            
            {/* Security Overview Card */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center">
                  <Shield className="h-5 w-5 mr-2" />
                  Security Overview
                </CardTitle>
                <CardDescription>Recent security events by severity</CardDescription>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="space-y-2">
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-3/4" />
                    <Skeleton className="h-4 w-5/6" />
                    <Skeleton className="h-4 w-2/3" />
                  </div>
                ) : (
                  <>
                    <div className="grid grid-cols-2 gap-2 mb-4">
                      <div className="bg-red-50 p-3 rounded-lg">
                        <div className="text-sm text-gray-500">Critical</div>
                        <div className="text-2xl font-bold text-red-600">{metrics.criticalEvents}</div>
                      </div>
                      <div className="bg-orange-50 p-3 rounded-lg">
                        <div className="text-sm text-gray-500">High</div>
                        <div className="text-2xl font-bold text-orange-600">{metrics.highEvents}</div>
                      </div>
                      <div className="bg-yellow-50 p-3 rounded-lg">
                        <div className="text-sm text-gray-500">Medium</div>
                        <div className="text-2xl font-bold text-yellow-600">{metrics.mediumEvents}</div>
                      </div>
                      <div className="bg-green-50 p-3 rounded-lg">
                        <div className="text-sm text-gray-500">Low</div>
                        <div className="text-2xl font-bold text-green-600">{metrics.lowEvents}</div>
                      </div>
                    </div>
                    <ChartContainer>
                      <BarChart
                        data={[
                          { name: 'Critical', value: metrics.criticalEvents },
                          { name: 'High', value: metrics.highEvents },
                          { name: 'Medium', value: metrics.mediumEvents },
                          { name: 'Low', value: metrics.lowEvents }
                        ]}
                        xAxis="name"
                        yAxis="value"
                      />
                    </ChartContainer>
                  </>
                )}
              </CardContent>
            </Card>
            
            {/* System Health Card */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center">
                  <Activity className="h-5 w-5 mr-2" />
                  System Health
                </CardTitle>
                <CardDescription>Performance metrics</CardDescription>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="space-y-2">
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-3/4" />
                    <Skeleton className="h-4 w-5/6" />
                    <Skeleton className="h-4 w-2/3" />
                  </div>
                ) : (
                  <>
                    <div className="space-y-3">
                      <div className="bg-blue-50 p-3 rounded-lg">
                        <div className="flex justify-between items-center">
                          <div className="text-sm text-gray-500 flex items-center">
                            <TrendingUp className="h-4 w-4 mr-1" /> API Response Time
                          </div>
                          <div className="font-bold">{metrics.apiResponseTime.toFixed(1)} ms</div>
                        </div>
                        <div className="w-full bg-gray-200 h-1 mt-2 rounded-full">
                          <div 
                            className={`h-1 rounded-full ${metrics.apiResponseTime < 100 ? 'bg-green-500' : 'bg-yellow-500'}`}
                            style={{ width: `${Math.min(metrics.apiResponseTime / 200 * 100, 100)}%` }}
                          ></div>
                        </div>
                      </div>
                      <div className="bg-purple-50 p-3 rounded-lg">
                        <div className="flex justify-between items-center">
                          <div className="text-sm text-gray-500 flex items-center">
                            <Database className="h-4 w-4 mr-1" /> Database Usage
                          </div>
                          <div className="font-bold">{metrics.databaseUsage.toFixed(1)}%</div>
                        </div>
                        <div className="w-full bg-gray-200 h-1 mt-2 rounded-full">
                          <div 
                            className={`h-1 rounded-full ${metrics.databaseUsage < 70 ? 'bg-green-500' : 'bg-yellow-500'}`}
                            style={{ width: `${metrics.databaseUsage}%` }}
                          ></div>
                        </div>
                      </div>
                      <div className="bg-indigo-50 p-3 rounded-lg">
                        <div className="flex justify-between items-center">
                          <div className="text-sm text-gray-500 flex items-center">
                            <Server className="h-4 w-4 mr-1" /> Storage Usage
                          </div>
                          <div className="font-bold">{metrics.storageUsage.toFixed(1)}%</div>
                        </div>
                        <div className="w-full bg-gray-200 h-1 mt-2 rounded-full">
                          <div 
                            className={`h-1 rounded-full ${metrics.storageUsage < 70 ? 'bg-green-500' : 'bg-yellow-500'}`}
                            style={{ width: `${metrics.storageUsage}%` }}
                          ></div>
                        </div>
                      </div>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          </div>
          
          {/* Recent Security Events */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <AlertTriangle className="h-5 w-5 mr-2" />
                Recent Security Events
              </CardTitle>
              <CardDescription>Latest security events across the platform</CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="space-y-2">
                  {[...Array(5)].map((_, i) => (
                    <div key={i} className="flex items-center space-x-2">
                      <Skeleton className="h-10 w-10 rounded-full" />
                      <div className="space-y-1 flex-1">
                        <Skeleton className="h-4 w-full" />
                        <Skeleton className="h-4 w-5/6" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Severity</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Description</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">IP Address</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Time</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {recentSecurityEvents.length > 0 ? (
                        recentSecurityEvents.map((event) => (
                          <tr key={event.id} className="hover:bg-gray-50">
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className={`px-2 py-1 rounded-full text-xs font-medium ${getSeverityColor(event.severity)}`}>
                                {getSeverityIcon(event.severity)} {event.severity}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{event.event_type}</td>
                            <td className="px-6 py-4 text-sm text-gray-900">{event.description}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{event.ip_address || 'N/A'}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{formatDate(event.created_at)}</td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan={5} className="px-6 py-4 text-center text-sm text-gray-500">
                            No recent security events found
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="merchants">
          <div className="text-center py-12">
            <p className="text-lg text-gray-500">Merchant Management interface will be implemented here</p>
          </div>
        </TabsContent>
        
        <TabsContent value="security">
          <div className="text-center py-12">
            <p className="text-lg text-gray-500">Security Monitoring interface will be implemented here</p>
          </div>
        </TabsContent>
        
        <TabsContent value="analytics">
          <div className="text-center py-12">
            <p className="text-lg text-gray-500">Analytics & Reporting interface will be implemented here</p>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default SuperAdminPortal;