import { Eraser, PenLine } from 'lucide-react-native';
import { useRef, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { GestureDetector, usePanGesture } from 'react-native-gesture-handler';
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated';
import Svg, { Path } from 'react-native-svg';

import { colors } from '@/theme';

type Point = { x: number; y: number };

/** Lisse un tracé en courbes quadratiques entre les points */
const toPath = (pts: Point[]) => {
  if (!pts.length) return '';
  if (pts.length === 1) return `M ${pts[0].x} ${pts[0].y} l 0.1 0.1`;
  let d = `M ${pts[0].x} ${pts[0].y}`;
  for (let i = 1; i < pts.length - 1; i++) {
    const mx = (pts[i].x + pts[i + 1].x) / 2;
    const my = (pts[i].y + pts[i + 1].y) / 2;
    d += ` Q ${pts[i].x} ${pts[i].y} ${mx} ${my}`;
  }
  const last = pts[pts.length - 1];
  return `${d} L ${last.x} ${last.y}`;
};

/**
 * Zone de signature au doigt. `onChange(true)` dès qu'un tracé suffisant existe ;
 * `onDrawing` permet de bloquer le défilement de la page pendant le tracé.
 */
export function SignaturePad({ onChange, onDrawing, disabled }: { onChange: (signed: boolean) => void; onDrawing?: (drawing: boolean) => void; disabled?: boolean }) {
  const [strokes, setStrokes] = useState<Point[][]>([]);
  const [current, setCurrent] = useState<Point[]>([]);
  // copie synchrone du tracé en cours, lue à la fin du geste
  const live = useRef<Point[]>([]);

  const length = strokes.reduce((n, s) => n + s.length, 0);

  const pan = usePanGesture({
    enabled: !disabled,
    runOnJS: true,
    minDistance: 0,
    onBegin: (e) => {
      onDrawing?.(true);
      live.current = [{ x: e.x, y: e.y }];
      setCurrent(live.current);
    },
    onUpdate: (e) => {
      live.current = [...live.current, { x: e.x, y: e.y }];
      setCurrent(live.current);
    },
    onFinalize: () => {
      onDrawing?.(false);
      const stroke = live.current;
      live.current = [];
      setCurrent([]);
      if (stroke.length) {
        const next = [...strokes, stroke];
        setStrokes(next);
        onChange(next.reduce((n, x) => n + x.length, 0) > 12);
      }
    },
  });

  const clear = () => {
    setStrokes([]);
    setCurrent([]);
    onChange(false);
  };

  const empty = !strokes.length && !current.length;

  return (
    <View style={{ gap: 10 }}>
      <GestureDetector gesture={pan}>
        <View style={[styles.pad, !empty && styles.padActive, disabled && { borderStyle: 'solid', borderColor: colors.success }]}>
          <Svg style={StyleSheet.absoluteFill}>
            {[...strokes, current].map((s, i) => (
              <Path key={i} d={toPath(s)} stroke={colors.ink} strokeWidth={2.6} strokeLinecap="round" strokeLinejoin="round" fill="none" />
            ))}
          </Svg>
          {empty ? (
            <Animated.View entering={FadeIn.duration(200)} exiting={FadeOut.duration(120)} pointerEvents="none" style={styles.placeholder}>
              <PenLine size={26} color={colors.faint} strokeWidth={1.6} />
              <Text style={styles.placeholderText}>Signez ici avec votre doigt</Text>
            </Animated.View>
          ) : null}
          <View pointerEvents="none" style={styles.baseline} />
        </View>
      </GestureDetector>
      {!disabled ? (
        <View style={styles.footer}>
          <Text style={styles.hint}>{length > 12 ? 'Signature prête' : 'Tracez votre signature au-dessus de la ligne'}</Text>
          {!empty ? (
            <Pressable onPress={clear} hitSlop={8} style={styles.clear}>
              <Eraser size={15} color={colors.danger} />
              <Text style={styles.clearText}>Effacer</Text>
            </Pressable>
          ) : null}
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  pad: { height: 180, borderRadius: 18, borderWidth: 1.5, borderStyle: 'dashed', borderColor: colors.input, backgroundColor: colors.card, overflow: 'hidden' },
  padActive: { borderStyle: 'solid', borderColor: colors.primary },
  placeholder: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, alignItems: 'center', justifyContent: 'center', gap: 8 },
  placeholderText: { fontSize: 13.5, color: colors.faint },
  baseline: { position: 'absolute', left: 24, right: 24, bottom: 40, height: 1, backgroundColor: colors.border },
  footer: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  hint: { fontSize: 12.5, color: colors.muted },
  clear: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  clearText: { fontSize: 13, fontWeight: '600', color: colors.danger },
});
