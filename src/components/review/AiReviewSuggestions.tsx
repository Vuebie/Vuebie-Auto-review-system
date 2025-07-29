import React from 'react';
import { Loader2, RefreshCcw, Check, ThumbsUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';
import { useTranslation } from 'react-i18next';

interface AiReviewSuggestionsProps {
  isLoading: boolean;
  mainSuggestion: string;
  alternativeSuggestions: string[];
  onSelectSuggestion: (suggestion: string) => void;
  onRefreshSuggestions: () => void;
  rating: number;
}

export function AiReviewSuggestions({
  isLoading,
  mainSuggestion,
  alternativeSuggestions,
  onSelectSuggestion,
  onRefreshSuggestions,
  rating,
}: AiReviewSuggestionsProps) {
  const { t } = useTranslation();

  const handleCopyToForm = (suggestion: string) => {
    onSelectSuggestion(suggestion);
    toast.success(t('review.suggestionApplied'));
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center p-6 bg-muted/30 rounded-lg">
        <Loader2 className="h-6 w-6 animate-spin text-primary mb-2" />
        <p className="text-sm text-center text-muted-foreground">
          {t('review.generatingSuggestions')}
        </p>
      </div>
    );
  }

  // Don't show suggestions for low ratings (1-2 stars)
  if (rating < 3) {
    return null;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium">{t('review.aiSuggestions')}</h3>
        <Button
          variant="ghost"
          size="sm"
          onClick={onRefreshSuggestions}
          className="h-8 px-2 text-xs"
        >
          <RefreshCcw className="h-3.5 w-3.5 mr-1" />
          {t('review.refreshSuggestions')}
        </Button>
      </div>

      {mainSuggestion && (
        <Card className="overflow-hidden border border-primary/20 bg-primary/5">
          <CardContent className="p-4">
            <div className="flex justify-between items-start gap-2">
              <p className="text-sm flex-grow">{mainSuggestion}</p>
              <Button
                size="sm"
                variant="secondary"
                className="h-8 shrink-0 mt-0"
                onClick={() => handleCopyToForm(mainSuggestion)}
              >
                <Check className="h-3.5 w-3.5 mr-1" />
                {t('review.use')}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {alternativeSuggestions && alternativeSuggestions.length > 0 && (
        <>
          <Separator className="my-2" />
          <div className="grid gap-2">
            {alternativeSuggestions.map((suggestion, index) => (
              <Card key={index} className="overflow-hidden">
                <CardContent className="p-3">
                  <div className="flex justify-between items-start gap-2">
                    <p className="text-sm flex-grow text-muted-foreground">
                      {suggestion}
                    </p>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-7 shrink-0 mt-0"
                      onClick={() => handleCopyToForm(suggestion)}
                    >
                      <ThumbsUp className="h-3 w-3 mr-1" />
                      {t('review.use')}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </>
      )}
    </div>
  );
}