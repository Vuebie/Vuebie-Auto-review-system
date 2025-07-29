import React from "react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "../../ui/card";
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer 
} from "recharts";
import { Users } from "lucide-react";

interface RoleManagementItem {
  timestamp: string;
  assignments: number;
  removals: number;
}

interface RoleManagementCardProps {
  data?: RoleManagementItem[];
  loading: boolean;
  className?: string;
  detailed?: boolean;
}

export const RoleManagementCard: React.FC<RoleManagementCardProps> = ({
  data,
  loading,
  className = "",
  detailed = false
}) => {
  // Calculate metrics
  const totalAssignments = data?.reduce((sum: number, item) => sum + item.assignments, 0) || 0;
  const totalRemovals = data?.reduce((sum: number, item) => sum + item.removals, 0) || 0;
  const totalChanges = totalAssignments + totalRemovals;

  // Format data for time series chart
  const timeSeriesData = data?.map((item) => ({
    timestamp: new Date(item.timestamp).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }),
    assignments: item.assignments,
    removals: item.removals
  }));

  return (
    <Card className={className}>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium">Role Management</CardTitle>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex items-center justify-center h-20">
            <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-blue-500"></div>
          </div>
        ) : (
          <>
            <div className="text-2xl font-bold">
              {totalChanges.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">
              Added: {totalAssignments.toLocaleString()} | Removed: {totalRemovals.toLocaleString()}
            </p>
            
            {detailed && (
              <>
                <div className="mt-6 h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={timeSeriesData}
                      margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="timestamp" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Bar dataKey="assignments" fill="#0088FE" name="Role Assignments" />
                      <Bar dataKey="removals" fill="#FF8042" name="Role Removals" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>

                <div className="mt-6">
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-medium">Role Change Distribution</CardTitle>
                      <CardDescription>Assignment vs. removal activity</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <div className="text-2xl font-bold text-blue-500">
                            {totalAssignments.toLocaleString()}
                          </div>
                          <p className="text-xs text-muted-foreground mt-1">
                            Total Role Assignments
                          </p>
                          {totalChanges > 0 && (
                            <div className="text-sm mt-2">
                              {((totalAssignments / totalChanges) * 100).toFixed(1)}% of changes
                            </div>
                          )}
                        </div>
                        <div>
                          <div className="text-2xl font-bold text-orange-500">
                            {totalRemovals.toLocaleString()}
                          </div>
                          <p className="text-xs text-muted-foreground mt-1">
                            Total Role Removals
                          </p>
                          {totalChanges > 0 && (
                            <div className="text-sm mt-2">
                              {((totalRemovals / totalChanges) * 100).toFixed(1)}% of changes
                            </div>
                          )}
                        </div>
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
            <Users className="inline-block w-4 h-4 mr-1" />
            Total role changes: {totalChanges.toLocaleString()}
          </p>
        </CardFooter>
      )}
    </Card>
  );
};