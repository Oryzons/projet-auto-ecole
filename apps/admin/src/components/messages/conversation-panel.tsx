"use client";

import { ExternalLink } from "lucide-react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { useEffect, useState } from "react";

import { Avatar } from "@/components/ui/avatar";
import { SidePanel } from "@/components/ui/side-panel";
import { useSelectConversation, useSendMessage, useThreadMessages } from "@/hooks/use-messaging";
import { CONVERSATION_STARTERS_ADMIN } from "@/lib/messages";
import { setActiveMessagingThread } from "@/lib/messaging-sync";

import { ChatComposer, ChatMessages, ChatStarters } from "./chat";

type Candidate = { firstName: string; lastName: string; email: string; profilePhotoUrl?: string | null };

/** Conversation avec un seul élève, dans le panneau de droite (depuis son dossier). */
export function ConversationPanel({
  applicationId,
  candidate,
  open,
  onOpenChange,
}: {
  applicationId: string;
  candidate: Candidate;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  return (
    <SidePanel open={open} onOpenChange={onOpenChange}>
      {open && <Conversation applicationId={applicationId} candidate={candidate} />}
    </SidePanel>
  );
}

function Conversation({ applicationId, candidate }: { applicationId: string; candidate: Candidate }) {
  const { data: session } = useSession();
  const { data, isLoading } = useThreadMessages(applicationId);
  const send = useSendMessage();
  const markRead = useSelectConversation();
  const [draft, setDraft] = useState("");
  const [error, setError] = useState<string | null>(null);

  // comme la page Messages : fil actif pour les notifications en direct, messages marqués lus
  useEffect(() => {
    markRead(applicationId);
    setActiveMessagingThread(applicationId);
    return () => setActiveMessagingThread(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [applicationId]);

  async function handleSend(text?: string) {
    const message = (text ?? draft).trim();
    if (!message) return;
    setError(null);
    try {
      await send.mutateAsync({ applicationId, content: message });
      setDraft("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Le message n'a pas pu être envoyé.");
    }
  }

  return (
    <>
      <div className="flex shrink-0 items-center gap-3 border-b border-border py-3.5 pr-14 pl-5">
        <Avatar firstName={candidate.firstName} lastName={candidate.lastName} src={candidate.profilePhotoUrl} />
        <div className="min-w-0 flex-1">
          <p className="truncate text-[15px] font-semibold text-foreground">
            {candidate.firstName} {candidate.lastName}
          </p>
          <p className="truncate text-xs text-muted-foreground">{candidate.email}</p>
        </div>
        <Link
          href={`/admin/messages?application=${applicationId}`}
          className="inline-flex shrink-0 items-center gap-1 text-[13px] font-medium text-primary hover:underline"
        >
          Ouvrir dans Messages <ExternalLink className="size-3.5" />
        </Link>
      </div>
      <ChatMessages
        messages={data?.messages ?? []}
        currentUserId={session?.user?.id}
        loading={isLoading}
        empty={
          <ChatStarters
            title="Démarrer la conversation"
            description="L'élève reçoit aussi votre message par email."
            starters={CONVERSATION_STARTERS_ADMIN}
            onSelect={(text) => void handleSend(text)}
          />
        }
      />
      <ChatComposer value={draft} onChange={setDraft} onSend={() => void handleSend()} sending={send.isPending} error={error} placeholder="Écrire à l'élève…" />
    </>
  );
}
