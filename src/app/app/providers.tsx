"use client";

import { useState } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ShortcutProvider } from "@/lib/hooks/use-shortcuts";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Toaster } from "@/components/ui/toast";

/** Everything the authenticated app needs and the marketing site does not. */
export function AppProviders({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            // Fixture data does not go stale on its own; a short window keeps
            // navigation instant without making mutations feel unresponsive.
            staleTime: 30_000,
            gcTime: 5 * 60_000,
            retry: 1,
            refetchOnWindowFocus: false,
          },
        },
      }),
  );

  return (
    <QueryClientProvider client={queryClient}>
      <ShortcutProvider>
        <TooltipProvider>
          {children}
          <Toaster />
        </TooltipProvider>
      </ShortcutProvider>
    </QueryClientProvider>
  );
}
