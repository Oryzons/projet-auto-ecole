import { Text, View } from 'react-native';
import Svg, { ClipPath, Defs, G, LinearGradient, Path, Rect, Stop } from 'react-native-svg';

import { colors } from '@/theme';

const ROAD = 'M8.5 34 V29 C8.5 19 23.5 21 23.5 11 V-2';

/** Marque Virage : une route en virage sur une tuile bleue (mêmes tracés que l'icône de l'app). */
export function LogoMark({ size = 28 }: { size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 32 32">
      <Defs>
        <LinearGradient id="logo-g" x1="0" y1="0" x2="1" y2="1">
          <Stop offset="0" stopColor="#4f6fff" />
          <Stop offset="1" stopColor="#2140d8" />
        </LinearGradient>
        <ClipPath id="logo-c">
          <Rect width="32" height="32" rx="9" />
        </ClipPath>
      </Defs>
      <Rect width="32" height="32" rx="9" fill="url(#logo-g)" />
      <G clipPath="url(#logo-c)">
        <Path d={ROAD} stroke="#ffffff" strokeWidth={7.5} fill="none" />
        <Path d={ROAD} stroke={colors.primary} strokeWidth={1.3} fill="none" strokeDasharray="2.4 2.4" />
      </G>
    </Svg>
  );
}

/** Logo Virage : la marque suivie du nom en minuscules */
export function Logo({ size = 28 }: { size?: number }) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: size * 0.3 }}>
      <LogoMark size={size * 1.05} />
      <Text style={{ fontSize: size * 0.86, fontWeight: '800', color: colors.ink, letterSpacing: -0.5, marginTop: -size * 0.12 }}>virage</Text>
    </View>
  );
}
