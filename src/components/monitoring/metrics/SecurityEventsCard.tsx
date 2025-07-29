import React from "react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "../../ui/card";
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer 
} from "recharts";
import { Alert, AlertDescription, AlertTitle } from "../../ui/alert";
import { Shield } from "lucide-react";

interface SecurityEventItem {
  timestamp: string;
  unauthorized_attempts: number;
  type: string;
}

interface SecurityEventsCardProps {
  data?: SecurityEventItem[];
  loading: boolean;
  className?: string;
  detailed?: boolean;
}

export const SecurityEventsCard: React.FC<SecurityEventsCardProps> = ({
  data,
  loading,
  className = "",
  detailed = false
}) => {
  // Calculate metrics
  const totalUnauthorizedAttempts = data?.reduce((sum: number, item) => sum + item.unauthorized_attempts, 0) || 0;

  // Format data for time series chart
  const timeSeriesData = data?.map((item) => ({
    timestamp: new Date(item.timestamp).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }),
    unauthorized_attempts: item.unauthorized_attempts,
    type: item.type
  }));

  // Determine security alert status
  const hasSecurityConcerns = totalUnauthorizedAttempts > 0;
  
  return (
    <Card className={className}>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium">Security Events</CardTitle>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex items-center justify-center h-20">
            <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-blue-500"></div>
          </div>
        ) : (
          <>
            <div className={`text-2xl font-bold ${hasSecurityConcerns ? 'text-red-600' : 'text-green-600'}`}>
              {totalUnauthorizedAttempts.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">
              Unauthorized Access Attempts
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
                      <Line 
                        type="monotone" 
                        dataKey="unauthorized_attempts" 
                        stroke="#FF0000" 
                        name="Unauthorized Attempts" 
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>

                <div className="mt-6">
                  <Card className={hasSecurityConcerns ? "bg-red-50 dark:bg-red-950" : "bg-green-50 dark:bg-green-950"}>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-medium">Security Alert Summary</CardTitle>
                    </CardHeader>
                    <CardContent>
                      {hasSecurityConcerns ? (
                        <>
                          <div className="text-2xl font-bold text-red-600 dark:text-red-400">
                            {totalUnauthorizedAttempts} {totalUnauthorizedAttempts === 1 ? 'event' : 'events'}
                          </div>
                          <p className="text-xs text-red-600/80 dark:text-red-400/80 mt-1">
                            Unauthorized access attempts detected
                          </p>
                          
                          <Alert className="mt-4 bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200">
                            <Shield className="h-4 w-4" />
                            <AlertTitle>Security Notice</AlertTitle>
                            <AlertDescription>
                              Multiple unauthorized access attempts detected. Consider reviewing account security settings.
                            </AlertDescription>
                          </Alert>
                        </>
                      ) : (
                        <>
                          <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                            No Events
                          </div>
                          <p className="text-xs text-green-600/80 dark:text-green-400/80 mt-1">
                            No security events detected
                          </p>
                          
                          <Alert className="mt-4 bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                            <Shield className="h-4 w-4" />
                            <AlertTitle>Security Status</AlertTitle>
                            <AlertDescription>
                              No unauthorized access attempts detected in the selected time period.
                            </AlertDescription>
                          </Alert>
                        </>
                      )}
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
            <Shield className="inline-block w-4 h-4 mr-1" />
            Security monitoring active
          </p>
        </CardFooter>
      )}
    </Card>
  );
};