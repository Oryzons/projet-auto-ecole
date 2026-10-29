/**
 * Mobilier de l'open space, à l'échelle : une case = un mètre.
 * Chaque pièce se dessine de l'arrière vers l'avant ; l'appelant respecte le même ordre.
 */

import { createContext, useContext } from "react";

import { BLUE, Box, GLASS, INK, ISO_Z, STONE, WHITE, points, project, type BoxColors } from "./iso";

/** Le plan s'anime sauf si l'utilisateur a demandé moins d'animations. */
export const PlanMotion = createContext(true);
export const usePlanMotion = () => useContext(PlanMotion);

export const WOOD: BoxColors = { top: "#f3ece2", left: "#e4d8c8", right: "#d6c7b3" };
export const DESK: BoxColors = { top: "#ffffff", left: "#e9edf3", right: "#dbe1ea" };
export const SOFA: BoxColors = { top: "#dfe5ff", left: "#c6d0f7", right: "#b3bfee" };
export const RED: BoxColors = { top: "#ff8a80", left: "#ef5350", right: "#d84340" };
export const CHAIR: BoxColors = { top: "#4a5675", left: "#3a4560", right: "#2c364d" };
export const PARTITION: BoxColors = { top: "rgba(255,255,255,0.95)", left: "rgba(205,216,246,0.55)", right: "rgba(186,201,242,0.55)" };

/** Rectangle vertical dans le plan y = constante (face tournée vers l'avant gauche). */
export function faceY(x0: number, x1: number, y: number, z0: number, z1: number) {
  return points([project(x0, y, z0), project(x1, y, z0), project(x1, y, z1), project(x0, y, z1)]);
}

/** Rectangle vertical dans le plan x = constante (face tournée vers l'avant droit). */
export function faceX(x: number, y0: number, y1: number, z0: number, z1: number) {
  return points([project(x, y0, z0), project(x, y1, z0), project(x, y1, z1), project(x, y0, z1)]);
}

/** Matrice SVG pour écrire ou dessiner « à plat » dans un plan. */
export const onWallY = (x: number, y: number, z: number) => {
  const [px, py] = project(x, y, z);
  return `matrix(0.866 0.5 0 1 ${px.toFixed(1)} ${py.toFixed(1)})`;
};
export const onWallX = (x: number, y: number, z: number) => {
  const [px, py] = project(x, y, z);
  return `matrix(0.866 -0.5 0 1 ${px.toFixed(1)} ${py.toFixed(1)})`;
};
export const onFloor = (x: number, y: number, z = 0.03) => {
  const [px, py] = project(x, y, z);
  return `matrix(0.866 0.5 -0.866 0.5 ${px.toFixed(1)} ${py.toFixed(1)})`;
};

/** Texte peint au sol, lisible depuis l'avant (comme un marquage). */
export function FloorLabel({ x, y, text, size = 7.5, color = "#7d8aa5" }: { x: number; y: number; text: string; size?: number; color?: string }) {
  return (
    <text transform={onFloor(x, y)} fontSize={size} fontWeight={700} letterSpacing={1.6} fill={color} style={{ pointerEvents: "none" }}>
      {text}
    </text>
  );
}

const SKIN = ["#f1c9a5", "#d9a47c", "#a8714f", "#f3d2b8", "#8b5a3c"];
const HAIR = ["#3b2f2a", "#1f1a17", "#7a5230", "#c9a26a", "#5b5b5b"];

