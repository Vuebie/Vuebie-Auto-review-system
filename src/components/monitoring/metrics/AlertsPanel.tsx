import React, { useState } from "react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "../../ui/card";
import { Badge } from "../../ui/badge";
import { Button } from "../../ui/button";
import { supabase } from "../../../lib/supabase";
import { Bell, Check } from "lucide-react";

interface Alert {
  id: string;
  severity: 'low' | 'medium' | 'high' | 'critical' | string;
  timestamp: string;
  message: string;
  acknowledged: boolean;
}

interface AlertsPanelProps {
  data?: Alert[];
  loading: boolean;
}

export const AlertsPanel: React.FC<AlertsPanelProps> = ({
  data,
  loading
}) => {
  const [acknowledging, setAcknowledging] = useState<Record<string, boolean>>({});

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'low':
        return "bg-blue-100 text-blue-800 hover:bg-blue-200 dark:bg-blue-900 dark:text-blue-300";
      case 'medium':
        return "bg-yellow-100 text-yellow-800 hover:bg-yellow-200 dark:bg-yellow-900 dark:text-yellow-300";
      case 'high':
        return "bg-orange-100 text-orange-800 hover:bg-orange-200 dark:bg-orange-900 dark:text-orange-300";
      case 'critical':
        return "bg-red-100 text-red-800 hover:bg-red-200 dark:bg-red-900 dark:text-red-300";
      default:
        return "bg-gray-100 text-gray-800 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300";
    }
  };

  const acknowledgeAlert = async (alertId: string) => {
    setAcknowledging(prev => ({ ...prev, [alertId]: true }));
    
    try {
      await supabase
        .from('permission_metrics_alerts')
        .update({ acknowledged: true })
        .eq('id', alertId);
      
      // Update the local data to reflect the change
      // Update alert status using optimistic UI updates
    } catch (error) {
      // Handle error acknowledging alert
    } finally {
      setAcknowledging(prev => ({ ...prev, [alertId]: false }));
    }
  };
  
  return (
    <Card>
      <CardHeader>
        <CardTitle>Security Alerts</CardTitle>
        <CardDescription>
          Permission system alerts requiring attention
        </CardDescription>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-blue-500"></div>
          </div>
        ) : data && data.length > 0 ? (
          <div className="space-y-4">
            {data.map((alert) => (
              <Card key={alert.id} className="overflow-hidden">
                <div className="flex items-start p-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <Badge className={getSeverityColor(alert.severity)}>
                        {alert.severity.charAt(0).toUpperCase() + alert.severity.slice(1)}
                      </Badge>
                      <span className="text-sm text-gray-500">{alert.timestamp}</span>
                    </div>
                    <p className="font-medium">{alert.message}</p>
                  </div>
                  
                  {!alert.acknowledged ? (
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => acknowledgeAlert(alert.id)}
                      disabled={acknowledging[alert.id]}
                    >
                      {acknowledging[alert.id] ? (
                        <div className="animate-spin h-4 w-4 border-2 border-t-transparent rounded-full" />
                      ) : (
                        <>
                          <Check className="h-4 w-4 mr-1" />
                          Acknowledge
                        </>
                      )}
                    </Button>
                  ) : (
                    <Badge variant="outline" className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300">
                      Acknowledged
                    </Badge>
                  )}
                </div>
              </Card>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <Bell className="h-12 w-12 mx-auto text-gray-300" />
            <h3 className="mt-4 text-lg font-medium">No alerts</h3>
            <p className="text-sm text-gray-500 mt-1">
              There are no active security alerts for the selected time period.
            </p>
          </div>
        )}
      </CardContent>
      <CardFooter>
        <p className="text-sm text-gray-500">
          <Bell className="inline-block w-4 h-4 mr-1" />
          {data?.filter((alert) => !alert.acknowledged).length || 0} unacknowledged alerts
        </p>
      </CardFooter>
    </Card>
  );
};