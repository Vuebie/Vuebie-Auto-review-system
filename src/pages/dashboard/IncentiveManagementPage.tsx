import React, { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { useToast } from '@/components/ui/use-toast';
import { Button } from '@/components/ui/button';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogHeader, 
  DialogTitle, 
  DialogFooter 
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Loader2, Plus } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { IncentiveCard } from '@/components/incentives/IncentiveCard';
import { IncentiveForm } from '@/components/incentives/IncentiveForm';
import { IncentiveStats } from '@/components/incentives/IncentiveStats';
import { Input } from "@/components/ui/input";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { 
  getIncentives, 
  createIncentive, 
  updateIncentive, 
  deleteIncentive,
  Incentive 
} from '@/lib/incentives';
import { useAuth } from '@/contexts/AuthContext';
import { EmptyState } from '@/components/EmptyState';

export default function IncentiveManagementPage() {
  const { user, userProfile } = useAuth();
  const { t } = useTranslation();
  const { toast } = useToast();
  const [incentives, setIncentives] = useState<Incentive[]>([]);
  const [filteredIncentives, setFilteredIncentives] = useState<Incentive[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');
  const [activeTab, setActiveTab] = useState<'all' | 'active' | 'inactive'>('all');
  
  // Dialog state
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState<boolean>(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState<boolean>(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState<boolean>(false);
  const [isStatsDialogOpen, setIsStatsDialogOpen] = useState<boolean>(false);
  const [selectedIncentive, setSelectedIncentive] = useState<Incentive | null>(null);

  // Fetch incentives
  const fetchIncentives = useCallback(async () => {
    if (!user?.id) return;
    
    setIsLoading(true);
    try {
      const merchantId = userProfile?.merchant_id || user.id;
      const data = await getIncentives(merchantId);
      setIncentives(data);
    } catch (error) {
      console.error('Failed to fetch incentives:', error);
      toast({
        title: 'Error',
        description: 'Failed to fetch incentives. Please try again later.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  }, [user?.id, userProfile?.merchant_id, toast]);

  // Initial fetch
  useEffect(() => {
    fetchIncentives();
  }, [fetchIncentives]);

  // Filter incentives based on search and status filter
  useEffect(() => {
    let filtered = [...incentives];

    // Apply search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (incentive) =>
          incentive.name.toLowerCase().includes(query) ||
          (incentive.description && incentive.description.toLowerCase().includes(query))
      );
    }

    // Apply status filter
    if (statusFilter === 'active') {
      filtered = filtered.filter((incentive) => incentive.active);
    } else if (statusFilter === 'inactive') {
      filtered = filtered.filter((incentive) => !incentive.active);
    }

    setFilteredIncentives(filtered);
  }, [incentives, searchQuery, statusFilter]);

  // Define IncentiveFormData type
  interface IncentiveFormData {
    name: string;
    description?: string;
    type: string;
    value: number;
    code_prefix?: string;
    expiry_date?: string;
    active: boolean;
    [key: string]: string | number | boolean | undefined; // For additional fields with specific types
  }

  // Create a new incentive
  const handleCreateIncentive = async (formData: IncentiveFormData) => {
    if (!user?.id) return;

    setIsSubmitting(true);
    try {
      const merchantId = userProfile?.merchant_id || user.id;
      await createIncentive({
        ...formData,
        merchant_id: merchantId,
      });

      toast({
        title: 'Success',
        description: 'Incentive created successfully!',
      });
      setIsCreateDialogOpen(false);
      fetchIncentives();
    } catch (error) {
      console.error('Failed to create incentive:', error);
      toast({
        title: 'Error',
        description: 'Failed to create incentive. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Update an existing incentive
  const handleUpdateIncentive = async (formData: IncentiveFormData) => {
    if (!selectedIncentive?.id) return;

    setIsSubmitting(true);
    try {
      await updateIncentive(selectedIncentive.id, formData);

      toast({
        title: 'Success',
        description: 'Incentive updated successfully!',
      });
      setIsEditDialogOpen(false);
      fetchIncentives();
    } catch (error) {
      console.error('Failed to update incentive:', error);
      toast({
        title: 'Error',
        description: 'Failed to update incentive. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Delete an incentive
  const handleDeleteIncentive = async () => {
    if (!selectedIncentive?.id) return;

    setIsSubmitting(true);
    try {
      await deleteIncentive(selectedIncentive.id);

      toast({
        title: 'Success',
        description: 'Incentive deleted successfully!',
      });
      setIsDeleteDialogOpen(false);
      fetchIncentives();
    } catch (error) {
      console.error('Failed to delete incentive:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete incentive. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Open edit dialog with selected incentive
  const handleEditClick = (incentive: Incentive) => {
    setSelectedIncentive(incentive);
    setIsEditDialogOpen(true);
  };

  // Open delete confirmation dialog
  const handleDeleteClick = (incentive: Incentive) => {
    setSelectedIncentive(incentive);
    setIsDeleteDialogOpen(true);
  };

  // Open stats dialog
  const handleStatsClick = (incentive: Incentive) => {
    setSelectedIncentive(incentive);
    setIsStatsDialogOpen(true);
  };

  // Handle tab change
  const handleTabChange = (tab: string) => {
    setActiveTab(tab as 'all' | 'active' | 'inactive');
    setStatusFilter(tab as 'all' | 'active' | 'inactive');
  };

  return (
    <DashboardLayout
      title={t('incentives.management')}
      description={t('incentives.managementDescription')}
    >
      <div className="space-y-6">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <Button onClick={() => setIsCreateDialogOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            {t('incentives.createNew')}
          </Button>
        </div>

      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <Tabs 
          defaultValue="all" 
          className="w-full" 
          value={activeTab} 
          onValueChange={handleTabChange}
        >
          <TabsList className="grid w-full sm:w-[400px] grid-cols-3">
            <TabsTrigger value="all">All</TabsTrigger>
            <TabsTrigger value="active">Active</TabsTrigger>
            <TabsTrigger value="inactive">Inactive</TabsTrigger>
          </TabsList>
        </Tabs>
        
        <div className="w-full sm:w-auto">
          <Input
            placeholder="Search incentives..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full sm:w-[300px]"
          />
        </div>
      </div>

      {isLoading ? (
        <div className="flex justify-center items-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : filteredIncentives.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredIncentives.map((incentive) => (
            <IncentiveCard
              key={incentive.id}
              incentive={incentive}
              onEdit={handleEditClick}
              onDelete={handleDeleteClick}
              onViewStats={handleStatsClick}
            />
          ))}
        </div>
      ) : (
        <EmptyState
          title="No incentives found"
          description={searchQuery ? "Try a different search term" : "Create your first incentive to get started"}
          icon="gift"
          action={searchQuery ? undefined : {
            label: "Create Incentive",
            onClick: () => setIsCreateDialogOpen(true)
          }}
        />
      )}

      {/* Create Dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Create New Incentive</DialogTitle>
            <DialogDescription>
              Create a new incentive to reward customers for their reviews.
            </DialogDescription>
          </DialogHeader>
          <IncentiveForm
            onSubmit={handleCreateIncentive}
            isLoading={isSubmitting}
          />
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Incentive</DialogTitle>
            <DialogDescription>
              Update the incentive details.
            </DialogDescription>
          </DialogHeader>
          {selectedIncentive && (
            <IncentiveForm
              incentive={selectedIncentive}
              onSubmit={handleUpdateIncentive}
              isLoading={isSubmitting}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Incentive</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this incentive? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isSubmitting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault();
                handleDeleteIncentive();
              }}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Deleting...
                </>
              ) : (
                'Delete'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Stats Dialog */}
      <Dialog open={isStatsDialogOpen} onOpenChange={setIsStatsDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Incentive Statistics</DialogTitle>
            <DialogDescription>
              Performance metrics for {selectedIncentive?.name}
            </DialogDescription>
          </DialogHeader>
          {selectedIncentive && (
            <IncentiveStats incentive={selectedIncentive} />
          )}
          <DialogFooter>
            <Button onClick={() => setIsStatsDialogOpen(false)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
    </DashboardLayout>
  );
}