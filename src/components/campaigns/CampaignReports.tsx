import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { format } from 'date-fns';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../hooks/use-toast';
import { supabase } from '../../lib/supabase';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '../ui/card';
import { Button } from '../ui/button';
import { DatePicker } from '../ui/date-picker';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '../ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { useForm, Controller, useFieldArray } from 'react-hook-form';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../ui/table';
import { Badge } from '../ui/badge';
import {
  FileIcon,
  CalendarIcon,
  MailIcon,
  PlusIcon,
  Trash2Icon,
  DownloadIcon,
  ClockIcon,
  UsersIcon,
  FileBarChart2Icon
} from 'lucide-react';

interface ScheduledReport {
  id: string;
  campaign_id: string;
  campaign: {
    id: string;
    name: string;
  };
  name: string;
  schedule: string;
  recipients: string[];
  format: 'pdf' | 'csv' | 'json' | 'excel';
  filters: Record<string, unknown>;
  created_at: string;
  updated_at: string;
  last_sent_at?: string;
  next_scheduled_at?: string;
}

interface ReportFormValues {
  name: string;
  schedule: string;
  recipients: { email: string }[];
  format: 'pdf' | 'csv' | 'json' | 'excel';
  filters: {
    start_date?: Date | null;
    end_date?: Date | null;
  };
}

interface CampaignReportsProps {
  campaignId: string;
  campaignName: string;
}

