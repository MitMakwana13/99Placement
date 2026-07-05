import React from "react";
import { cn } from "@/lib/utils";

export type LabelProps = React.LabelHTMLAttributes<HTMLLabelElement>;

export function Label({ className, ...props }: LabelProps) {
  return (
    <label
      className={cn(
        "text-xs font-bold leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 text-foreground",
        className
      )}
      {...props}
    />
  );
}
