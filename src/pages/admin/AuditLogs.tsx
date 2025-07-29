import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from '@/components/ui/pagination';
import { Badge } from '@/components/ui/badge';
import { AlertCircle, Search, Filter, Calendar } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { DatePickerWithRange } from '@/components/date-range-picker';
import { useToast } from '@/components/ui/use-toast';
import { Skeleton } from '@/components/ui/skeleton';
import { supabase } from '@/lib/supabase';
import { format } from 'date-fns';
import { DateRange } from 'react-day-picker';

interface AuditLog {
  id: string;
  user_id: string;
  action: string;
  resource_type: string;
  resource_id: string;
  details: Record<string, unknown>;
  created_at: string;
  user_email?: string;
}

const AuditLogs: React.FC = () => {
  const { t } = useTranslation();
  const { toast } = useToast();
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [actionFilter, setActionFilter] = useState('');
  const [resourceFilter, setResourceFilter] = useState('');
  const [dateRange, setDateRange] = useState<DateRange | undefined>(undefined);
  
  const [page, setPage] = useState(1);
  const rowsPerPage = 10;
  const [totalCount, setTotalCount] = useState(0);

  // Unique action types and resource types for filters
  const [uniqueActions, setUniqueActions] = useState<string[]>([]);
  const [uniqueResources, setUniqueResources] = useState<string[]>([]);

  const fetchLogs = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Build the query
      let query = supabase
        .from('app_aa9a812f43_audit_logs')
        .select('*', { count: 'exact' });
      
      // Apply filters
      if (searchTerm) {
        query = query.or(`user_id.ilike.%${searchTerm}%,action.ilike.%${searchTerm}%,resource_type.ilike.%${searchTerm}%`);
      }
      
      if (actionFilter) {
        query = query.eq('action', actionFilter);
      }
      
      if (resourceFilter) {
        query = query.eq('resource_type', resourceFilter);
      }
      
      if (dateRange?.from) {
        const fromDate = dateRange.from.toISOString();
        query = query.gte('created_at', fromDate);
      }
      
      if (dateRange?.to) {
        const toDate = new Date(dateRange.to);
        toDate.setHours(23, 59, 59, 999);
        query = query.lte('created_at', toDate.toISOString());
      }

      // Apply pagination
      const from = (page - 1) * rowsPerPage;
      const to = from + rowsPerPage - 1;
      
      const { data, count, error } = await query
        .order('created_at', { ascending: false })
        .range(from, to);
      
      if (error) throw error;
      
      if (data) {
        // Fetch user emails for the logs
        const logsWithUserInfo = await Promise.all(
          data.map(async (log) => {
            if (log.user_id) {
              const { data: userData, error: userError } = await supabase.auth.admin.getUserById(log.user_id);
              
              if (userData && !userError) {
                return {
                  ...log,
                  user_email: userData.user?.email || 'Unknown User'
                };
              }
            }
            return {
              ...log,
              user_email: 'System'
            };
          })
        );
        
        setLogs(logsWithUserInfo);
        
        if (count !== null) {
          setTotalCount(count);
        }
      }

      // Fetch unique action types and resource types for filters (if not already loaded)
      if (uniqueActions.length === 0) {
        const { data: actionsData } = await supabase
          .from('app_aa9a812f43_audit_logs')
          .select('action')
          .distinct();
        
        if (actionsData) {
          setUniqueActions(actionsData.map(item => item.action).sort());
        }
      }

      if (uniqueResources.length === 0) {
        const { data: resourcesData } = await supabase
          .from('app_aa9a812f43_audit_logs')
          .select('resource_type')
          .distinct();
        
        if (resourcesData) {
          setUniqueResources(resourcesData.map(item => item.resource_type).sort());
        }
      }
    } catch (error) {
      console.error('Error fetching audit logs:', error);
      setError(t('admin.errorFetchingAuditLogs'));
      toast({
        title: t('admin.errorTitle'),
        description: t('admin.errorFetchingAuditLogs'),
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, [page, actionFilter, resourceFilter, searchTerm, dateRange]);

  const formatDateTime = (dateString: string) => {
    return format(new Date(dateString), 'PPpp');
  };

  const totalPages = Math.ceil(totalCount / rowsPerPage);

  const handleViewDetails = (log: AuditLog) => {
    setSelectedLog(log);
  };

  const actionBadgeColor = (action: string) => {
    const actionLower = action.toLowerCase();
    if (actionLower.includes('create')) return 'bg-green-100 text-green-800';
    if (actionLower.includes('update')) return 'bg-blue-100 text-blue-800';
    if (actionLower.includes('delete')) return 'bg-red-100 text-red-800';
    if (actionLower.includes('login')) return 'bg-purple-100 text-purple-800';
    return 'bg-gray-100 text-gray-800';
  };

  const resourceBadgeColor = (resource: string) => {
    const resourceLower = resource.toLowerCase();
    if (resourceLower.includes('user')) return 'bg-orange-100 text-orange-800';
    if (resourceLower.includes('merchant')) return 'bg-yellow-100 text-yellow-800';
    if (resourceLower.includes('setting')) return 'bg-indigo-100 text-indigo-800';
    return 'bg-gray-100 text-gray-800';
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>{t('admin.auditLogs')}</CardTitle>
          <CardDescription>{t('admin.auditLogsDescription')}</CardDescription>
        </CardHeader>
        <CardContent>
          {/* Search and Filters */}
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder={t('admin.searchLogs')}
                className="pl-8"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div className="flex flex-1 gap-2">
              <Select value={actionFilter} onValueChange={setActionFilter}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder={t('admin.filterByAction')} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">{t('admin.allActions')}</SelectItem>
                  {uniqueActions.map((action) => (
                    <SelectItem key={action} value={action}>{action}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={resourceFilter} onValueChange={setResourceFilter}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder={t('admin.filterByResource')} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">{t('admin.allResources')}</SelectItem>
                  {uniqueResources.map((resource) => (
                    <SelectItem key={resource} value={resource}>{resource}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="mb-6">
            <DatePickerWithRange
              date={dateRange}
              setDate={setDateRange}
            />
          </div>

          {error && (
            <Alert variant="destructive" className="mb-6">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Table */}
          <div className="border rounded-md">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t('admin.timestamp')}</TableHead>
                  <TableHead>{t('admin.user')}</TableHead>
                  <TableHead>{t('admin.action')}</TableHead>
                  <TableHead>{t('admin.resource')}</TableHead>
                  <TableHead className="text-right">{t('admin.actions')}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  Array.from({ length: 5 }).map((_, index) => (
                    <TableRow key={index}>
                      <TableCell><Skeleton className="h-5 w-32" /></TableCell>
                      <TableCell><Skeleton className="h-5 w-40" /></TableCell>
                      <TableCell><Skeleton className="h-5 w-24" /></TableCell>
                      <TableCell><Skeleton className="h-5 w-24" /></TableCell>
                      <TableCell className="text-right"><Skeleton className="h-9 w-20 ml-auto" /></TableCell>
                    </TableRow>
                  ))
                ) : logs.length > 0 ? (
                  logs.map((log) => (
                    <TableRow key={log.id}>
                      <TableCell className="whitespace-nowrap">{formatDateTime(log.created_at)}</TableCell>
                      <TableCell>{log.user_email}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className={actionBadgeColor(log.action)}>
                          {log.action}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className={resourceBadgeColor(log.resource_type)}>
                          {log.resource_type}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="sm" onClick={() => handleViewDetails(log)}>
                          {t('admin.viewDetails')}
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={5} className="h-32 text-center">
                      {t('admin.noLogs')}
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <Pagination className="mt-4">
              <PaginationContent>
                <PaginationItem>
                  <PaginationPrevious 
                    onClick={() => setPage(prev => Math.max(1, prev - 1))}
                    className={page === 1 ? 'pointer-events-none opacity-50' : ''}
                  />
                </PaginationItem>
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  const pageNum = i + 1;
                  return (
                    <PaginationItem key={i}>
                      <PaginationLink 
                        onClick={() => setPage(pageNum)}
                        isActive={page === pageNum}
                      >
                        {pageNum}
                      </PaginationLink>
                    </PaginationItem>
                  );
                })}
                {totalPages > 5 && (
                  <>
                    <PaginationItem>
                      <PaginationLink className="pointer-events-none">...</PaginationLink>
                    </PaginationItem>
                    <PaginationItem>
                      <PaginationLink onClick={() => setPage(totalPages)}>
                        {totalPages}
                      </PaginationLink>
                    </PaginationItem>
                  </>
                )}
                <PaginationItem>
                  <PaginationNext 
                    onClick={() => setPage(prev => Math.min(totalPages, prev + 1))}
                    className={page === totalPages ? 'pointer-events-none opacity-50' : ''}
                  />
                </PaginationItem>
              </PaginationContent>
            </Pagination>
          )}
        </CardContent>
      </Card>

      {/* Log Details Dialog */}
      <Dialog open={selectedLog !== null} onOpenChange={(open) => !open && setSelectedLog(null)}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{t('admin.logDetails')}</DialogTitle>
          </DialogHeader>
          {selectedLog && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground">{t('admin.timestamp')}</h3>
                  <p>{formatDateTime(selectedLog.created_at)}</p>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground">{t('admin.user')}</h3>
                  <p>{selectedLog.user_email}</p>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground">{t('admin.action')}</h3>
                  <p>
                    <Badge variant="outline" className={actionBadgeColor(selectedLog.action)}>
                      {selectedLog.action}
                    </Badge>
                  </p>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground">{t('admin.resource')}</h3>
                  <p>
                    <Badge variant="outline" className={resourceBadgeColor(selectedLog.resource_type)}>
                      {selectedLog.resource_type}
                    </Badge>
                  </p>
                </div>
              </div>
              
              <div>
                <h3 className="text-sm font-medium text-muted-foreground mb-2">{t('admin.details')}</h3>
                <pre className="bg-secondary p-4 rounded-md overflow-x-auto text-xs whitespace-pre-wrap">
                  {JSON.stringify(selectedLog.details, null, 2)}
                </pre>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AuditLogs;