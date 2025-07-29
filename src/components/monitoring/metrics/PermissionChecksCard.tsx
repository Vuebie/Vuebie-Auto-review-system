import React from "react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "../../ui/card";
import { 
  LineChart, Line, BarChart, Bar, PieChart, Pie, 
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell 
} from "recharts";
import { TrendingUp } from "lucide-react";

interface PermissionCheckItem {
  timestamp: string;
  successful: number;
  denied: number;
  avg_latency: number;
}

interface PermissionChecksCardProps {
  data?: PermissionCheckItem[];
  loading: boolean;
  className?: string;
  detailed?: boolean;
}

const COLORS = ['#00C49F', '#FF8042'];

export const PermissionChecksCard: React.FC<PermissionChecksCardProps> = ({
  data,
  loading,
  className = "",
  detailed = false
}) => {
  // Calculate metrics
  const successfulChecks = data?.reduce((sum: number, item) => sum + item.successful, 0) || 0;
  const deniedChecks = data?.reduce((sum: number, item) => sum + item.denied, 0) || 0;
  const totalChecks = successfulChecks + deniedChecks;
  const successRate = totalChecks > 0 ? (successfulChecks / totalChecks) * 100 : 0;
  const avgLatency = data?.length > 0 ? 
    data.reduce((sum: number, item) => sum + item.avg_latency, 0) / data.length : 0;

  const pieData = [
    { name: 'Successful', value: successfulChecks },
    { name: 'Denied', value: deniedChecks }
  ];

  // Format data for time series chart
  const timeSeriesData = data?.map((item) => ({
    timestamp: new Date(item.timestamp).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }),
    successful: item.successful,
    denied: item.denied,
    avg_latency: item.avg_latency
  }));

  return (
    <Card className={className}>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium">Permission Checks</CardTitle>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex items-center justify-center h-20">
            <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-blue-500"></div>
          </div>
        ) : (
          <>
            <div className="text-2xl font-bold">
              {successRate.toFixed(1)}%
            </div>
            <p className="text-xs text-muted-foreground">
              Success: {successfulChecks.toLocaleString()} | Denied: {deniedChecks.toLocaleString()}
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
                      <Line type="monotone" dataKey="successful" stroke="#00C49F" name="Successful Checks" />
                      <Line type="monotone" dataKey="denied" stroke="#FF8042" name="Denied Checks" />
                    </LineChart>
                  </ResponsiveContainer>
                </div>

                <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-medium">Check Results</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="h-40">
                        <ResponsiveContainer width="100%" height="100%">
                          <PieChart>
                            <Pie
                              data={pieData}
                              cx="50%"
                              cy="50%"
                              labelLine={false}
                              outerRadius={50}
                              fill="#8884d8"
                              dataKey="value"
                              label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                            >
                              {pieData.map((_, index) => (
                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                              ))}
                            </Pie>
                            <Tooltip />
                          </PieChart>
                        </ResponsiveContainer>
                      </div>
                    </CardContent>
                  </Card>
                  
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-medium">Average Latency</CardTitle>
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
                            <Line type="monotone" dataKey="avg_latency" stroke="#8884d8" name="Check Latency (ms)" />
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
            <TrendingUp className="inline-block w-4 h-4 mr-1" />
            Total Checks: {totalChecks.toLocaleString()}
          </p>
        </CardFooter>
      )}
    </Card>
  );
};