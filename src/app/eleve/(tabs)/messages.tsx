import { Inbox } from '@/components/messages';
import { Screen } from '@/components/ui';

export default function EleveMessages() {
  return (
    <Screen withTabBar>
      <Inbox basePath="/eleve" intro="Échangez avec votre moniteur et l’équipe Virage." />
    </Screen>
  );
}
