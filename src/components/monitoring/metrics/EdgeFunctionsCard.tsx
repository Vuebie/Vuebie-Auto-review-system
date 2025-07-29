import React from "react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "../../ui/card";
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer 
} from "recharts";
import { Activity } from "lucide-react";

interface EdgeFunctionMetricsItem {
  timestamp: string;
  calls: number;
  errors: number;
  latency: number;
}

interface EdgeFunctionsCardProps {
  data?: EdgeFunctionMetricsItem[];
  loading: boolean;
  className?: string;
  detailed?: boolean;
}

export const EdgeFunctionsCard: React.FC<EdgeFunctionsCardProps> = ({
  data,
  loading,
  className = "",
  detailed = false
}) => {
  // Calculate metrics
  const totalCalls = data?.reduce((sum: number, item) => sum + item.calls, 0) || 0;
  const totalErrors = data?.reduce((sum: number, item) => sum + item.errors, 0) || 0;
  const errorRate = totalCalls > 0 ? (totalErrors / totalCalls) * 100 : 0;
  
  // Calculate average latency
  const totalLatency = data?.reduce((sum: number, item) => sum + (item.latency * item.calls), 0) || 0;
  const avgLatency = totalCalls > 0 ? totalLatency / totalCalls : 0;

  // Format data for time series chart
  const timeSeriesData = data?.map((item) => ({
    timestamp: new Date(item.timestamp).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }),
    calls: item.calls,
    errors: item.errors,
    latency: item.latency
  }));

  return (
    <Card className={className}>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium">Edge Functions</CardTitle>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex items-center justify-center h-20">
            <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-blue-500"></div>
          </div>
        ) : (
          <>
            <div className="text-2xl font-bold">
              {avgLatency.toFixed(2)} ms
            </div>
            <p className="text-xs text-muted-foreground">
              Calls: {totalCalls.toLocaleString()} | Errors: {totalErrors.toLocaleString()}
            </p>
            
            {detailed && (
              <>
                <div className="mt-6 h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart
                      data={timeSeriesData}
                      margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="timestamp" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Line type="monotone" dataKey="calls" stroke="#0088FE" name="Function Calls" />
                      <Line type="monotone" dataKey="errors" stroke="#FF0000" name="Errors" />
                    </LineChart>
                  </ResponsiveContainer>
                </div>

                <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-medium">Total Calls</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">
                        {totalCalls.toLocaleString()}
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">
                        Function calls in selected period
                      </p>
                    </CardContent>
                  </Card>
                  
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-medium">Error Rate</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className={`text-2xl font-bold ${errorRate > 5 ? 'text-red-600' : 'text-green-600'}`}>
                        {errorRate.toFixed(2)}%
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">
                        Percentage of calls resulting in errors
                      </p>
                    </CardContent>
                  </Card>
                  
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-medium">Average Latency</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">
                        {avgLatency.toFixed(2)} ms
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">
                        Average function execution time
                      </p>
                    </CardContent>
                  </Card>
                </div>
                
                <div className="mt-6">
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-medium">Latency Over Time</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="h-40">
                        <ResponsiveContainer width="100%" height="100%">
                          <LineChart
                            data={timeSeriesData}
                            margin={{ top: 5, right: 20, left: 0, bottom: 5 }}
                          >
                            <XAxis dataKey="timestamp" />
                            <YAxis />
                            <Tooltip formatter={(value: number) => [`${value.toFixed(2)} ms`, 'Latency']} />
                            <Line 
                              type="monotone" 
                              dataKey="latency" 
                              stroke="#8884d8" 
                              name="Function Latency (ms)" 
                            />
                          </LineChart>
                        </ResponsiveContainer>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </>
            )}
          </>
        )}
      </CardContent>
      {detailed && (
        <CardFooter>
          <p className="text-sm text-gray-500">
            <Activity className="inline-block w-4 h-4 mr-1" />
            Total calls: {totalCalls.toLocaleString()}
          </p>
        </CardFooter>
      )}
    </Card>
  );
};