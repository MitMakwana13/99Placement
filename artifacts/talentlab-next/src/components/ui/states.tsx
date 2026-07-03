"use client";

import React from "react";
import { SearchX, ShieldAlert, Sparkles } from "lucide-react";
import { Button } from "./button";
import { Card, CardContent } from "./card";

interface EmptyStateProps {
  title?: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
  icon?: React.ReactNode;
}

export function EmptyState({
  title = "No matches found",
  description,
  actionLabel,
  onAction,
  icon,
}: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center p-8 text-center max-w-sm mx-auto space-y-4">
      <div className="p-3 bg-muted/50 rounded-2xl text-muted-foreground">
        {icon || <SearchX className="h-8 w-8" />}
      </div>
      <div className="space-y-1">
        <h4 className="text-sm font-bold text-foreground">{title}</h4>
        <p className="text-xs text-muted-foreground leading-relaxed">{description}</p>
      </div>
      {actionLabel && onAction && (
        <Button size="sm" onClick={onAction}>
          {actionLabel}
        </Button>
      )}
    </div>
  );
}

interface ErrorStateProps {
  title?: string;
  description?: string;
  onRetry?: () => void;
}

export function ErrorState({
  title = "Failed to load database content",
  description = "Please double check your server connection or check environment configurations.",
  onRetry,
}: ErrorStateProps) {
  return (
    <Card className="border border-destructive/20 bg-destructive/5 max-w-md mx-auto">
      <CardContent className="p-6 flex flex-col items-center justify-center text-center space-y-4">
        <div className="p-2.5 bg-destructive/10 text-destructive rounded-xl">
          <ShieldAlert className="h-6 w-6" />
        </div>
        <div className="space-y-1">
          <h4 className="text-sm font-bold text-foreground">{title}</h4>
          <p className="text-xs text-muted-foreground leading-relaxed">{description}</p>
        </div>
        {onRetry && (
          <Button variant="outline" size="sm" onClick={onRetry}>
            Retry Request
          </Button>
        )}
      </CardContent>
    </Card>
  );
}

export function LoadingState({ message = "Retrieving database payload..." }: { message?: string }) {
  return (
    <div className="flex flex-col items-center justify-center p-12 space-y-3">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      <span className="text-xs text-muted-foreground font-semibold">{message}</span>
    </div>
  );
}

export function Skeleton({ className }: { className?: string }) {
  return (
    <div className={`animate-pulse rounded-2xl bg-muted/60 ${className || "h-4 w-full"}`} />
  );
}

export function ListSkeleton() {
  return (
    <div className="space-y-3.5">
      <Skeleton className="h-12 w-full" />
      <Skeleton className="h-10 w-full" />
      <Skeleton className="h-10 w-full" />
      <Skeleton className="h-10 w-full" />
    </div>
  );
}
