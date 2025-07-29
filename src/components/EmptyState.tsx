import { Button } from "@/components/ui/button";
import {
  Gift,
  FileText,
  Store,
  QrCode,
  Settings,
  Users,
  BarChart,
  Plus
} from "lucide-react";

interface EmptyStateProps {
  title: string;
  description?: string;
  icon?: "gift" | "document" | "store" | "qrcode" | "settings" | "users" | "chart";
  action?: {
    label: string;
    onClick: () => void;
  };
}

export function EmptyState({ title, description, icon, action }: EmptyStateProps) {
  const Icon = () => {
    switch (icon) {
      case "gift":
        return <Gift className="h-12 w-12 text-muted-foreground" />;
      case "document":
        return <FileText className="h-12 w-12 text-muted-foreground" />;
      case "store":
        return <Store className="h-12 w-12 text-muted-foreground" />;
      case "qrcode":
        return <QrCode className="h-12 w-12 text-muted-foreground" />;
      case "settings":
        return <Settings className="h-12 w-12 text-muted-foreground" />;
      case "users":
        return <Users className="h-12 w-12 text-muted-foreground" />;
      case "chart":
        return <BarChart className="h-12 w-12 text-muted-foreground" />;
      default:
        return <Plus className="h-12 w-12 text-muted-foreground" />;
    }
  };

  return (
    <div className="flex flex-col items-center justify-center h-64 border border-dashed rounded-lg p-8">
      <div className="mb-4">
        <Icon />
      </div>
      <h3 className="text-lg font-medium text-center">{title}</h3>
      {description && (
        <p className="text-sm text-muted-foreground text-center mt-1 mb-4 max-w-md">
          {description}
        </p>
      )}
      {action && (
        <Button onClick={action.onClick}>
          <Plus className="h-4 w-4 mr-2" />
          {action.label}
        </Button>
      )}
    </div>
  );
}