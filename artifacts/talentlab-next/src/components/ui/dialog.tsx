"use client";

import React, { useEffect } from "react";
import { X } from "lucide-react";
import { twMerge } from "tailwind-merge";
import { Card, CardHeader, CardTitle, CardContent } from "./card";

interface DialogProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  className?: string;
}

export function Dialog({ isOpen, onClose, title, children, className }: DialogProps) {
  // Prevent scrolling behind dialog overlay
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Overlay background shade */}
      <div
        className="fixed inset-0 bg-zinc-950/40 backdrop-blur-sm transition-opacity duration-300"
        onClick={onClose}
      />

      {/* Dialog container */}
      <Card
        className={twMerge(
          "w-full max-w-lg relative z-10 border border-border shadow-2xl p-2 animate-zoom-in bg-card max-h-[90vh] flex flex-col",
          className
        )}
      >
        <CardHeader className="flex flex-row items-center justify-between border-b border-border/40 pb-4">
          <CardTitle className="text-xl font-extrabold tracking-tight">{title}</CardTitle>
          <button
            onClick={onClose}
            className="p-2 hover:bg-muted/40 rounded-xl transition-all cursor-pointer text-muted-foreground hover:text-foreground"
          >
            <X className="h-4.5 w-4.5" />
          </button>
        </CardHeader>
        <CardContent className="pt-6 overflow-y-auto flex-1 pr-4 mr-[-10px]">
          {children}
        </CardContent>
      </Card>
    </div>
  );
}
