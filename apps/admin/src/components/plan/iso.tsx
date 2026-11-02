/**
 * Primitives du plan isométrique (2.5D, en SVG).
 * Repère monde : x vers la droite-bas, y vers la gauche-bas, z vers le haut, en « cases ».
 * Une case fait 20 px de côté une fois projetée (isométrie vraie, angle de 30°).
 */

export const ISO_X = 17.32;
export const ISO_Y = 10;
export const ISO_Z = 20;

export type Pt = readonly [number, number];

export function project(x: number, y: number, z = 0): Pt {
  return [(x - y) * ISO_X, (x + y) * ISO_Y - z * ISO_Z];
}

export const points = (pts: Pt[]) => pts.map(([px, py]) => `${px.toFixed(1)},${py.toFixed(1)}`).join(" ");

/** Losange au sol (ou à la hauteur z) */
export function quad(x: number, y: number, w: number, d: number, z = 0) {
  return points([project(x, y, z), project(x + w, y, z), project(x + w, y + d, z), project(x, y + d, z)]);
}

export type BoxColors = { top: string; left: string; right: string };

export const WHITE: BoxColors = { top: "#ffffff", left: "#eef1f6", right: "#dde3ec" };
export const STONE: BoxColors = { top: "#f4f6fa", left: "#e3e8f0", right: "#d2d9e4" };
export const SLATE: BoxColors = { top: "#cfd6e2", left: "#b9c2d2", right: "#a7b1c3" };
export const INK: BoxColors = { top: "#3a4660", left: "#2a344b", right: "#1f283b" };
export const BLUE: BoxColors = { top: "#5b78ff", left: "#2d50f5", right: "#2441cf" };
export const GLASS: BoxColors = { top: "#ffffff", left: "#dfe7ff", right: "#cdd8fb" };

/** Pavé : dessus, face gauche (y + d) et face droite (x + w). */
export function Box({
  x,
  y,
  z = 0,
  w,
  d,
  h,
  colors = WHITE,
  stroke = "rgba(20,32,60,0.10)",
}: {
  x: number;
  y: number;
  z?: number;
  w: number;
  d: number;
  h: number;
  colors?: BoxColors;
  stroke?: string;
}) {
  const top = z + h;
  return (
    <g strokeWidth={0.6} stroke={stroke} strokeLinejoin="round">
      <polygon points={points([project(x, y + d, z), project(x + w, y + d, z), project(x + w, y + d, top), project(x, y + d, top)])} fill={colors.left} />
      <polygon points={points([project(x + w, y, z), project(x + w, y + d, z), project(x + w, y + d, top), project(x + w, y, top)])} fill={colors.right} />
      <polygon points={quad(x, y, w, d, top)} fill={colors.top} />
    </g>
  );
}

/** Ombre portée douce, décalée vers la droite comme sous une lumière venant de la gauche. */
export function Shadow({ x, y, w, d, h }: { x: number; y: number; w: number; d: number; h: number }) {
  const s = Math.min(h * 0.45, 2.2);
  return <polygon points={points([project(x, y), project(x + w + s, y), project(x + w + s, y + d), project(x, y + d)])} fill="rgba(20,32,60,0.10)" />;
}

/** Fenêtres régulières sur la face gauche (plan y = y + d) */
export function WindowsLeft({
  x,
  y,
  w,
  d,
  z = 0,
  floors,
  cols,
  color = "#c9d4ea",
}: {
  x: number;
  y: number;
  w: number;
  d: number;
  z?: number;
  floors: number;
  cols: number;
  color?: string;
}) {
  const shapes = [];
  const cw = w / cols;
  for (let f = 0; f < floors; f++) {
    for (let c = 0; c < cols; c++) {
      const x0 = x + c * cw + cw * 0.22;
      const x1 = x + (c + 1) * cw - cw * 0.22;
      const z0 = z + f + 0.35;
      const z1 = z + f + 0.8;
      shapes.push(
        <polygon key={`${f}-${c}`} points={points([project(x0, y + d, z0), project(x1, y + d, z0), project(x1, y + d, z1), project(x0, y + d, z1)])} fill={color} />,
      );
    }
  }
  return <g>{shapes}</g>;
}

/** Fenêtres régulières sur la face droite (plan x = x + w) */
export function WindowsRight({
  x,
  y,
  w,
  d,
  z = 0,
  floors,
  cols,
  color = "#bcc8e0",
}: {
  x: number;
  y: number;
  w: number;
  d: number;
  z?: number;
  floors: number;
  cols: number;
  color?: string;
}) {
  const shapes = [];
  const cd = d / cols;
  for (let f = 0; f < floors; f++) {
    for (let c = 0; c < cols; c++) {
      const y0 = y + c * cd + cd * 0.22;
      const y1 = y + (c + 1) * cd - cd * 0.22;
      const z0 = z + f + 0.35;
      const z1 = z + f + 0.8;
      shapes.push(
        <polygon key={`${f}-${c}`} points={points([project(x + w, y0, z0), project(x + w, y1, z0), project(x + w, y1, z1), project(x + w, y0, z1)])} fill={color} />,
      );
    }
  }
  return <g>{shapes}</g>;
}

/** Enseigne écrite sur la face gauche d'un bâtiment (texte incliné dans le plan de la façade). */
export function SignLeft({ x, y, z, text, size = 9, color = "#14203c" }: { x: number; y: number; z: number; text: string; size?: number; color?: string }) {
  const [px, py] = project(x, y, z);
  return (
    <text
      transform={`matrix(0.866 0.5 0 1 ${px.toFixed(1)} ${py.toFixed(1)})`}
      fontSize={size}
      fontWeight={700}
      letterSpacing={1.2}
      fill={color}
      style={{ pointerEvents: "none" }}
    >
      {text}
    </text>
  );
}

/** Arbre : tronc et feuillage en boules superposées. */
export function Tree({ x, y, size = 1, tone = "#b8dcc4" }: { x: number; y: number; size?: number; tone?: string }) {
  const [px, py] = project(x, y);
  const r = 9 * size;
  return (
    <g>
      <ellipse cx={px + 3} cy={py + 1} rx={r * 0.9} ry={r * 0.45} fill="rgba(20,32,60,0.08)" />
      <rect x={px - 1.2} y={py - 12 * size} width={2.4} height={12 * size} rx={1} fill="#c8b8a2" />
      <circle cx={px} cy={py - 14 * size} r={r} fill={tone} />
      <circle cx={px - r * 0.35} cy={py - 15 * size - r * 0.25} r={r * 0.55} fill="rgba(255,255,255,0.35)" />
    </g>
  );
}

/** Petite voiture orientée le long de l'axe x. */
export function Car({ x, y, color = BLUE }: { x: number; y: number; color?: BoxColors }) {
  return (
    <g>
      <Shadow x={x} y={y} w={1.7} d={0.85} h={0.6} />
      <Box x={x} y={y} z={0.12} w={1.7} d={0.85} h={0.32} colors={color} stroke="rgba(20,32,60,0.18)" />
      <Box x={x + 0.45} y={y + 0.08} z={0.44} w={0.8} d={0.69} h={0.26} colors={GLASS} stroke="rgba(20,32,60,0.18)" />
    </g>
  );
}