/** Personne debout ou assise ; `look` varie la peau et les cheveux. */
export function Person({
  x,
  y,
  z = 0,
  shirt = "#2d50f5",
  seated = false,
  look = 0,
  headset = false,
  walking = false,
}: {
  x: number;
  y: number;
  z?: number;
  shirt?: string;
  seated?: boolean;
  look?: number;
  headset?: boolean;
  /** jambes qui alternent (personne qui se déplace) */
  walking?: boolean;
}) {
  const [px, py] = project(x, y, z);
  const u = ISO_Z;
  const skin = SKIN[look % SKIN.length];
  const hair = HAIR[(look * 3 + 1) % HAIR.length];
  const torsoBottom = seated ? 0.45 : 0.85;
  const torsoTop = seated ? 1.05 : 1.45;
  const head = seated ? 1.22 : 1.62;
  const r = 3.3;
  return (
    <g style={{ pointerEvents: "none" }}>
      <ellipse cx={px + 1.5} cy={py} rx={6} ry={3} fill="rgba(20,32,60,0.12)" />
      {!seated && (
        <>
          <rect x={px - 3.6} y={py - torsoBottom * u} width={3.1} height={torsoBottom * u} rx={1.4} fill="#2a344b" className={walking ? "plan-step" : undefined} />
          <rect x={px + 0.5} y={py - torsoBottom * u} width={3.1} height={torsoBottom * u} rx={1.4} fill="#222b3f" className={walking ? "plan-step plan-step-b" : undefined} />
        </>
      )}
      <g className={seated ? "plan-breathe" : undefined} style={seated ? { animationDelay: `${-((look * 0.7 + x * 0.37 + y * 0.53) % 3.2)}s` } : undefined}>
      <rect x={px - 4.8} y={py - torsoTop * u} width={9.6} height={(torsoTop - torsoBottom) * u + 2} rx={4} fill={shirt} />
      <rect x={px - 4.8} y={py - torsoTop * u} width={4.8} height={(torsoTop - torsoBottom) * u + 2} rx={4} fill="rgba(255,255,255,0.14)" />
      <circle cx={px} cy={py - head * u} r={r} fill={skin} />
      <path d={`M ${px - r} ${py - head * u} a ${r} ${r} 0 0 1 ${2 * r} 0 q -${r} -1.4 -${2 * r} 0 z`} fill={hair} />
      {headset && (
        <>
          <path d={`M ${px - r - 0.4} ${py - head * u + 0.5} a ${r + 0.4} ${r + 0.4} 0 0 1 ${2 * r + 0.8} 0`} fill="none" stroke="#14203c" strokeWidth={0.9} />
          <circle cx={px + r + 0.2} cy={py - head * u + 0.8} r={1.1} fill="#14203c" />
        </>
      )}
      </g>
    </g>
  );
}

/** Chaise de bureau ; le dossier est du côté `back` (« y » = vers le fond, « x » = côté gauche). */
export function Chair({ x, y, back = "y", colors = CHAIR }: { x: number; y: number; back?: "y" | "x" | "-y" | "-x"; colors?: BoxColors }) {
  const seat = <Box x={x} y={y} z={0.4} w={0.5} d={0.5} h={0.07} colors={colors} />;
  const stem = <Box x={x + 0.22} y={y + 0.22} w={0.06} d={0.06} h={0.4} colors={INK} />;
  const backs = {
    y: <Box x={x} y={y - 0.02} z={0.47} w={0.5} d={0.08} h={0.5} colors={colors} />,
    x: <Box x={x - 0.02} y={y} z={0.47} w={0.08} d={0.5} h={0.5} colors={colors} />,
    "-y": <Box x={x} y={y + 0.44} z={0.47} w={0.5} d={0.08} h={0.5} colors={colors} />,
    "-x": <Box x={x + 0.44} y={y} z={0.47} w={0.08} d={0.5} h={0.5} colors={colors} />,
  };
  const front = back === "-y" || back === "-x";
  return (
    <g>
      {stem}
      {!front && backs[back]}
      {seat}
      {front && backs[back]}
    </g>
  );
}

export function Desk({ x, y, w = 1.4, d = 0.7, colors = DESK }: { x: number; y: number; w?: number; d?: number; colors?: BoxColors }) {
  return (
    <g>
      <Box x={x + 0.05} y={y + 0.05} w={0.06} d={d - 0.1} h={0.7} colors={STONE} />
      <Box x={x + w - 0.11} y={y + 0.05} w={0.06} d={d - 0.1} h={0.7} colors={STONE} />
      <Box x={x} y={y} z={0.7} w={w} d={d} h={0.05} colors={colors} />
    </g>
  );
}

