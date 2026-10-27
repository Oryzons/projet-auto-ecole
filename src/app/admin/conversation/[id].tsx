import { useLocalSearchParams } from 'expo-router';

import { ConversationView } from '@/components/messages';
import { conversations } from '@/data/mock';

export default function AdminConversation() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const c = conversations.find((x) => x.id === id) ?? conversations[0];
  return <ConversationView name={c.name} role={c.role} />;
}
