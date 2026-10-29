"use client";

import type { ReactNode } from "react";

import { PlanView } from "@/components/plan/plan-view";
import { TooltipProvider } from "@/components/ui/tooltip";
import { adminNav } from "@/lib/navigation";
import type { PlanData } from "@/lib/plan-types";

import { NavigationProgress } from "./navigation-progress";
import { PagePopup } from "./page-popup";
import { RouteWarmup } from "./route-warmup";

/**
 * Administration : le plan de l'auto-école occupe tout l'écran,
 * et chaque page (dossiers, calendrier, réglages…) s'ouvre en fenêtre par-dessus.
 */
export function ImmersiveShell({ initialPlan, children }: { initialPlan: PlanData; children: ReactNode }) {
  return (
    <TooltipProvider delay={300}>
      <NavigationProgress>
        <RouteWarmup config={adminNav} />
        <div className="h-svh overflow-hidden bg-background">
          <PlanView initial={initialPlan} />
        </div>
        <PagePopup>{children}</PagePopup>
      </NavigationProgress>
    </TooltipProvider>
  );
}