/** Écran posé sur un bureau, dos tourné vers l'avant. */
export function Monitor({ x, y, z = 0.75, w = 0.6 }: { x: number; y: number; z?: number; w?: number }) {
  return (
    <g>
      <Box x={x + w / 2 - 0.04} y={y} z={z} w={0.08} d={0.08} h={0.15} colors={INK} />
      <Box x={x} y={y} z={z + 0.12} w={w} d={0.05} h={0.36} colors={INK} />
    </g>
  );
}

/** Poste de travail complet : chaise et personne derrière, bureau, écran. */
export function Workstation({
  x,
  y,
  w = 1.4,
  shirt,
  look = 0,
  headset = false,
  empty = false,
  papers = false,
}: {
  x: number;
  y: number;
  w?: number;
  shirt?: string;
  look?: number;
  headset?: boolean;
  empty?: boolean;
  papers?: boolean;
}) {
  return (
    <g>
      <Chair x={x + w / 2 - 0.25} y={y - 0.75} back="y" />
      {!empty && <Person x={x + w / 2} y={y - 0.42} seated shirt={shirt} look={look} headset={headset} />}
      <Desk x={x} y={y} w={w} />
      <Monitor x={x + w / 2 - 0.3} y={y + 0.12} />
      {papers && <Box x={x + 0.12} y={y + 0.3} z={0.75} w={0.32} d={0.24} h={0.08} colors={WHITE} />}
    </g>
  );
}

export function Plant({ x, y, size = 1 }: { x: number; y: number; size?: number }) {
  const [px, py] = project(x + 0.22, y + 0.22, 0.45 + 0.5 * size);
  const r = 8 * size;
  return (
    <g style={{ pointerEvents: "none" }}>
      <Box x={x} y={y} w={0.45} d={0.45} h={0.45} colors={WHITE} />
      <circle cx={px - r * 0.45} cy={py + r * 0.15} r={r * 0.7} fill="#7cc196" />
      <circle cx={px + r * 0.45} cy={py + r * 0.1} r={r * 0.7} fill="#6bb486" />
      <circle cx={px} cy={py - r * 0.35} r={r * 0.8} fill="#9fd3b0" />
    </g>
  );
}

/** Meuble de rangement ; `drawers` trace des tiroirs sur la face avant gauche. */
export function Cabinet({ x, y, w, d, h, colors = STONE, drawers = 0 }: { x: number; y: number; w: number; d: number; h: number; colors?: BoxColors; drawers?: number }) {
  const lines = [];
  for (let i = 1; i < drawers; i++) {
    const z = (h / drawers) * i;
    const [ax, ay] = project(x + 0.06, y + d, z);
    const [bx, by] = project(x + w - 0.06, y + d, z);
    lines.push(<line key={i} x1={ax} y1={ay} x2={bx} y2={by} stroke="rgba(20,32,60,0.18)" strokeWidth={0.7} />);
  }
  return (
    <g>
      <Box x={x} y={y} w={w} d={d} h={h} colors={colors} />
      {lines}
    </g>
  );
}

