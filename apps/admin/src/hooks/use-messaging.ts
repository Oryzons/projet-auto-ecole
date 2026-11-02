"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import type { ConversationSummary } from "@/lib/messages";
import { markConversationReadInCache } from "@/lib/messaging-sync";

export interface ChatMessage {
  id: string;
  content: string;
  createdAt: string;
  readAt?: string | null;
  sender: {
    id: string;
    firstName: string;
    lastName: string;
    role: string;
  };
}

async function parseJsonResponse(res: Response) {
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.error ?? "Une erreur est survenue");
  }
  return data;
}

export function useConversations(enabled = true) {
  return useQuery({
    queryKey: ["conversations"],
    queryFn: () =>
      fetch("/api/messages/conversations").then(parseJsonResponse) as Promise<{
        conversations: ConversationSummary[];
      }>,
    enabled,
    staleTime: 0,
    refetchInterval: 15_000,
  });
}

export function useSelectConversation() {
  const queryClient = useQueryClient();

  return (applicationId: string) => {
    markConversationReadInCache(queryClient, applicationId);
    void queryClient.invalidateQueries({ queryKey: ["messages-unread"] });
  };
}

export function useThreadMessages(applicationId: string | null) {
  const queryClient = useQueryClient();

  return useQuery({
    queryKey: ["messages", applicationId],
    queryFn: async () => {
      const res = await fetch(`/api/messages?applicationId=${applicationId}`);
      const data = (await parseJsonResponse(res)) as { messages: ChatMessage[] };
      if (applicationId) {
        markConversationReadInCache(queryClient, applicationId);
        void queryClient.invalidateQueries({ queryKey: ["messages-unread"] });
        void queryClient.invalidateQueries({ queryKey: ["conversations"] });
      }
      return data;
    },
    enabled: !!applicationId,
    staleTime: 0,
    refetchInterval: 10_000,
  });
}

export function useSendMessage() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      applicationId,
      content,
    }: {
      applicationId: string;
      content: string;
    }) => {
      const res = await fetch("/api/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ applicationId, content }),
      });
      return parseJsonResponse(res);
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["messages", variables.applicationId] });
      queryClient.invalidateQueries({ queryKey: ["conversations"] });
    },
  });
}
