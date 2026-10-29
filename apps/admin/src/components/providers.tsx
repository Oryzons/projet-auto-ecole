"use client";

import { SessionProvider } from "next-auth/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { MotionConfig } from "motion/react";
import { useState } from "react";

import { Toaster } from "@/components/ui/sonner";
import { AppDialogProvider } from "@/hooks/use-app-dialog";
import { LiveEventsProvider } from "@/hooks/use-live-events";

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 30_000,
            refetchOnWindowFocus: true,
          },
        },
      }),
  );

  return (
    <SessionProvider>
      <QueryClientProvider client={queryClient}>
        <MotionConfig reducedMotion="user">
          <AppDialogProvider>
            <LiveEventsProvider>
              {children}
              <Toaster />
            </LiveEventsProvider>
          </AppDialogProvider>
        </MotionConfig>
      </QueryClientProvider>
    </SessionProvider>
  );
}