/** Voiture à l'échelle (4,2 m × 1,8 m), dans l'axe x ou y. */
export function Vehicle({ x, y, axis = "y", color = BLUE, z = 0 }: { x: number; y: number; axis?: "x" | "y"; color?: BoxColors; z?: number }) {
  const along = axis === "x";
  const W = along ? 4.2 : 1.8;
  const D = along ? 1.8 : 4.2;
  const cab = along ? { x: x + 1.15, y: y + 0.12, w: 2, d: 1.56 } : { x: x + 0.12, y: y + 1.15, w: 1.56, d: 2 };
  const wheels = along
    ? [
        [x + 0.95, y + D],
        [x + 3.25, y + D],
      ]
    : [
        [x + W, y + 0.95],
        [x + W, y + 3.25],
      ];
  return (
    <g style={{ pointerEvents: "none" }}>
      <polygon points={points([project(x - 0.1, y - 0.1, z), project(x + W + 0.5, y - 0.1, z), project(x + W + 0.5, y + D + 0.1, z), project(x - 0.1, y + D + 0.1, z)])} fill="rgba(20,32,60,0.12)" />
      <Box x={x} y={y} z={z + 0.28} w={W} d={D} h={0.55} colors={color} stroke="rgba(20,32,60,0.2)" />
      <Box x={cab.x} y={cab.y} z={z + 0.83} w={cab.w} d={cab.d} h={0.48} colors={{ top: color.top, left: "#9fb3e6", right: "#8aa0d8" }} stroke="rgba(20,32,60,0.2)" />
      {wheels.map(([wx, wy], i) => (
        <g key={i} transform={along ? onWallY(wx!, wy!, z + 0.3) : onWallX(wx!, wy!, z + 0.3)}>
          <circle r={5.2} fill="#1f2433" />
          <circle r={2.2} fill="#9aa3b5" />
        </g>
      ))}
    </g>
  );
}

/** Pont élévateur : deux colonnes de part et d'autre d'une voiture orientée en y. */
export function LiftPost({ x, y }: { x: number; y: number }) {
  return (
    <g>
      <Box x={x} y={y} w={0.4} d={0.4} h={2.3} colors={RED} />
      <Box x={x - 0.05} y={y - 0.05} z={2.3} w={0.5} d={0.5} h={0.1} colors={INK} />
    </g>
  );
}

export function TireStack({ x, y, count = 4 }: { x: number; y: number; count?: number }) {
  const rings = [];
  for (let i = 0; i < count; i++) {
    const [px, py] = project(x, y, 0.12 + i * 0.25);
    rings.push(
      <g key={i}>
        <ellipse cx={px} cy={py + 2} rx={11} ry={6.2} fill="#1f2433" />
        <ellipse cx={px} cy={py} rx={11} ry={6.2} fill="#2c3346" />
        <ellipse cx={px} cy={py} rx={4.5} ry={2.5} fill="#151925" />
      </g>,
    );
  }
  return <g style={{ pointerEvents: "none" }}>{rings}</g>;
}

/** Cloison vitrée basse le long d'un axe, avec une ouverture facultative (de `gap[0]` à `gap[1]`). */
export function Partition({ axis, at, from, to, gap, h = 1.05, colors = PARTITION }: { axis: "x" | "y"; at: number; from: number; to: number; gap?: [number, number]; h?: number; colors?: BoxColors }) {
  const segments: [number, number][] = gap ? [[from, gap[0]], [gap[1], to]] : [[from, to]];
  return (
    <g>
      {segments
        .filter(([a, b]) => b - a > 0.05)
        .map(([a, b]) =>
          axis === "x" ? (
            <Box key={a} x={a} y={at - 0.06} w={b - a} d={0.12} h={h} colors={colors} stroke="rgba(120,140,190,0.45)" />
          ) : (
            <Box key={a} x={at - 0.06} y={a} w={0.12} d={b - a} h={h} colors={colors} stroke="rgba(120,140,190,0.45)" />
          ),
        )}
    </g>
  );
}

type Step = readonly [x: number, y: number, pause?: number];

/**
 * Personne qui suit un trajet en boucle (le dernier point rejoint le premier).
 * `pause` : secondes d'arrêt à ce point. Vitesse de marche ≈ 1,2 m/s.
 */
