"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { useSession } from "next-auth/react";
import { motion } from "motion/react";
import { ArrowLeft, FolderOpen, Inbox, MessagesSquare, Search, X } from "lucide-react";

import { SPRING } from "@/components/motion/tokens";
import { Avatar } from "@/components/ui/avatar";
import { buttonVariants } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { Segmented } from "@/components/ui/segmented";
import { Skeleton } from "@/components/ui/skeleton";
import { ApplicationStatusBadge } from "@/components/ui/status-badge";
import {
  useConversations,
  useSelectConversation,
  useSendMessage,
  useThreadMessages,
} from "@/hooks/use-messaging";
import { CONVERSATION_STARTERS_ADMIN, formatRelativeTime, type ConversationSummary } from "@/lib/messages";
import { setActiveMessagingThread } from "@/lib/messaging-sync";
import { cn } from "@/lib/utils";
import { ChatComposer, ChatMessages, ChatStarters } from "./chat";

type Filter = "active" | "unread" | "all";

function normalize(value: string) {
  return value.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();
}

function ConversationRow({
  conversation,
  selected,
  currentUserId,
  onSelect,
}: {
  conversation: ConversationSummary;
  selected: boolean;
  currentUserId?: string;
  onSelect: () => void;
}) {
  const { candidate, lastMessage, unreadCount } = conversation;
  const fromMe = lastMessage?.senderId === currentUserId;
  return (
    <button
      type="button"
      onClick={onSelect}
      className={cn(
        "relative flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left transition-colors duration-150",
        selected ? "" : "hover:bg-subtle",
      )}
    >
      {selected && (
        <motion.span layoutId="conversation-active" className="absolute inset-0 rounded-xl bg-primary-soft" transition={SPRING} />
      )}
      <span className="relative">
        <Avatar firstName={candidate.firstName} lastName={candidate.lastName} src={candidate.profilePhotoUrl} />
        {unreadCount > 0 && <span className="absolute -top-0.5 -right-0.5 size-3 rounded-full bg-primary ring-2 ring-card" />}
      </span>
      <span className="relative min-w-0 flex-1">
        <span className="flex items-baseline justify-between gap-2">
          <span className={cn("truncate text-sm text-foreground", unreadCount > 0 ? "font-semibold" : "font-medium")}>
            {candidate.firstName} {candidate.lastName}
          </span>
          {lastMessage && (
            <span className="shrink-0 text-[11px] text-muted-foreground" suppressHydrationWarning>
              {formatRelativeTime(lastMessage.createdAt)}
            </span>
          )}
        </span>
        <span className="mt-0.5 flex items-center gap-2">
          <span className={cn("min-w-0 flex-1 truncate text-[13px]", unreadCount > 0 ? "text-foreground" : "text-muted-foreground")}>
            {lastMessage ? `${fromMe ? "Vous : " : ""}${lastMessage.content}` : "Aucun message pour l'instant"}
          </span>
          {unreadCount > 0 && (
            <span className="grid h-5 min-w-5 place-items-center rounded-full bg-primary px-1.5 text-[11px] font-semibold text-white">
              {unreadCount}
            </span>
          )}
        </span>
      </span>
    </button>
  );
}

