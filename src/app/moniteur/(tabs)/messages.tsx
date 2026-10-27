import { Inbox } from '@/components/messages';
import { Screen } from '@/components/ui';

export default function MoniteurMessages() {
  return (
    <Screen withTabBar>
      <Inbox basePath="/moniteur" intro="Vos échanges avec les élèves planifiés et le secrétariat." />
    </Screen>
  );
}
