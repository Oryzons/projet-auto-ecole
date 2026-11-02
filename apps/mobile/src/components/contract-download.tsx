import { ArrowDown, CircleCheck, ExternalLink, FileText } from 'lucide-react-native';
import { useEffect, useRef, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, { Easing, FadeIn, LinearTransition, ZoomIn, cancelAnimation, useAnimatedStyle, useSharedValue, withRepeat, withSequence, withTiming } from 'react-native-reanimated';

import { generateContract, openContract } from '@/data/contrat-pdf';
import { student } from '@/data/mock';
import { colors } from '@/theme';

type Stage = 'idle' | 'loading' | 'done';

const fileName = `Contrat-Virage-${student.firstName}-${student.lastName}.pdf`;

/** Bouton de téléchargement du contrat : progression animée, puis ouverture du PDF */
export function ContractDownload({ getHtml, signed }: { getHtml: () => string; signed?: boolean }) {
  const [stage, setStage] = useState<Stage>('idle');
  const [percent, setPercent] = useState(0);
  const file = useRef<{ uri: string | null; html: string } | null>(null);
  const ready = useRef(false);

  // progression : avance jusqu'à 90 % puis attend que le PDF soit généré
  useEffect(() => {
    if (stage !== 'loading') return;
    const id = setInterval(() => {
      setPercent((p) => {
        if (p >= 100) return p;
        if (p >= 90 && !ready.current) return p;
        return Math.min(100, p + (ready.current ? 10 : 6));
      });
    }, 70);
    return () => clearInterval(id);
  }, [stage]);

  useEffect(() => {
    if (stage === 'loading' && percent >= 100) {
      const t = setTimeout(() => {
        setStage('done');
        setTimeout(() => open(), 450);
      }, 200);
      return () => clearTimeout(t);
    }
  }, [percent, stage]);

  const start = async () => {
    ready.current = false;
    setPercent(0);
    setStage('loading');
    const html = getHtml();
    try {
      file.current = { uri: await generateContract(html), html };
    } catch {
      file.current = { uri: null, html };
    }
    ready.current = true;
  };

  const open = () => {
    if (file.current) openContract(file.current.uri, file.current.html).catch(() => {});
  };

  return (
    <Animated.View layout={LinearTransition.duration(240)} style={[styles.box, stage === 'done' && { backgroundColor: colors.successSoft }]}>
      {stage === 'idle' ? (
        <Pressable onPress={start} style={styles.row} accessibilityRole="button">
          <View style={styles.icon}>
            <ArrowDown size={17} color={colors.primary} strokeWidth={2.2} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.title}>Télécharger le contrat (PDF)</Text>
            <Text style={styles.sub}>{signed ? 'Format A4 · avec votre signature' : 'Format A4 · version à signer'}</Text>
          </View>
        </Pressable>
      ) : stage === 'loading' ? (
        <Animated.View entering={FadeIn.duration(180)} style={{ gap: 10 }}>
          <View style={styles.row}>
            <Bouncing />
            <View style={{ flex: 1 }}>
              <Text style={styles.title}>{percent < 60 ? 'Préparation du PDF…' : percent < 100 ? 'Téléchargement…' : 'Terminé'}</Text>
              <Text style={styles.sub} numberOfLines={1}>
                {fileName}
              </Text>
            </View>
            <Text style={styles.percent}>{percent} %</Text>
          </View>
          <Bar percent={percent} />
        </Animated.View>
      ) : (
        <Animated.View entering={FadeIn.duration(200)} style={styles.row}>
          <Animated.View entering={ZoomIn.springify().damping(11)} style={[styles.icon, { backgroundColor: colors.success }]}>
            <CircleCheck size={18} color="#fff" strokeWidth={2.2} />
          </Animated.View>
          <View style={{ flex: 1 }}>
            <Text style={[styles.title, { color: colors.success }]}>Contrat téléchargé</Text>
            <Text style={styles.sub} numberOfLines={1}>
              {fileName}
            </Text>
          </View>
          <Pressable onPress={open} hitSlop={8} style={styles.open}>
            <ExternalLink size={14} color={colors.success} />
            <Text style={[styles.openText]}>Ouvrir</Text>
          </Pressable>
        </Animated.View>
      )}
    </Animated.View>
  );
}

/** Document avec une flèche qui « tombe » dedans en boucle */
function Bouncing() {
  const y = useSharedValue(0);
  useEffect(() => {
    y.value = withRepeat(withSequence(withTiming(-5, { duration: 0 }), withTiming(5, { duration: 520, easing: Easing.in(Easing.quad) }), withTiming(-5, { duration: 0 })), -1);
    return () => cancelAnimation(y);
  }, [y]);
  const arrow = useAnimatedStyle(() => ({ transform: [{ translateY: y.value }], opacity: 1 - Math.max(0, y.value) / 6 }));
  return (
    <View style={[styles.icon, { backgroundColor: colors.primary }]}>
      <FileText size={18} color="rgba(255,255,255,0.35)" strokeWidth={2} />
      <Animated.View style={[{ position: 'absolute' }, arrow]}>
        <ArrowDown size={16} color="#fff" strokeWidth={2.6} />
      </Animated.View>
    </View>
  );
}

function Bar({ percent }: { percent: number }) {
  const w = useSharedValue(0);
  useEffect(() => {
    w.value = withTiming(percent / 100, { duration: 160, easing: Easing.out(Easing.quad) });
  }, [percent, w]);
  const style = useAnimatedStyle(() => ({ transform: [{ scaleX: w.value }] }));
  return (
    <View style={styles.track}>
      <Animated.View style={[styles.fill, { transformOrigin: 'left' }, style]} />
    </View>
  );
}

const styles = StyleSheet.create({
  box: { padding: 12, borderRadius: 14, backgroundColor: colors.primarySoft, overflow: 'hidden' },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  icon: { width: 38, height: 38, borderRadius: 11, backgroundColor: colors.card, alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  title: { fontSize: 14, fontWeight: '700', color: colors.primary },
  sub: { fontSize: 12, color: colors.muted },
  percent: { fontSize: 13, fontWeight: '800', color: colors.primary, fontVariant: ['tabular-nums'] },
  track: { height: 5, borderRadius: 3, backgroundColor: 'rgba(45,80,245,0.15)', overflow: 'hidden' },
  fill: { height: '100%', width: '100%', borderRadius: 3, backgroundColor: colors.primary },
  open: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 999, backgroundColor: colors.card },
  openText: { fontSize: 13, fontWeight: '700', color: colors.success },
});
