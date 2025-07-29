import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { format } from 'date-fns';
import { useNavigate } from 'react-router-dom';
import { Campaign, CampaignMetrics } from '../../pages/dashboard/CampaignsPage';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../ui/table';
import { Input } from '../ui/input';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '../ui/dropdown-menu';
import { Button } from '../ui/button';
import { Checkbox } from '../ui/checkbox';
import { Badge } from '../ui/badge';
import {
  ChevronDownIcon,
  Pencil1Icon,
  TrashIcon,
  MixerHorizontalIcon,
  EyeOpenIcon
} from '@radix-ui/react-icons';
import { useToast } from '../../hooks/use-toast';
import { supabase } from '../../lib/supabase';

interface CampaignListProps {
  campaigns: Campaign[];
  campaignMetrics: Record<string, CampaignMetrics>;
  onSelectCampaign: (campaign: Campaign) => void;
  selectedCampaignsForComparison: string[];
  onComparisonSelect: (campaignId: string) => void;
}

export default function CampaignList({
  campaigns,
  campaignMetrics,
  onSelectCampaign,
  selectedCampaignsForComparison,
  onComparisonSelect,
}: CampaignListProps) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  const getCampaignStatus = (campaign: Campaign) => {
    const now = new Date();
    const startDate = new Date(campaign.start_date);
    const endDate = campaign.end_date ? new Date(campaign.end_date) : null;
    
    if (!campaign.is_active) {
      return 'inactive';
    }
    
    if (startDate > now) {
      return 'upcoming';
    }
    
    if (endDate && endDate < now) {
      return 'completed';
    }
    
    return 'active';
  };
  
  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'active':
        return 'success';
      case 'upcoming':
        return 'info';
      case 'completed':
        return 'secondary';
      case 'inactive':
        return 'outline';
      default:
        return 'default';
    }
  };

  const filteredCampaigns = campaigns.filter(campaign => {
    const matchesSearch = campaign.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (campaign.description && campaign.description.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const status = getCampaignStatus(campaign);
    const matchesStatus = statusFilter === 'all' || status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  const handleEditCampaign = (campaignId: string) => {
    navigate(`/campaigns/edit/${campaignId}`);
  };

  const handleDeleteCampaign = async (campaignId: string) => {
    if (confirm(t('campaigns.confirmDelete'))) {
      try {
        // First delete related records from campaign_outlets
        const { error: outletsError } = await supabase
          .from('app_aa9a812f43_campaign_outlets')
          .delete()
          .eq('campaign_id', campaignId);
          
        if (outletsError) throw outletsError;
        
        // Then delete the campaign
        const { error } = await supabase
          .from('app_aa9a812f43_campaigns')
          .delete()
          .eq('id', campaignId);
          
        if (error) throw error;
        
        showToast('success', t('campaigns.campaignDeleted'));
        
        // Remove from comparison list if selected
        if (selectedCampaignsForComparison.includes(campaignId)) {
          onComparisonSelect(campaignId);
        }
        
        // Refresh the page to update the list
        window.location.reload();
      } catch (err) {
        // Log error deleting campaign
        showToast('error', 'Failed to delete campaign');
      }
    }
  };

  return (
    <div className="space-y-4 p-6">
      <div className="flex flex-col sm:flex-row justify-between gap-4">
        <div className="flex-1">
          <Input
            placeholder={t('common.search')}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="max-w-sm"
          />
        </div>
        <div className="flex flex-wrap gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="flex items-center gap-1">
                <MixerHorizontalIcon className="h-4 w-4" />
                <span>
                  {statusFilter === 'all'
                    ? t('common.filter')
                    : t(`campaigns.${statusFilter}`)}
                </span>
                <ChevronDownIcon className="h-4 w-4 ml-1" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>{t('campaigns.status')}</DropdownMenuLabel>
              <DropdownMenuItem onClick={() => setStatusFilter('all')}>
                {t('common.all')}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setStatusFilter('active')}>
                {t('campaigns.active')}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setStatusFilter('upcoming')}>
                {t('campaigns.upcoming')}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setStatusFilter('completed')}>
                {t('campaigns.completed')}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setStatusFilter('inactive')}>
                {t('campaigns.inactive')}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {filteredCampaigns.length > 0 ? (
        <div className="border rounded-lg overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12">
                  {/* Comparison checkbox column */}
                </TableHead>
                <TableHead>{t('campaigns.campaignName')}</TableHead>
                <TableHead>{t('campaigns.startDate')}</TableHead>
                <TableHead className="hidden md:table-cell">{t('campaigns.endDate')}</TableHead>
                <TableHead className="hidden md:table-cell">{t('campaigns.status')}</TableHead>
                <TableHead className="hidden lg:table-cell">{t('campaigns.metrics.views')}</TableHead>
                <TableHead className="hidden lg:table-cell">{t('campaigns.metrics.reviews')}</TableHead>
                <TableHead className="hidden lg:table-cell">{t('campaigns.metrics.conversionRate')}</TableHead>
                <TableHead className="text-right">{t('common.actions')}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredCampaigns.map((campaign) => {
                const status = getCampaignStatus(campaign);
                const metrics = campaignMetrics[campaign.id];
                
                return (
                  <TableRow 
                    key={campaign.id} 
                    className="cursor-pointer hover:bg-muted/50"
                  >
                    <TableCell>
                      <Checkbox 
                        checked={selectedCampaignsForComparison.includes(campaign.id)}
                        onCheckedChange={() => onComparisonSelect(campaign.id)}
                        onClick={(e) => e.stopPropagation()}
                        aria-label={`Select ${campaign.name} for comparison`}
                      />
                    </TableCell>
                    <TableCell 
                      className="font-medium"
                      onClick={() => onSelectCampaign(campaign)}
                    >
                      {campaign.name}
                    </TableCell>
                    <TableCell onClick={() => onSelectCampaign(campaign)}>
                      {format(new Date(campaign.start_date), 'MMM d, yyyy')}
                    </TableCell>
                    <TableCell 
                      className="hidden md:table-cell"
                      onClick={() => onSelectCampaign(campaign)}
                    >
                      {campaign.end_date 
                        ? format(new Date(campaign.end_date), 'MMM d, yyyy')
                        : '-'}
                    </TableCell>
                    <TableCell 
                      className="hidden md:table-cell"
                      onClick={() => onSelectCampaign(campaign)}
                    >
                      <Badge variant={getStatusBadgeVariant(status) as "success" | "info" | "secondary" | "outline" | "default"}>
                        {t(`campaigns.${status}`)}
                      </Badge>
                    </TableCell>
                    <TableCell 
                      className="hidden lg:table-cell"
                      onClick={() => onSelectCampaign(campaign)}
                    >
                      {metrics?.view_count.toLocaleString() || '0'}
                    </TableCell>
                    <TableCell 
                      className="hidden lg:table-cell"
                      onClick={() => onSelectCampaign(campaign)}
                    >
                      {metrics?.review_count.toLocaleString() || '0'}
                    </TableCell>
                    <TableCell 
                      className="hidden lg:table-cell"
                      onClick={() => onSelectCampaign(campaign)}
                    >
                      {metrics?.conversion_rate.toFixed(1)}%
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={(e) => {
                            e.stopPropagation();
                            onSelectCampaign(campaign);
                          }}
                          aria-label={t('common.view')}
                        >
                          <EyeOpenIcon className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleEditCampaign(campaign.id);
                          }}
                          aria-label={t('common.edit')}
                        >
                          <Pencil1Icon className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteCampaign(campaign.id);
                          }}
                          aria-label={t('common.delete')}
                          className="text-destructive hover:text-destructive/90"
                        >
                          <TrashIcon className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      ) : (
        <div className="text-center p-8 border rounded-lg bg-gray-50">
          <p className="text-muted-foreground mb-4">{t('campaigns.noCampaigns')}</p>
          <Button onClick={() => navigate('/campaigns/new')}>
            {t('campaigns.createFirstCampaign')}
          </Button>
        </div>
      )}
    </div>
  );
}