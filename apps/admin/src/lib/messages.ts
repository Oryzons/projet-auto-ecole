export const CONVERSATION_STARTERS_CANDIDATE = [
  "Bonjour, j'ai une question sur mon dossier.",
  "Pouvez-vous me confirmer l'état de mes documents ?",
  "Quand puis-je procéder au paiement ?",
  "J'ai besoin d'aide pour déposer un document.",
];

export const CONVERSATION_STARTERS_ADMIN = [
  "Bonjour, nous avons bien reçu votre dossier.",
  "Un de vos documents nécessite une correction.",
  "Tous vos documents ont été validés. Vous pouvez procéder au paiement.",
  "Votre paiement a bien été enregistré. Merci !",
  "Avez-vous des questions concernant votre permis de conduire ?",
];

export interface ConversationSummary {
  applicationId: string;
  candidate: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    phone: string | null;
    profilePhotoUrl?: string | null;
  };
  status: string;
  lastMessage: {
    content: string;
    createdAt: string;
    senderId: string;
    senderRole: string;
  } | null;
  unreadCount: number;
  messageCount: number;
  updatedAt: string;
}

export interface CandidateSearchResult {
  applicationId: string;
  candidate: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    phone: string | null;
  };
  status: string;
  messageCount: number;
}

export function groupMessagesByDate<T extends { createdAt: string }>(
  messages: T[]
): { label: string; messages: T[] }[] {
  const groups = new Map<string, T[]>();

  for (const msg of messages) {
    const date = new Date(msg.createdAt);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    let label: string;
    if (date.toDateString() === today.toDateString()) {
      label = "Aujourd'hui";
    } else if (date.toDateString() === yesterday.toDateString()) {
      label = "Hier";
    } else {
      label = new Intl.DateTimeFormat("fr-FR", {
        weekday: "long",
        day: "numeric",
        month: "long",
        year: date.getFullYear() !== today.getFullYear() ? "numeric" : undefined,
      }).format(date);
    }

    if (!groups.has(label)) groups.set(label, []);
    groups.get(label)!.push(msg);
  }

  return Array.from(groups.entries()).map(([label, msgs]) => ({
    label,
    messages: msgs,
  }));
}

export function formatMessageTime(date: string): string {
  return new Intl.DateTimeFormat("fr-FR", {
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(date));
}

export function truncateMessage(content: string, max = 60): string {
  if (content.length <= max) return content;
  return content.slice(0, max) + "…";
}

export function getInitials(firstName: string, lastName: string): string {
  return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
}

export function formatRelativeTime(date: string): string {
  const value = new Date(date);
  const now = new Date();
  const diffMs = now.getTime() - value.getTime();
  const diffMin = Math.floor(diffMs / 60_000);

  if (diffMin < 1) return "À l'instant";
  if (diffMin < 60) return `Il y a ${diffMin} min`;

  const diffHours = Math.floor(diffMin / 60);
  if (diffHours < 24) return `Il y a ${diffHours} h`;

  const diffDays = Math.floor(diffHours / 24);
  if (diffDays === 1) return "Hier";
  if (diffDays < 7) return `Il y a ${diffDays} j`;

  return new Intl.DateTimeFormat("fr-FR", {
    day: "numeric",
    month: "short",
  }).format(value);
}
