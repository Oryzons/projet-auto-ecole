import { RemcGrid } from '@/components/remc';
import { Intro, Screen, TopBar } from '@/components/ui';

/** Suivi de progression pédagogique (REMC) */
export default function EleveProgression() {
  return (
    <Screen>
      <TopBar title="Progression" />
      <Intro title="Mes compétences" description="Votre livret d’apprentissage, mis à jour par votre moniteur après chaque leçon." />
      <RemcGrid />
    </Screen>
  );
}
