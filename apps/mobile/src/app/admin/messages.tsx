import { Inbox } from '@/components/messages';
import { Screen } from '@/components/ui';

export default function AdminMessages() {
  return (
    <Screen>
      <Inbox basePath="/admin" intro="Toutes les conversations avec les élèves et l’équipe." />
    </Screen>
  );
}
