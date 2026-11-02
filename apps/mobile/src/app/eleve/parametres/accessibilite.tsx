import { Bold, Captions, Contrast, Rabbit, Type } from 'lucide-react-native';
import { Text, View } from 'react-native';
import Animated, { FadeIn, LinearTransition } from 'react-native-reanimated';

import { MenuGroup, MenuRow, PageTitle, Segmented, Switch, settingsStyles as s } from '@/components/settings';
import { Screen, TopBar } from '@/components/ui';
import { bind, setPrefs, usePrefs } from '@/data/preferences';
import { colors } from '@/theme';

const scales = { S: 0.9, M: 1, L: 1.15, XL: 1.3 };

/** Réglages d'accessibilité, avec un aperçu en direct */
export default function ReglagesAccessibilite() {
  const p = usePrefs();
  const k = scales[p.textSize];
  const ink = p.highContrast ? '#000' : colors.ink;
  const muted = p.highContrast ? '#1F2A44' : colors.muted;

  return (
    <Screen>
      <TopBar title="Accessibilité" />
      <PageTitle title="À votre façon." text="Adaptez l’affichage pour lire et réviser confortablement." />

      <Animated.View entering={FadeIn.delay(60)} style={{ gap: 10 }}>
        <Text style={{ fontSize: 11, fontWeight: '700', color: colors.muted, letterSpacing: 0.6, paddingHorizontal: 4 }}>APERÇU</Text>
        <Animated.View layout={LinearTransition.duration(220)} style={[s.card, p.highContrast && { borderWidth: 2, borderColor: '#000' }]}>
          <Text style={{ fontSize: 17 * k, fontWeight: p.boldText ? '800' : '700', color: ink }}>Jeudi 29 oct. · 14:00</Text>
          <Text style={{ fontSize: 14 * k, lineHeight: 20 * k, fontWeight: p.boldText ? '600' : '400', color: muted }}>
            Leçon de conduite avec Julie Bernard, départ Agence Lyon République.
          </Text>
        </Animated.View>
      </Animated.View>

      <Animated.View entering={FadeIn.delay(100)} style={{ gap: 10 }}>
        <Text style={{ fontSize: 11, fontWeight: '700', color: colors.muted, letterSpacing: 0.6, paddingHorizontal: 4 }}>TAILLE DU TEXTE</Text>
        <View style={s.card}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
            <Type size={18} color={colors.primary} />
            <Text style={{ flex: 1, fontSize: 14, color: colors.muted }}>Agrandit les textes de toute l’application.</Text>
          </View>
          <Segmented
            value={p.textSize}
            onChange={(v) => setPrefs({ textSize: v })}
            options={[
              { key: 'S', label: 'A−' },
              { key: 'M', label: 'A' },
              { key: 'L', label: 'A+' },
              { key: 'XL', label: 'A++' },
            ]}
          />
        </View>
      </Animated.View>

      <MenuGroup title="Lecture" delay={140}>
        <MenuRow icon={Bold} tone="violet" title="Texte en gras" right={<Switch {...bind(p, 'boldText')} />} />
        <MenuRow icon={Contrast} tone="violet" title="Contraste renforcé" subtitle="Couleurs plus marquées" right={<Switch {...bind(p, 'highContrast')} />} />
      </MenuGroup>

      <MenuGroup title="Mouvements et médias" delay={180}>
        <MenuRow icon={Rabbit} tone="violet" title="Réduire les animations" subtitle="Transitions plus sobres" right={<Switch {...bind(p, 'reduceMotion')} />} />
        <MenuRow icon={Captions} tone="violet" title="Sous-titres des vidéos" subtitle="Cours et séries de code" right={<Switch {...bind(p, 'captions')} />} />
      </MenuGroup>
    </Screen>
  );
}
