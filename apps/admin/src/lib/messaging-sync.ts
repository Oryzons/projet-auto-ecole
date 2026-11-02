import type { QueryClient } from "@tanstack/react-query";

import type { ConversationSummary } from "@/lib/messages";

let activeThreadApplicationId: string | null = null;

export function setActiveMessagingThread(applicationId: string | null) {
  activeThreadApplicationId = applicationId;
}

export function getActiveMessagingThread() {
  return activeThreadApplicationId;
}

export function sortConversations(
  conversations: ConversationSummary[],
): ConversationSummary[] {
  return [...conversations].sort((a, b) => {
    if (a.unreadCount !== b.unreadCount) {
      return b.unreadCount - a.unreadCount;
    }
    if (a.lastMessage && !b.lastMessage) return -1;
    if (!a.lastMessage && b.lastMessage) return 1;
    return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
  });
}

export function applyIncomingMessageToConversations(
  queryClient: QueryClient,
  data: {
    applicationId: string;
    preview?: string;
    senderName?: string;
  },
  options?: { incrementUnread?: boolean },
) {
  const incrementUnread = options?.incrementUnread ?? true;
  const now = new Date().toISOString();

  queryClient.setQueryData<{ conversations: ConversationSummary[] }>(
    ["conversations"],
    (old) => {
      if (!old?.conversations?.length) return old;

      const updated = old.conversations.map((conv) => {
        if (conv.applicationId !== data.applicationId) return conv;

        return {
          ...conv,
          unreadCount: incrementUnread ? conv.unreadCount + 1 : conv.unreadCount,
          messageCount: Math.max(conv.messageCount, 0) + 1,
          lastMessage: {
            content: data.preview ?? conv.lastMessage?.content ?? "",
            createdAt: now,
            senderId: conv.lastMessage?.senderId ?? "",
            senderRole: conv.lastMessage?.senderRole ?? "",
          },
          updatedAt: now,
        };
      });

      return { conversations: sortConversations(updated) };
    },
  );
}

export function markConversationReadInCache(
  queryClient: QueryClient,
  applicationId: string,
) {
  queryClient.setQueryData<{ conversations: ConversationSummary[] }>(
    ["conversations"],
    (old) => {
      if (!old) return old;
      return {
        conversations: old.conversations.map((conv) =>
          conv.applicationId === applicationId
            ? { ...conv, unreadCount: 0 }
            : conv,
        ),
      };
    },
  );
}

export async function refetchMessagingQueries(
  queryClient: QueryClient,
  applicationId?: string,
) {
  const tasks = [
    queryClient.refetchQueries({ queryKey: ["messages-unread"] }),
    queryClient.refetchQueries({ queryKey: ["conversations"] }),
  ];

  if (applicationId) {
    tasks.push(
      queryClient.refetchQueries({ queryKey: ["messages", applicationId] }),
    );
  }

  await Promise.all(tasks);
}
