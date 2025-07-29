import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../../ui/card";
import { LineChart, Line, PieChart, Pie, ResponsiveContainer, Tooltip, Cell } from "recharts";

interface CacheMetricsItem {
  timestamp?: string;
  hits: number;
  misses: number;
}

interface CacheMetricsCardProps {
  data?: CacheMetricsItem[];
  loading: boolean;
  className?: string;
  detailed?: boolean;
}

const COLORS = ['#0088FE', '#FF8042'];

export const CacheMetricsCard: React.FC<CacheMetricsCardProps> = ({ 
  data, 
  loading, 
  className = "",
  detailed = false 
}) => {
  // Calculate metrics
  const totalHits = data?.reduce((sum: number, item) => sum + item.hits, 0) || 0;
  const totalMisses = data?.reduce((sum: number, item) => sum + item.misses, 0) || 0;
  const ratio = totalHits + totalMisses > 0 ? 
    (totalHits / (totalHits + totalMisses)) * 100 : 0;

  const pieData = [
    { name: 'Hits', value: totalHits },
    { name: 'Misses', value: totalMisses }
  ];

  return (
    <Card className={className}>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium">Cache Performance</CardTitle>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex items-center justify-center h-20">
            <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-blue-500"></div>
          </div>
        ) : (
          <>
            <div className="text-2xl font-bold">
              {ratio.toFixed(1)}%
            </div>
            <p className="text-xs text-muted-foreground">
              Hits: {totalHits.toLocaleString()} | Misses: {totalMisses.toLocaleString()}
            </p>
            
            {detailed && (
              <div className="mt-4 h-32">
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
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
};