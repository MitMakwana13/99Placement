import React from "react";
import { Card, CardContent } from "@/components/ui/card";

export interface KPICardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon?: React.ReactNode;
  trend?: {
    value: string | number;
    isPositive?: boolean;
  };
  colorClassName?: string; // custom bg or border indicator
}

export interface KPIGridProps {
  cards: KPICardProps[];
  columns?: number;
}

export function KPICard({ title, value, subtitle, icon, trend, colorClassName }: KPICardProps) {
  return (
    <Card className="overflow-hidden border bg-card/50 backdrop-blur-md transition-all duration-300 hover:shadow-md hover:border-foreground/20 rounded-2xl">
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">
              {title}
            </span>
            <span className="text-2xl font-black tracking-tight text-foreground block">
              {value}
            </span>
          </div>
          {icon && (
            <div className={`p-2.5 rounded-xl border ${colorClassName || "bg-muted/40 border-border/40 text-muted-foreground"}`}>
              {icon}
            </div>
          )}
        </div>
        {(subtitle || trend) && (
          <div className="mt-4 flex items-center gap-1.5 text-xs">
            {trend && (
              <span className={`font-black ${trend.isPositive ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"}`}>
                {trend.isPositive ? "+" : ""}{trend.value}%
              </span>
            )}
            {subtitle && <span className="text-muted-foreground font-medium">{subtitle}</span>}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export function KPIGrid({ cards, columns = 4 }: KPIGridProps) {
  const gridCols = {
    1: "grid-cols-1",
    2: "grid-cols-1 md:grid-cols-2",
    3: "grid-cols-1 md:grid-cols-3",
    4: "grid-cols-1 sm:grid-cols-2 lg:grid-cols-4",
    5: "grid-cols-1 sm:grid-cols-2 lg:grid-cols-5",
  }[columns] || "grid-cols-1 sm:grid-cols-2 lg:grid-cols-4";

  return (
    <div className={`grid gap-4 ${gridCols}`}>
      {cards.map((card, idx) => (
        <KPICard key={idx} {...card} />
      ))}
    </div>
  );
}
