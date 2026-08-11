"use client";

import { TooltipProvider } from "@/components/ui/tooltip";
import { Toaster } from "@/components/ui/toast";

/**
 * Marketing needs tooltips and the toaster (the mock checkout confirms with
 * one) but not TanStack Query — pricing and landing content are static enough
 * to resolve on the server, which keeps the public bundle small.
 */
export function MarketingProviders({ children }: { children: React.ReactNode }) {
  return (
    <TooltipProvider>
      {children}
      <Toaster />
    </TooltipProvider>
  );
}