export function AdminMessagingView() {
  const { data: session } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();
  const selectedId = searchParams.get("application");

  const [filter, setFilter] = useState<Filter>("active");
  const [query, setQuery] = useState("");
  const [drafts, setDrafts] = useState<Record<string, string>>({});
  const [sendError, setSendError] = useState<string | null>(null);

  const { data: convData, isLoading } = useConversations();
  const { data: messagesData, isLoading: messagesLoading } = useThreadMessages(selectedId);
  const send = useSendMessage();
  const markRead = useSelectConversation();

  const conversations = useMemo(() => convData?.conversations ?? [], [convData]);
  const selected = conversations.find((c) => c.applicationId === selectedId);
  const unreadTotal = conversations.reduce((sum, c) => sum + c.unreadCount, 0);
  const content = selectedId ? drafts[selectedId] ?? "" : "";

  const visible = useMemo(() => {
    const q = normalize(query.trim());
    return conversations.filter((c) => {
      if (q) {
        return normalize(`${c.candidate.firstName} ${c.candidate.lastName} ${c.candidate.email}`).includes(q);
      }
      if (filter === "unread") return c.unreadCount > 0;
      if (filter === "active") return c.messageCount > 0;
      return true;
    });
  }, [conversations, filter, query]);

  useEffect(() => {
    setActiveMessagingThread(selectedId);
    return () => setActiveMessagingThread(null);
  }, [selectedId]);

  function select(applicationId: string | null) {
    setSendError(null);
    if (applicationId) markRead(applicationId);
    router.replace(applicationId ? `/admin/messages?application=${applicationId}` : "/admin/messages", { scroll: false });
  }

  async function handleSend(text?: string) {
    const message = (text ?? content).trim();
    if (!message || !selectedId) return;
    setSendError(null);
    try {
      await send.mutateAsync({ applicationId: selectedId, content: message });
      setDrafts((current) => ({ ...current, [selectedId]: "" }));
    } catch (err) {
      setSendError(err instanceof Error ? err.message : "Le message n'a pas pu être envoyé.");
    }
  }

  return (
    <Card className="h-[calc(100svh-4rem-1.5rem-6.5rem-env(safe-area-inset-bottom))] min-h-[480px] gap-0 overflow-hidden p-0 lg:h-[calc(100svh-4rem-5rem)]">
      <div className="grid h-full min-h-0 lg:grid-cols-[340px_1fr]">
        <aside className={cn("flex min-h-0 flex-col border-r border-border", selectedId && "hidden lg:flex")}>
          <div className="shrink-0 space-y-3 border-b border-border p-4">
            <div className="flex items-center justify-between">
              <p className="text-[15px] font-semibold text-foreground">Conversations</p>
              {unreadTotal > 0 && (
                <span className="rounded-full bg-primary-soft px-2 py-0.5 text-xs font-semibold text-primary-strong">
                  {unreadTotal} non lu{unreadTotal > 1 ? "s" : ""}
                </span>
              )}
            </div>
            <div className="group/input relative">
              <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground group-focus-within/input:text-primary" />
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Rechercher un élève…"
                className="h-10 w-full rounded-xl border border-input bg-subtle pr-9 pl-9 text-sm outline-none transition-[border-color,box-shadow,background-color] focus:border-primary focus:bg-card focus:ring-4 focus:ring-ring/10"
              />
              {query && (
                <button type="button" onClick={() => setQuery("")} aria-label="Effacer" className="absolute top-1/2 right-2.5 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                  <X className="size-4" />
                </button>
              )}
            </div>
            {!query && (
              <Segmented
                size="sm"
                className="w-full"
                value={filter}
                onChange={setFilter}
                options={[
                  { value: "active", label: "Récentes" },
                  { value: "unread", label: "Non lues", count: unreadTotal || undefined },
                  { value: "all", label: "Tous" },
                ]}
              />
            )}
          </div>
          <div className="scroll-area min-h-0 flex-1 overflow-y-auto p-2">
            {isLoading ? (
              <div className="space-y-2 p-2">
                {Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <Skeleton className="size-10 rounded-full" />
                    <div className="flex-1 space-y-1.5">
                      <Skeleton className="h-3.5 w-1/2" />
                      <Skeleton className="h-3 w-4/5" />
                    </div>
                  </div>
                ))}
              </div>
            ) : visible.length === 0 ? (
              <EmptyState
                compact
                icon={Inbox}
                title={query ? "Aucun élève trouvé" : filter === "unread" ? "Tout est lu" : "Aucune conversation"}
                description={query ? "Vérifiez l'orthographe du nom ou de l'email." : filter === "active" ? "Choisissez « Tous » pour écrire à un élève." : undefined}
              />
            ) : (
              visible.map((conversation) => (
                <ConversationRow
                  key={conversation.applicationId}
                  conversation={conversation}
                  selected={conversation.applicationId === selectedId}
                  currentUserId={session?.user?.id}
                  onSelect={() => select(conversation.applicationId)}
                />
              ))
            )}
          </div>
        </aside>

        <section className={cn("flex min-h-0 flex-col", !selectedId && "hidden lg:flex")}>
          {selectedId ? (
            <>
              <div className="flex shrink-0 items-center gap-3 border-b border-border px-4 py-3 sm:px-5">
                <button
                  type="button"
                  onClick={() => select(null)}
                  aria-label="Retour aux conversations"
                  className="-ml-1 grid size-9 place-items-center rounded-lg text-muted-foreground hover:bg-secondary hover:text-foreground lg:hidden"
                >
                  <ArrowLeft className="size-4" />
                </button>
                {selected ? (
                  <>
                    <Avatar firstName={selected.candidate.firstName} lastName={selected.candidate.lastName} src={selected.candidate.profilePhotoUrl} />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-[15px] font-semibold text-foreground">
                        {selected.candidate.firstName} {selected.candidate.lastName}
                      </p>
                      <p className="truncate text-xs text-muted-foreground">{selected.candidate.email}</p>
                    </div>
                    <ApplicationStatusBadge status={selected.status} className="hidden md:inline-flex" />
                    <Link href={`/admin/applications/${selected.applicationId}`} className={buttonVariants({ variant: "outline", size: "sm" })}>
                      <FolderOpen />
                      <span className="hidden sm:inline">Dossier</span>
                    </Link>
                  </>
                ) : (
                  <Skeleton className="h-10 w-48" />
                )}
              </div>
              <ChatMessages
                key={selectedId}
                messages={messagesData?.messages ?? []}
                currentUserId={session?.user?.id}
                loading={messagesLoading}
                empty={
                  <ChatStarters
                    title="Démarrer la conversation"
                    description="L'élève reçoit aussi votre message par email."
                    starters={CONVERSATION_STARTERS_ADMIN}
                    onSelect={(text) => void handleSend(text)}
                  />
                }
              />
              <ChatComposer
                value={content}
                onChange={(value) => setDrafts((current) => ({ ...current, [selectedId]: value }))}
                onSend={() => void handleSend()}
                sending={send.isPending}
                error={sendError}
                placeholder="Écrire à l'élève…"
              />
            </>
          ) : (
            <div className="grid h-full place-items-center">
              <EmptyState
                icon={MessagesSquare}
                title="Sélectionnez une conversation"
                description="Les messages des élèves arrivent ici en direct. Ils sont aussi notifiés par email de vos réponses."
              />
            </div>
          )}
        </section>
      </div>
    </Card>
  );
}
