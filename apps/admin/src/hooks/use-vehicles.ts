"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import type { VehicleHistoryDto } from "@/lib/vehicle-history";
import type { VehicleDto } from "@/lib/vehicles";

async function send(url: string, method: string, body?: unknown) {
  const res = await fetch(url, {
    method,
    headers: body ? { "Content-Type": "application/json" } : undefined,
    body: body ? JSON.stringify(body) : undefined,
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(json.error ?? "L'action n'a pas pu aboutir.");
  return json;
}

export function useVehicles() {
  // rechargée chaque minute : une leçon qui commence fait apparaître sa barre de progression
  return useQuery({ queryKey: ["vehicles"], queryFn: () => send("/api/vehicles", "GET") as Promise<{ vehicles: VehicleDto[] }>, refetchInterval: 60_000 });
}

/** Création, modification et suppression : la liste, le plan et les tâches se mettent à jour ensemble. */
export function useVehicleMutations() {
  const queryClient = useQueryClient();
  const refresh = () => {
    for (const key of ["vehicles", "plan", "tasks", "vehicle-history"]) void queryClient.invalidateQueries({ queryKey: [key] });
  };

  const save = useMutation({
    mutationFn: ({ id, data }: { id?: string; data: Record<string, unknown> }) =>
      send(id ? `/api/vehicles/${id}` : "/api/vehicles", id ? "PATCH" : "POST", data) as Promise<{ vehicle: VehicleDto }>,
    onSuccess: ({ vehicle }, { id }) => {
      refresh();
      toast.success(id ? "Véhicule modifié" : "Véhicule ajouté au parc", { description: `${vehicle.name} · ${vehicle.plate}` });
    },
  });

  const remove = useMutation({
    mutationFn: (vehicle: VehicleDto) => send(`/api/vehicles/${vehicle.id}`, "DELETE"),
    onSuccess: (_data, vehicle) => {
      refresh();
      toast.success("Véhicule supprimé", { description: `${vehicle.name} · ${vehicle.plate}` });
    },
    onError: (error) => toast.error("Suppression impossible", { description: error.message }),
  });

  return { save, remove };
}

/** Historique d'un véhicule : leçons avec compte rendu, documents et journal. */
export function useVehicleHistory(id: string | null) {
  return useQuery({
    queryKey: ["vehicle-history", id],
    queryFn: () => send(`/api/vehicles/${id}/history`, "GET") as Promise<VehicleHistoryDto>,
    enabled: Boolean(id),
  });
}

export function useVehicleHistoryMutations(id: string) {
  const queryClient = useQueryClient();
  const url = `/api/vehicles/${id}/history`;
  const done = (data: VehicleHistoryDto) => {
    queryClient.setQueryData(["vehicle-history", id], data);
    // un document peut changer une échéance de la fiche
    void queryClient.invalidateQueries({ queryKey: ["vehicles"] });
  };

  const addDocument = useMutation({
    mutationFn: (data: Record<string, unknown>) => send(url, "POST", { entry: "document", ...data }) as Promise<VehicleHistoryDto>,
    onSuccess: (data) => {
      done(data);
      toast.success("Document ajouté");
    },
  });
  const removeDocument = useMutation({
    mutationFn: (docId: string) => send(`${url}?document=${docId}`, "DELETE") as Promise<VehicleHistoryDto>,
    onSuccess: (data) => {
      done(data);
      toast.success("Document retiré");
    },
    onError: (error) => toast.error("Retrait impossible", { description: error.message }),
  });
  const addJournal = useMutation({
    mutationFn: (data: { kind: string; comment: string }) => send(url, "POST", { entry: "journal", ...data }) as Promise<VehicleHistoryDto>,
    onSuccess: done,
  });
  return { addDocument, removeDocument, addJournal };
}
