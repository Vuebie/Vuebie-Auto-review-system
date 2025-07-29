import React from 'react';
import { Incentive } from '@/lib/incentives';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar, Edit, Trash2, Award, Tag, CheckCircle, XCircle } from 'lucide-react';
import { format } from 'date-fns';

interface IncentiveCardProps {
  incentive: Incentive;
  onEdit: (incentive: Incentive) => void;
  onDelete: (incentive: Incentive) => void;
  onViewStats: (incentive: Incentive) => void;
}

export function IncentiveCard({ incentive, onEdit, onDelete, onViewStats }: IncentiveCardProps) {
  // Formatter for incentive value display
  const formatValue = () => {
    if (incentive.type === 'discount') {
      return `${incentive.value}% off`;
    } else if (incentive.type === 'points') {
      return `${incentive.value} points`;
    } else if (incentive.type === 'voucher' && incentive.value) {
      return `$${incentive.value.toFixed(2)}`;
    } else {
      return incentive.value || '';
    }
  };

  // Type label and icon
  const getTypeInfo = () => {
    switch (incentive.type) {
      case 'voucher':
        return { label: 'Voucher', icon: <Tag className="h-4 w-4" /> };
      case 'discount':
        return { label: 'Discount', icon: <Tag className="h-4 w-4" /> };
      case 'points':
        return { label: 'Points', icon: <Award className="h-4 w-4" /> };
      case 'lucky_draw':
        return { label: 'Lucky Draw', icon: <Award className="h-4 w-4" /> };
      case 'free_item':
        return { label: 'Free Item', icon: <Award className="h-4 w-4" /> };
      default:
        return { label: 'Other', icon: <Tag className="h-4 w-4" /> };
    }
  };

  const typeInfo = getTypeInfo();

  return (
    <Card className="w-full">
      <CardHeader className="pb-2">
        <div className="flex justify-between items-start">
          <div>
            <CardTitle className="text-lg">{incentive.name}</CardTitle>
            <CardDescription className="mt-1">{incentive.description || 'No description provided'}</CardDescription>
          </div>
          <Badge variant={incentive.active ? "default" : "outline"}>
            {incentive.active ? <CheckCircle className="h-3 w-3 mr-1" /> : <XCircle className="h-3 w-3 mr-1" />}
            {incentive.active ? 'Active' : 'Inactive'}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="pb-2">
        <div className="grid gap-2">
          <div className="flex items-center text-sm">
            {typeInfo.icon}
            <span className="ml-1">{typeInfo.label}: {formatValue()}</span>
          </div>
          
          {incentive.expires_at && (
            <div className="flex items-center text-sm text-muted-foreground">
              <Calendar className="h-4 w-4 mr-1" />
              <span>Expires on {format(new Date(incentive.expires_at), 'MMM d, yyyy')}</span>
            </div>
          )}
          
          {incentive.min_rating && (
            <div className="text-sm text-muted-foreground">
              Minimum rating: {incentive.min_rating} stars
            </div>
          )}
          
          {incentive.min_review_length && (
            <div className="text-sm text-muted-foreground">
              Minimum review length: {incentive.min_review_length} characters
            </div>
          )}
          
          {incentive.max_per_user && (
            <div className="text-sm text-muted-foreground">
              Maximum per user: {incentive.max_per_user}
            </div>
          )}
          
          <div className="text-sm">
            <Badge variant="secondary" className="mr-1">
              {incentive.issued_count || 0} issued
            </Badge>
          </div>
        </div>
      </CardContent>
      <CardFooter className="pt-2">
        <div className="flex justify-between w-full">
          <Button variant="outline" size="sm" onClick={() => onViewStats(incentive)}>
            Statistics
          </Button>
          <div className="space-x-2">
            <Button variant="ghost" size="icon" onClick={() => onEdit(incentive)}>
              <Edit className="h-4 w-4" />
              <span className="sr-only">Edit</span>
            </Button>
            <Button variant="ghost" size="icon" onClick={() => onDelete(incentive)}>
              <Trash2 className="h-4 w-4" />
              <span className="sr-only">Delete</span>
            </Button>
          </div>
        </div>
      </CardFooter>
    </Card>
  );
}