export default function CampaignReports({ campaignId, campaignName }: CampaignReportsProps) {
  const { t } = useTranslation();
  const { user } = useAuth();
  const { showToast } = useToast();
  const [loading, setLoading] = useState(true);
  const [reports, setReports] = useState<ScheduledReport[]>([]);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [selectedReportId, setSelectedReportId] = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  
  // Report generation dates
  const [startDate, setStartDate] = useState<Date | null>(
    new Date(new Date().setDate(new Date().getDate() - 30)) // Default to last 30 days
  );
  const [endDate, setEndDate] = useState<Date | null>(new Date());
  const [generatingReport, setGeneratingReport] = useState(false);
  const [downloadFormat, setDownloadFormat] = useState<'json' | 'csv'>('json');

  const {
    control,
    handleSubmit,
    reset,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<ReportFormValues>({
    defaultValues: {
      name: '',
      schedule: 'monthly',
      recipients: [{ email: '' }],
      format: 'pdf',
      filters: {
        start_date: null,
        end_date: null
      }
    }
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'recipients',
  });

  useEffect(() => {
    fetchReports();
  }, [campaignId]);

  const fetchReports = async () => {
    setLoading(true);
    try {
      // Fetch scheduled reports from the edge function
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/app_aa9a812f43_campaign_reports`,
        {
          method: 'GET',
          headers: {
            Authorization: `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`
          }
        }
      );
      
      if (!response.ok) throw new Error('Failed to fetch reports');
      
      const data = await response.json();
      const campaignReports = data.filter((report: ScheduledReport) => report.campaign_id === campaignId);
      setReports(campaignReports);
    } catch (err) {
      // Log error fetching reports
      showToast('error', t('common.error'));
    } finally {
      setLoading(false);
    }
  };

  const onCreateReport = async (data: ReportFormValues) => {
    try {
      const reportData = {
        campaign_id: campaignId,
        name: data.name,
        schedule: data.schedule,
        recipients: data.recipients.map(r => r.email),
        format: data.format,
        filters: {
          start_date: data.filters.start_date ? format(data.filters.start_date, 'yyyy-MM-dd') : null,
          end_date: data.filters.end_date ? format(data.filters.end_date, 'yyyy-MM-dd') : null,
        }
      };

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/app_aa9a812f43_campaign_reports`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`
          },
          body: JSON.stringify(reportData)
        }
      );
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create report');
      }
      
      showToast('success', t('campaigns.reports.reportCreated'));
      setCreateDialogOpen(false);
      reset();
      fetchReports();
    } catch (err) {
      // Log error creating report
      showToast('error', t('common.error'));
    }
  };

  const handleGenerateReport = async () => {
    if (!startDate || !endDate) {
      showToast('error', t('campaigns.reports.dateRangeRequired'));
      return;
    }
    
    setGeneratingReport(true);
    try {
      const formattedStartDate = format(startDate, 'yyyy-MM-dd');
      const formattedEndDate = format(endDate, 'yyyy-MM-dd');
      
      // Generate the report
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/app_aa9a812f43_campaign_reports?campaign_id=${campaignId}&start_date=${formattedStartDate}&end_date=${formattedEndDate}&format=${downloadFormat}`,
        {
          method: 'GET',
          headers: {
            Authorization: `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`
          }
        }
      );
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to generate report');
      }
      
      // For CSV format, download the file
      if (downloadFormat === 'csv') {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.style.display = 'none';
        a.href = url;
        a.download = `campaign_report_${campaignName.replace(/\s+/g, '_')}_${format(new Date(), 'yyyy-MM-dd')}.csv`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
      } else {
        // For JSON format, show the data
        const reportData = await response.json();

        showToast('success', t('campaigns.reports.reportGenerated'));
      }
    } catch (err) {
      // Log error generating report
      showToast('error', t('common.error'));
    } finally {
      setGeneratingReport(false);
    }
  };

  const handleDeleteReport = async (reportId: string) => {
    try {
      const { error } = await supabase
        .from('app_aa9a812f43_scheduled_reports')
        .delete()
        .eq('id', reportId);
        
      if (error) throw error;
      
      showToast('success', t('campaigns.reports.reportDeleted'));
      setConfirmDeleteId(null);
      fetchReports();
    } catch (err) {
      // Log error deleting report
      showToast('error', t('common.error'));
    }
  };

  const formatScheduleText = (schedule: string) => {
    switch (schedule) {
      case 'daily':
        return t('campaigns.reports.daily');
      case 'weekly':
        return t('campaigns.reports.weekly');
      case 'monthly':
        return t('campaigns.reports.monthly');
      default:
        return schedule;
    }
  };

  return (
    <div className="p-6">
      <Tabs defaultValue="generate" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="generate">{t('campaigns.reports.generateReport')}</TabsTrigger>
          <TabsTrigger value="scheduled">{t('campaigns.reports.scheduledReports')}</TabsTrigger>
        </TabsList>
        
        <TabsContent value="generate" className="space-y-6 pt-4">
          <Card>
            <CardHeader>
              <CardTitle>{t('campaigns.reports.generateReport')}</CardTitle>
              <CardDescription>
                {t('campaigns.reports.description')}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label>{t('campaigns.reports.startDate')}</Label>
                    <DatePicker date={startDate} setDate={setStartDate} />
                  </div>
                  
                  <div className="space-y-2">
                    <Label>{t('campaigns.reports.endDate')}</Label>
                    <DatePicker date={endDate} setDate={setEndDate} />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label>{t('campaigns.reports.reportFormat')}</Label>
                  <div className="flex space-x-4">
                    <div className="flex items-center space-x-2">
                      <input 
                        type="radio" 
                        id="format-json" 
                        value="json" 
                        checked={downloadFormat === 'json'}
                        onChange={() => setDownloadFormat('json')}
                      />
                      <label htmlFor="format-json" className="cursor-pointer">JSON</label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <input 
                        type="radio" 
                        id="format-csv" 
                        value="csv" 
                        checked={downloadFormat === 'csv'}
                        onChange={() => setDownloadFormat('csv')}
                      />
                      <label htmlFor="format-csv" className="cursor-pointer">CSV</label>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
            <CardFooter>
              <Button 
                onClick={handleGenerateReport} 
                disabled={generatingReport || !startDate || !endDate}
              >
                <DownloadIcon className="h-4 w-4 mr-2" />
                {generatingReport ? t('common.loading') : t('campaigns.reports.generateReport')}
              </Button>
            </CardFooter>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>{t('campaigns.reports.scheduleReport')}</CardTitle>
              <CardDescription>
                {t('campaigns.reports.scheduleDescription')}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button onClick={() => setCreateDialogOpen(true)}>
                <PlusIcon className="h-4 w-4 mr-2" />
                {t('campaigns.reports.scheduleReport')}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="scheduled" className="space-y-6 pt-4">
          {loading ? (
            <div className="flex justify-center p-8">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500"></div>
            </div>
          ) : reports.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center">
                <FileBarChart2Icon className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-4 text-lg font-medium">{t('campaigns.reports.noScheduledReports')}</h3>
                <p className="mt-2 text-gray-500">{t('campaigns.reports.schedulePrompt')}</p>
                <Button onClick={() => setCreateDialogOpen(true)} className="mt-6">
                  <PlusIcon className="h-4 w-4 mr-2" />
                  {t('campaigns.reports.scheduleReport')}
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t('campaigns.reports.reportName')}</TableHead>
                    <TableHead>{t('campaigns.reports.frequency')}</TableHead>
                    <TableHead>{t('campaigns.reports.reportFormat')}</TableHead>
                    <TableHead>{t('campaigns.reports.recipients')}</TableHead>
                    <TableHead>{t('campaigns.reports.lastSent')}</TableHead>
                    <TableHead className="text-right">{t('common.actions')}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {reports.map((report) => (
                    <TableRow key={report.id}>
                      <TableCell className="font-medium">{report.name}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className="flex items-center gap-1">
                          <ClockIcon className="h-3 w-3" />
                          {formatScheduleText(report.schedule)}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary">
                          {report.format.toUpperCase()}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center">
                          <UsersIcon className="h-4 w-4 mr-1 text-gray-500" />
                          {report.recipients.length}
                        </div>
                      </TableCell>
                      <TableCell>
                        {report.last_sent_at 
                          ? format(new Date(report.last_sent_at), 'MMM d, yyyy')
                          : '—'}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end space-x-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setSelectedReportId(report.id)}
                          >
                            <FileIcon className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="text-destructive"
                            onClick={() => setConfirmDeleteId(report.id)}
                          >
                            <Trash2Icon className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </TabsContent>
      </Tabs>
      
      {/* Create Report Dialog */}
      <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
        <DialogContent className="sm:max-w-[550px]">
          <DialogHeader>
            <DialogTitle>{t('campaigns.reports.scheduleReport')}</DialogTitle>
            <DialogDescription>
              {t('campaigns.reports.scheduleDescription')}
            </DialogDescription>
          </DialogHeader>
          
          <form onSubmit={handleSubmit(onCreateReport)} className="space-y-4 pt-4">
            <div className="space-y-2">
              <Label htmlFor="name">{t('campaigns.reports.reportName')} <span className="text-red-500">*</span></Label>
              <Controller
                name="name"
                control={control}
                rules={{ required: 'Report name is required' }}
                render={({ field }) => (
                  <Input id="name" placeholder="Monthly Performance Report" {...field} />
                )}
              />
              {errors.name && <p className="text-sm text-red-500">{errors.name.message}</p>}
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="schedule">{t('campaigns.reports.frequency')} <span className="text-red-500">*</span></Label>
              <Controller
                name="schedule"
                control={control}
                rules={{ required: 'Frequency is required' }}
                render={({ field }) => (
                  <Select 
                    onValueChange={field.onChange} 
                    defaultValue={field.value}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select Frequency" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="daily">{t('campaigns.reports.daily')}</SelectItem>
                      <SelectItem value="weekly">{t('campaigns.reports.weekly')}</SelectItem>
                      <SelectItem value="monthly">{t('campaigns.reports.monthly')}</SelectItem>
                    </SelectContent>
                  </Select>
                )}
              />
              {errors.schedule && <p className="text-sm text-red-500">{errors.schedule.message}</p>}
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="format">{t('campaigns.reports.reportFormat')} <span className="text-red-500">*</span></Label>
              <Controller
                name="format"
                control={control}
                rules={{ required: 'Format is required' }}
                render={({ field }) => (
                  <Select 
                    onValueChange={field.onChange} 
                    defaultValue={field.value}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select Format" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pdf">PDF</SelectItem>
                      <SelectItem value="csv">CSV</SelectItem>
                      <SelectItem value="json">JSON</SelectItem>
                      <SelectItem value="excel">Excel</SelectItem>
                    </SelectContent>
                  </Select>
                )}
              />
              {errors.format && <p className="text-sm text-red-500">{errors.format.message}</p>}
            </div>
            
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label>{t('campaigns.reports.recipients')} <span className="text-red-500">*</span></Label>
                <Button 
                  type="button" 
                  variant="outline" 
                  size="sm" 
                  onClick={() => append({ email: '' })}
                >
                  <PlusIcon className="h-4 w-4 mr-1" />
                  {t('campaigns.reports.addRecipient')}
                </Button>
              </div>
              
              {fields.map((field, index) => (
                <div key={field.id} className="flex items-center gap-2">
                  <div className="flex-1">
                    <Controller
                      name={`recipients.${index}.email`}
                      control={control}
                      rules={{ 
                        required: 'Email is required',
                        pattern: {
                          value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                          message: 'Invalid email address'
                        }
                      }}
                      render={({ field }) => (
                        <div className="flex items-center">
                          <MailIcon className="h-4 w-4 mr-2 text-gray-400" />
                          <Input placeholder="email@example.com" {...field} />
                        </div>
                      )}
                    />
                    {errors.recipients?.[index]?.email && (
                      <p className="text-sm text-red-500 mt-1">
                        {errors.recipients[index]?.email?.message}
                      </p>
                    )}
                  </div>
                  
                  {index > 0 && (
                    <Button 
                      type="button" 
                      variant="ghost" 
                      size="icon" 
                      onClick={() => remove(index)}
                      className="text-red-500 hover:text-red-600"
                    >
                      <Trash2Icon className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              ))}
            </div>
            
            <div className="space-y-2">
              <Label>{t('common.dateRange')} ({t('common.optional')})</Label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <Controller
                    name="filters.start_date"
                    control={control}
                    render={({ field }) => (
                      <DatePicker 
                        date={field.value} 
                        setDate={(date) => field.onChange(date)}
                        placeholder={t('campaigns.reports.startDate')}
                      />
                    )}
                  />
                </div>
                <div>
                  <Controller
                    name="filters.end_date"
                    control={control}
                    render={({ field }) => (
                      <DatePicker 
                        date={field.value} 
                        setDate={(date) => field.onChange(date)}
                        placeholder={t('campaigns.reports.endDate')}
                      />
                    )}
                  />
                </div>
              </div>
            </div>
            
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setCreateDialogOpen(false)} disabled={isSubmitting}>
                {t('common.cancel')}
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? t('common.loading') : t('campaigns.reports.scheduleReport')}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
      
      {/* View Report Details Dialog */}
      {selectedReportId && (
        <Dialog open={!!selectedReportId} onOpenChange={() => setSelectedReportId(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{t('campaigns.reports.reportDetails')}</DialogTitle>
            </DialogHeader>
            
            {reports.find(r => r.id === selectedReportId) && (
              <div className="space-y-4 pt-4">
                {(() => {
                  const report = reports.find(r => r.id === selectedReportId)!;
                  return (
                    <>
                      <div className="space-y-2">
                        <Label>{t('campaigns.reports.reportName')}</Label>
                        <div className="p-2 bg-gray-50 rounded-md">{report.name}</div>
                      </div>
                      
                      <div className="space-y-2">
                        <Label>{t('campaigns.reports.frequency')}</Label>
                        <div className="p-2 bg-gray-50 rounded-md">
                          {formatScheduleText(report.schedule)}
                        </div>
                      </div>
                      
                      <div className="space-y-2">
                        <Label>{t('campaigns.reports.reportFormat')}</Label>
                        <div className="p-2 bg-gray-50 rounded-md">{report.format.toUpperCase()}</div>
                      </div>
                      
                      <div className="space-y-2">
                        <Label>{t('campaigns.reports.recipients')}</Label>
                        <div className="p-2 bg-gray-50 rounded-md space-y-1">
                          {report.recipients.map((email, idx) => (
                            <div key={idx} className="flex items-center">
                              <MailIcon className="h-4 w-4 mr-2 text-gray-400" />
                              {email}
                            </div>
                          ))}
                        </div>
                      </div>
                      
                      {report.filters && (
                        <div className="space-y-2">
                          <Label>{t('common.filter')}</Label>
                          <div className="p-2 bg-gray-50 rounded-md">
                            {report.filters.start_date && (
                              <div className="flex items-center mb-1">
                                <CalendarIcon className="h-4 w-4 mr-2 text-gray-400" />
                                {t('campaigns.startDate')}: {report.filters.start_date}
                              </div>
                            )}
                            {report.filters.end_date && (
                              <div className="flex items-center">
                                <CalendarIcon className="h-4 w-4 mr-2 text-gray-400" />
                                {t('campaigns.endDate')}: {report.filters.end_date}
                              </div>
                            )}
                            {(!report.filters.start_date && !report.filters.end_date) && (
                              <div className="text-gray-500">{t('common.none')}</div>
                            )}
                          </div>
                        </div>
                      )}
                    </>
                  );
                })()}
              </div>
            )}
            
            <DialogFooter>
              <Button onClick={() => setSelectedReportId(null)}>
                {t('common.close')}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
      
      {/* Delete confirmation dialog */}
      <Dialog open={!!confirmDeleteId} onOpenChange={() => setConfirmDeleteId(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('campaigns.reports.deleteSchedule')}</DialogTitle>
            <DialogDescription>
              {t('campaigns.deleteWarning')}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmDeleteId(null)}>
              {t('common.cancel')}
            </Button>
            <Button 
              variant="destructive" 
              onClick={() => confirmDeleteId && handleDeleteReport(confirmDeleteId)}
            >
              {t('common.delete')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}