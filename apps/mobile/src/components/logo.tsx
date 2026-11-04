import { BRAND_NAME, LOGO_BOTTOM, LOGO_GRADIENT, LOGO_TILE_RADIUS, LOGO_TOP, LOGO_VIEWBOX } from '@virage/shared/brand';
import { Text, View } from 'react-native';
import Svg, { Defs, LinearGradient, Path, Rect, Stop } from 'react-native-svg';

import { colors } from '@/theme';

/** Marque Shift : deux barres en italique qui forment un S, sur une tuile bleue (mêmes tracés que l'icône de l'app). */
export function LogoMark({ size = 28, inverse = false }: { size?: number; inverse?: boolean }) {
  return (
    <Svg width={size} height={size} viewBox={LOGO_VIEWBOX}>
      <Defs>
        <LinearGradient id="logo-g" x1="0" y1="0" x2="1" y2="1">
          <Stop offset="0" stopColor={LOGO_GRADIENT[0]} />
          <Stop offset="1" stopColor={LOGO_GRADIENT[1]} />
        </LinearGradient>
      </Defs>
      <Rect width="100" height="100" rx={LOGO_TILE_RADIUS} fill={inverse ? '#ffffff' : 'url(#logo-g)'} />
      <Path d={LOGO_TOP} fill={inverse ? colors.primary : '#ffffff'} />
      <Path d={LOGO_BOTTOM} fill={inverse ? colors.primary : '#ffffff'} />
    </Svg>
  );
}

/** Logo Shift : la marque suivie du nom en minuscules */
export function Logo({ size = 28, inverse = false }: { size?: number; inverse?: boolean }) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: size * 0.3 }}>
      <LogoMark size={size * 1.05} inverse={inverse} />
      <Text style={{ fontSize: size * 0.86, fontWeight: '800', color: inverse ? '#ffffff' : colors.ink, letterSpacing: -0.5, marginTop: -size * 0.12 }}>
        {BRAND_NAME.toLowerCase()}
      </Text>
    </View>
  );
}