export function Walker({ path, shirt, look = 0, offset = 0, speed = 1.2 }: { path: Step[]; shirt?: string; look?: number; offset?: number; speed?: number }) {
  const animated = usePlanMotion();
  const [x0, y0] = path[0]!;
  if (!animated) return <Person x={x0} y={y0} shirt={shirt} look={look} />;
  const loop = [...path, path[0]!];
  const times = [0];
  const values: string[] = [];
  let t = 0;
  const [ox, oy] = project(x0, y0);
  loop.forEach(([x, y, pause = 0], i) => {
    const [px, py] = project(x, y);
    const v = `${(px - ox).toFixed(1)} ${(py - oy).toFixed(1)}`;
    if (i > 0) {
      const [lx, ly] = loop[i - 1]!;
      t += Math.hypot(x - lx, y - ly) / speed;
      times.push(t);
    }
    values.push(v);
    if (pause && i < loop.length - 1) {
      t += pause;
      times.push(t);
      values.push(v);
    }
  });
  const dur = t;
  return (
    <g>
      <animateTransform
        attributeName="transform"
        type="translate"
        values={values.join(";")}
        keyTimes={times.map((v) => (v / dur).toFixed(4)).join(";")}
        dur={`${dur.toFixed(2)}s`}
        begin={`${-offset}s`}
        repeatCount="indefinite"
      />
      <Person x={x0} y={y0} shirt={shirt} look={look} walking />
    </g>
  );
}

/** Bulle de dialogue qui apparaît au-dessus d'une personne, de temps en temps. */
export function Bubble({ x, y, z = 1.9, delay = 0, kind = "dots", color = "#2d50f5" }: { x: number; y: number; z?: number; delay?: number; kind?: "dots" | "check" | "euro" | "mail"; color?: string }) {
  const [px, py] = project(x, y, z);
  return (
    <g className="plan-bubble" style={{ animationDelay: `${-delay}s`, pointerEvents: "none" }}>
      <g transform={`translate(${px.toFixed(1)} ${py.toFixed(1)})`}>
        <rect x={-9} y={-13} width={18} height={11} rx={5.5} fill={kind === "dots" ? "#ffffff" : color} stroke="rgba(20,32,60,0.12)" strokeWidth={0.6} />
        <path d="M -3 -2.2 L 0 1.4 L 2 -2.2 Z" fill={kind === "dots" ? "#ffffff" : color} />
        {kind === "dots" && [-4, 0, 4].map((dx) => <circle key={dx} cx={dx} cy={-7.5} r={1.2} fill="#7d8aa5" />)}
        {kind === "check" && <path d="M -3.2 -7.6 L -0.8 -5.2 L 3.6 -9.8" fill="none" stroke="#ffffff" strokeWidth={1.4} strokeLinecap="round" strokeLinejoin="round" />}
        {kind === "euro" && (
          <text x={0} y={-4.6} textAnchor="middle" fontSize={8} fontWeight={800} fill="#ffffff">
            €
          </text>
        )}
        {kind === "mail" && <path d="M -4.5 -10 h 9 v 6 h -9 z M -4.5 -10 l 4.5 3.4 l 4.5 -3.4" fill="none" stroke="#ffffff" strokeWidth={1} strokeLinejoin="round" />}
      </g>
    </g>
  );
}

/** Voyant lumineux (imprimante, terminal, borne). */
export function Led({ x, y, z, color = "#22c55e", delay = 0 }: { x: number; y: number; z: number; color?: string; delay?: number }) {
  const [px, py] = project(x, y, z);
  return <circle cx={px} cy={py} r={1.6} fill={color} className="plan-blink" style={{ animationDelay: `${-delay}s` }} />;
}

/** Monte et descend en boucle (pont élévateur, papier qui sort de l'imprimante…). */
export function Rise({ by, dur, children, offset = 0 }: { by: number; dur: number; children: React.ReactNode; offset?: number }) {
  const animated = usePlanMotion();
  return (
    <g>
      {animated && (
        <animateTransform
          attributeName="transform"
          type="translate"
          values={`0 0;0 0;0 ${-by};0 ${-by};0 0`}
          keyTimes="0;0.15;0.45;0.7;1"
          calcMode="spline"
          keySplines="0 0 1 1;0.4 0 0.2 1;0 0 1 1;0.4 0 0.2 1"
          dur={`${dur}s`}
          begin={`${-offset}s`}
          repeatCount="indefinite"
        />
      )}
      {children}
    </g>
  );
}

export { BLUE, GLASS, INK, STONE, WHITE };
