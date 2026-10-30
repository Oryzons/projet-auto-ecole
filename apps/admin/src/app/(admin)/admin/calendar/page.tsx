"use client";

import { useSearchParams } from "next/navigation";
import { useSession } from "next-auth/react";
import { useState } from "react";

import { DrivingPlanner } from "@/components/calendar/driving-planner";
import { TheoryCalendar } from "@/components/calendar/theory-calendar";
import { PageHeader } from "@/components/ui/page-header";
import { Segmented } from "@/components/ui/segmented";

type Tab = "driving" | "theory";

/** Planning : leçons de conduite (par moniteur ou véhicule) et séances de code collectives. */
export default function StaffPlanningPage() {
  const searchParams = useSearchParams();
  const sessionId = searchParams.get("session");
  const isAdmin = useSession().data?.user?.role === "ADMIN";
  const [tab, setTab] = useState<Tab>(() => (sessionId || searchParams.get("tab") === "code" ? "theory" : "driving"));

  function changeTab(next: Tab) {
    setTab(next);
    const url = new URL(window.location.href);
    url.searchParams.delete("session");
    url.searchParams.delete("lesson");
    if (next === "theory") url.searchParams.set("tab", "code");
    else url.searchParams.delete("tab");
    window.history.replaceState(null, "", url);
  }

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow={tab === "driving" ? "Leçons de conduite" : "Séances de code"}
        title="Planning"
        description={
          tab === "driving" && !isAdmin
            ? "Vos leçons de conduite du jour et de la semaine, avec les comptes rendus."
            : tab === "driving"
            ? "Organisez les leçons par moniteur ou par véhicule, déplacez-les d'un geste : les conflits sont bloqués."
            : "Créez les dates de cours, suivez les inscriptions et faites l'appel."
        }
        actions={
          <Segmented
            options={[
              { value: "driving", label: "Conduite" },
              { value: "theory", label: "Code" },
            ]}
            value={tab}
            onChange={changeTab}
          />
        }
      />
      {tab === "driving" ? <DrivingPlanner initialLessonId={searchParams.get("lesson")} /> : <TheoryCalendar initialSessionId={sessionId} />}
    </div>
  );
}
