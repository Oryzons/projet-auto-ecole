"use client";

import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import type { LessonConflict, LessonDto, LessonsPayload } from "@/lib/lessons";

export class LessonError extends Error {
  constructor(
    message: string,
    public conflicts: LessonConflict[] = [],
  ) {
    super(message);
  }
}

async function send(url: string, method: string, body?: unknown) {
  const res = await fetch(url, {
    method,
    headers: body ? { "Content-Type": "application/json" } : undefined,
    body: body ? JSON.stringify(body) : undefined,
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) throw new LessonError(json.error ?? "L'action n'a pas pu aboutir.", json.conflicts);
  return json;
}

/** Leçons de la période affichée ; rechargées chaque minute pour suivre la leçon en cours. */
export function useLessons(from: Date, to: Date) {
  return useQuery({
    queryKey: ["lessons", from.toISOString(), to.toISOString()],
    queryFn: () => send(`/api/lessons?from=${encodeURIComponent(from.toISOString())}&to=${encodeURIComponent(to.toISOString())}`, "GET") as Promise<LessonsPayload>,
    placeholderData: keepPreviousData,
    refetchInterval: 60_000,
  });
}

export function useLessonMutations() {
  const queryClient = useQueryClient();
  const refresh = () => {
    for (const key of ["lessons", "vehicles", "plan", "vehicle-history"]) void queryClient.invalidateQueries({ queryKey: [key] });
  };

  const create = useMutation({
    mutationFn: (data: Record<string, unknown>) => send("/api/lessons", "POST", data) as Promise<{ lesson: LessonDto }>,
    onSuccess: refresh,
  });

  const update = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Record<string, unknown> }) => send(`/api/lessons/${id}`, "PATCH", data) as Promise<{ lesson: LessonDto }>,
    // déplacement optimiste : le bloc reste là où on l'a lâché pendant l'enregistrement
    onMutate: async ({ id, data }) => {
      await queryClient.cancelQueries({ queryKey: ["lessons"] });
      const snapshot = queryClient.getQueriesData<LessonsPayload>({ queryKey: ["lessons"] });
      queryClient.setQueriesData<LessonsPayload>({ queryKey: ["lessons"] }, (old) => {
        if (!old) return old;
        return {
          ...old,
          lessons: old.lessons.map((lesson) => {
            if (lesson.id !== id) return lesson;
            const next = { ...lesson, ...data } as LessonDto & Record<string, unknown>;
            if (data.startsAt) next.startsAt = new Date(data.startsAt as string).toISOString();
            if ("instructorId" in data) next.instructor = old.instructors.find((i) => i.id === data.instructorId) ?? lesson.instructor;
            if ("vehicleId" in data) next.vehicle = old.vehicles.find((v) => v.id === data.vehicleId) ?? null;
            return next;
          }),
        };
      });
      return { snapshot };
    },
    onError: (error, _vars, context) => {
      context?.snapshot.forEach(([key, value]) => queryClient.setQueryData(key, value));
      toast.error("Modification refusée", { description: error.message });
    },
    onSettled: refresh,
  });

  const remove = useMutation({
    mutationFn: (id: string) => send(`/api/lessons/${id}`, "DELETE"),
    onSuccess: () => {
      refresh();
      toast.success("Leçon supprimée");
    },
    onError: (error) => toast.error("Suppression impossible", { description: error.message }),
  });

  return { create, update, remove };
}
