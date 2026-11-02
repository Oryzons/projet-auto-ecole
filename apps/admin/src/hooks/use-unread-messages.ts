"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";

async function fetchUnreadCount(): Promise<number> {
  const res = await fetch("/api/messages/unread");
  const data = await res.json().catch(() => ({}));
  if (!res.ok) return 0;
  return typeof data.count === "number" ? data.count : 0;
}

export function useUnreadMessages(enabled = true) {
  return useQuery({
    queryKey: ["messages-unread"],
    queryFn: fetchUnreadCount,
    enabled,
    refetchInterval: 15_000,
    staleTime: 5_000,
  });
}

export function useInvalidateUnreadMessages() {
  const queryClient = useQueryClient();
  return () => queryClient.invalidateQueries({ queryKey: ["messages-unread"] });
}
