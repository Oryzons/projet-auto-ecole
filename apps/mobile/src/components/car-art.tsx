import Svg, { Circle, Defs, Ellipse, G, LinearGradient, Path, Rect, Stop, Text as SvgText } from 'react-native-svg';

import { colors } from '@/theme';

/**
 * Voiture d'auto-école vue de profil, dessinée en vectoriel :
 * nette à toutes les tailles, aux couleurs de Virage, avec le panneau
 * « AUTO-ÉCOLE » sur le toit.
 */
export function CarArt({ width = 180 }: { width?: number }) {
  const height = (width * 128) / 320;
  return (
    <Svg width={width} height={height} viewBox="0 0 320 128">
      <Defs>
        <LinearGradient id="body" x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor="#FFFFFF" />
          <Stop offset="0.62" stopColor="#F3F6FC" />
          <Stop offset="1" stopColor="#D9E0EE" />
        </LinearGradient>
        <LinearGradient id="glass" x1="0" y1="0" x2="1" y2="1">
          <Stop offset="0" stopColor="#2B3F6B" />
          <Stop offset="1" stopColor="#13203D" />
        </LinearGradient>
        <LinearGradient id="rim" x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor="#E9EEF7" />
          <Stop offset="1" stopColor="#A9B5CB" />
        </LinearGradient>
      </Defs>

      {/* ombre au sol */}
      <Ellipse cx="160" cy="118" rx="146" ry="6" fill="#0B1533" opacity={0.28} />

      {/* panneau de toit */}
      <G>
        <Rect x="116" y="9" width="60" height="15" rx="4" fill="#FFFFFF" stroke="#D6DDEB" strokeWidth="1" />
        <Rect x="132" y="22" width="28" height="4" rx="1.5" fill="#C9D2E3" />
        <SvgText x="146" y="19.6" fontSize="8" fontWeight="800" fill={colors.primary} textAnchor="middle" letterSpacing="0.6">
          AUTO-ÉCOLE
        </SvgText>
      </G>

      {/* carrosserie */}
      <Path
        d="M24 98 C15 98 11 92 11 84 L11 72 C11 63 17 58 27 56 L46 53 C61 39 82 28 106 26 L186 25 C205 25 220 32 238 48 L249 55 C273 57 292 61 301 67 C307 71 309 79 309 87 C309 94 305 98 298 98 Z"
        fill="url(#body)"
        stroke="#C8D1E2"
        strokeWidth="1"
      />
      {/* bande Virage */}
      <Path d="M14 76 L306 76 L306 82 L13 82 Z" fill={colors.primary} opacity={0.95} />
      {/* vitres */}
      <Path d="M58 53 C70 41 87 33 106 32 L141 32 L141 53 Z" fill="url(#glass)" />
      <Path d="M148 32 L185 31 C199 31 212 38 228 52 L148 53 Z" fill="url(#glass)" />
      <Path d="M70 50 C80 41 92 36 104 35 L96 50 Z" fill="#FFFFFF" opacity={0.16} />
      <Path d="M160 35 L176 35 L166 51 L152 51 Z" fill="#FFFFFF" opacity={0.12} />
      {/* portes et poignées */}
      <Path d="M144 31 L144 94" stroke="#C3CCDD" strokeWidth="1.2" />
      <Path d="M58 56 L58 92" stroke="#D3DAE7" strokeWidth="1" />
      <Rect x="122" y="60" width="13" height="3" rx="1.5" fill="#B7C1D4" />
      <Rect x="200" y="60" width="13" height="3" rx="1.5" fill="#B7C1D4" />
      {/* rétroviseur */}
      <Path d="M228 52 L240 50 C243 50 244 53 242 55 L231 57 Z" fill="#E3E8F2" stroke="#C3CCDD" strokeWidth="0.8" />
      {/* phares */}
      <Path d="M290 64 C297 65 302 68 304 72 L292 71 C289 70 288 66 290 64 Z" fill="#FFF6D6" stroke="#E8D9A8" strokeWidth="0.8" />
      <Path d="M12 63 L22 61 L22 69 L12 70 Z" fill="#E5484D" />
      {/* bas de caisse */}
      <Path d="M40 98 L282 98" stroke="#BCC6D8" strokeWidth="2" strokeLinecap="round" />

      {/* passages de roue et roues */}
      {[76, 246].map((cx) => (
        <G key={cx}>
          <Circle cx={cx} cy="97" r="27" fill="#1A2440" />
          <Circle cx={cx} cy="97" r="22" fill="#151C2E" />
          <Circle cx={cx} cy="97" r="14.5" fill="url(#rim)" />
          {[0, 72, 144, 216, 288].map((a) => (
            <Rect key={a} x={cx - 1.6} y="84" width="3.2" height="11" rx="1.6" fill="#8A97B0" transform={`rotate(${a} ${cx} 97)`} />
          ))}
          <Circle cx={cx} cy="97" r="4.2" fill={colors.primary} />
        </G>
      ))}
    </Svg>
  );
}
