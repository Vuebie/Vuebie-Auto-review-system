import React from 'react';
import { cn } from '../../lib/utils';

interface Tab {
  id: string;
  label: string;
  disabled?: boolean;
}

interface CampaignTabsProps {
  tabs: Tab[];
  activeTab: string;
  onChange: (tabId: string) => void;
}

export default function CampaignTabs({
  tabs,
  activeTab,
  onChange,
}: CampaignTabsProps) {
  return (
    <div className="border-b">
      <div className="flex overflow-x-auto">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => !tab.disabled && onChange(tab.id)}
            className={cn(
              'px-4 py-2 text-sm font-medium whitespace-nowrap',
              'border-b-2 transition-colors',
              activeTab === tab.id
                ? 'border-primary text-primary'
                : 'border-transparent text-muted-foreground hover:text-foreground',
              tab.disabled && 'opacity-50 cursor-not-allowed'
            )}
            disabled={tab.disabled}
            aria-selected={activeTab === tab.id}
            aria-disabled={tab.disabled}
          >
            {tab.label}
          </button>
        ))}
      </div>
    </div>
  );
}