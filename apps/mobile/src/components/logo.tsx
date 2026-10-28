import { Text, View } from 'react-native';
import Svg, { Path } from 'react-native-svg';

import { colors } from '@/theme';

/** Logo Virage : le « V » plein suivi du nom en minuscules */
export function Logo({ size = 28 }: { size?: number }) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: size * 0.3 }}>
      <Svg width={size * 0.8} height={size} viewBox="0 0 24 30">
        <Path d="M0 0h8.2l5.6 18.6L19.4 0H24L15.4 30H8.6Z" fill={colors.primary} />
      </Svg>
      <Text style={{ fontSize: size * 0.86, fontWeight: '800', color: colors.ink, letterSpacing: -0.5, marginTop: -size * 0.12 }}>virage</Text>
    </View>
  );
}
