import { HTMLAttributes } from "react";
import { cn } from "@/lib/utils";

interface SpinnerProps extends HTMLAttributes<HTMLDivElement> {
  size?: "sm" | "md" | "lg";
}

export function Spinner({ className, size = "md", ...props }: SpinnerProps) {
  return (
    <div
      className={cn(
        "animate-spin rounded-full border-t-2 border-primary",
        {
          "h-4 w-4 border-b-2": size === "sm",
          "h-8 w-8 border-b-2": size === "md",
          "h-12 w-12 border-b-3": size === "lg",
        },
        className
      )}
      {...props}
    />
  );
}