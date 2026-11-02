import { memo } from "react";

import { Box, points, project, quad, type BoxColors } from "@/components/plan/iso";
import { faceY, onWallX, onWallY } from "@/components/plan/furniture";
import { colorHex, guessBody } from "@/lib/vehicles";

/** Mélange une couleur hexadécimale vers le blanc (t > 0) ou le noir (t < 0). */
function shade(hex: string, t: number) {
  const n = Number.parseInt(hex.slice(1), 16);
  const target = t > 0 ? 255 : 0;
  const mix = (c: number) => Math.round(c + (target - c) * Math.abs(t));
  const [r, g, b] = [mix(n >> 16), mix((n >> 8) & 255), mix(n & 255)];
  return `rgb(${r} ${g} ${b})`;
}
const paint = (hex: string): BoxColors => ({ top: shade(hex, 0.18), left: hex, right: shade(hex, -0.16) });
const GLASS: BoxColors = { top: "#cfdaf5", left: "#9fb3e0", right: "#7f95c8" };
const TYRE = "#1f2433";

/** Gabarits des silhouettes, en cases du plan (x = longueur, y = largeur). */
const SHAPES = {
  CITY: { L: 3.6, W: 1.7, bodyZ: 0.3, bodyH: 0.5, cab: [0.85, 2.85], cabH: 0.55, wheel: 0.32 },
  COMPACT: { L: 4.2, W: 1.8, bodyZ: 0.3, bodyH: 0.48, cab: [1.15, 3.25], cabH: 0.48, wheel: 0.33 },
  SUV: { L: 4.4, W: 1.85, bodyZ: 0.42, bodyH: 0.62, cab: [1.0, 3.65], cabH: 0.55, wheel: 0.4 },
} as const;

function Wheel({ x, y, z, r }: { x: number; y: number; z: number; r: number }) {
  return (
    <g transform={onWallY(x, y, z)}>
      <circle r={r * 20} fill={TYRE} />
      <circle r={r * 9} fill="#b8c0cf" />
      <circle r={r * 3} fill="#6b7487" />
    </g>
  );
}

function Cabin({ x0, x1, y0, y1, z, h, colors }: { x0: number; x1: number; y0: number; y1: number; z: number; h: number; colors: BoxColors }) {
  // le toit est plus court que la base : pare-brise et lunette arrière inclinés
  const r0 = x0 + h * 0.75;
  const r1 = x1 - h * 1.15;
  const t = z + h;
  const mid = (r0 + r1) / 2;
  const stroke = { stroke: "rgba(20,32,60,0.22)", strokeWidth: 0.6, strokeLinejoin: "round" as const };
  return (
    <g>
      {/* flanc gauche vitré avec ses montants */}
      <polygon points={points([project(x0, y1, z), project(x1, y1, z), project(r1, y1, t), project(r0, y1, t)])} fill={GLASS.left} {...stroke} />
      <polygon points={points([project(mid - 0.05, y1, z), project(mid + 0.07, y1, z), project(mid + 0.05, y1, t), project(mid - 0.05, y1, t)])} fill={colors.left} />
      <polygon points={points([project(x1 - 0.12, y1, z), project(x1, y1, z), project(r1, y1, t), project(r1 - 0.1, y1, t)])} fill={colors.left} />
      <polygon points={points([project(x0, y1, z), project(x0 + 0.12, y1, z), project(r0 + 0.1, y1, t), project(r0, y1, t)])} fill={colors.left} />
      {/* pare-brise */}
      <polygon points={points([project(x1, y0, z), project(x1, y1, z), project(r1, y1, t), project(r1, y0, t)])} fill={GLASS.right} {...stroke} />
      <polygon points={points([project(r1 + 0.05, y0 + 0.15, t - 0.08), project(r1 + 0.05, y0 + 0.5, t - 0.08), project(x1 - 0.25, y0 + 0.65, z + 0.15), project(x1 - 0.25, y0 + 0.3, z + 0.15)])} fill="rgba(255,255,255,0.35)" />
      {/* toit */}
      <polygon points={quad(r0, y0, r1 - r0, y1 - y0, t)} fill={colors.top} {...stroke} />
    </g>
  );
}

function Car({ body, colors }: { body: keyof typeof SHAPES; colors: BoxColors }) {
  const s = SHAPES[body];
  const top = s.bodyZ + s.bodyH;
  const [c0, c1] = s.cab;
  const inset = 0.13;
  const mid = (c0 + c1) / 2;
  return (
    <g>
      {/* ombre au sol */}
      <polygon points={quad(-0.15, -0.15, s.L + 0.7, s.W + 0.3)} fill="rgba(20,32,60,0.13)" />
      <Box x={0} y={0} z={s.bodyZ} w={s.L} d={s.W} h={s.bodyH} colors={colors} stroke="rgba(20,32,60,0.22)" />
      {/* habitacle vitré : pare-brise et lunette inclinés, toit à la couleur de la carrosserie */}
      <Cabin x0={c0} x1={c1} y0={inset} y1={s.W - inset} z={top} h={s.cabH} colors={colors} />
      {/* ligne de porte */}
      <line
        x1={project(mid, s.W, s.bodyZ + 0.08)[0]}
        y1={project(mid, s.W, s.bodyZ + 0.08)[1]}
        x2={project(mid, s.W, top - 0.02)[0]}
        y2={project(mid, s.W, top - 0.02)[1]}
        stroke="rgba(20,32,60,0.25)"
        strokeWidth={0.6}
      />
      {/* poignée */}
      <polygon points={faceY(mid + 0.2, mid + 0.45, s.W, top - 0.16, top - 0.11)} fill="rgba(20,32,60,0.35)" />
      {body === "SUV" &&
        [inset + 0.08, s.W - inset - 0.12].map((y) => <Box key={y} x={c0 + s.cabH * 0.75 + 0.1} y={y} z={top + s.cabH} w={c1 - c0 - s.cabH * 1.9 - 0.2} d={0.04} h={0.07} colors={{ top: "#4a5675", left: "#3a4560", right: "#2c364d" }} stroke="none" />)}
      {/* phares avant et feux arrière */}
      {[0.22, s.W - 0.52].map((y) => (
        <g key={y} transform={onWallX(s.L, y, top - 0.12)}>
          <rect width={6} height={3} rx={1.2} fill="#fff6c9" stroke="rgba(20,32,60,0.25)" strokeWidth={0.4} />
        </g>
      ))}
      <polygon points={faceY(0, 0.08, s.W, top - 0.2, top - 0.08)} fill="#e0413a" />
      {/* plaque à l'avant */}
      <g transform={onWallX(s.L, s.W / 2 - 0.3, s.bodyZ + 0.22)}>
        <rect width={12} height={3.4} rx={0.6} fill="#ffffff" stroke="rgba(20,32,60,0.35)" strokeWidth={0.4} />
        <rect width={1.6} height={3.4} rx={0.4} fill="#2d50f5" />
      </g>
      <Wheel x={0.85} y={s.W} z={s.wheel} r={s.wheel} />
      <Wheel x={s.L - 0.85} y={s.W} z={s.wheel} r={s.wheel} />
    </g>
  );
}

function Moto({ colors }: { colors: BoxColors }) {
  const y = 0.5;
  const at = (x: number, z: number) => project(x, y, z);
  const line = (a: readonly [number, number], b: readonly [number, number], width: number, color: string) => (
    <line x1={a[0]} y1={a[1]} x2={b[0]} y2={b[1]} stroke={color} strokeWidth={width} strokeLinecap="round" />
  );
  return (
    <g>
      <polygon points={quad(0, 0.2, 3.6, 0.6)} fill="rgba(20,32,60,0.13)" />
      <Wheel x={0.55} y={y} z={0.5} r={0.5} />
      {/* bras oscillant, cadre et fourche */}
      {line(at(0.55, 0.5), at(1.45, 0.7), 2.4, "#4a5675")}
      {line(at(2.75, 0.5), at(2.4, 1.35), 2.2, "#9aa3b5")}
      <Box x={1.2} y={0.3} z={0.32} w={0.75} d={0.4} h={0.45} colors={{ top: "#a7b1c3", left: "#8a95aa", right: "#737e93" }} stroke="rgba(20,32,60,0.25)" />
      <Box x={1.7} y={0.25} z={0.85} w={0.7} d={0.5} h={0.3} colors={colors} stroke="rgba(20,32,60,0.25)" />
      <Box x={0.85} y={0.33} z={0.7} w={0.8} d={0.34} h={0.2} colors={colors} stroke="rgba(20,32,60,0.2)" />
      <Box x={0.75} y={0.32} z={0.9} w={0.95} d={0.36} h={0.12} colors={{ top: "#3a4660", left: "#2a344b", right: "#1f283b" }} stroke="none" />
      <Box x={0.45} y={0.35} z={0.95} w={0.35} d={0.3} h={0.08} colors={colors} stroke="none" />
      {/* guidon */}
      <line
        x1={project(2.35, 0.05, 1.4)[0]}
        y1={project(2.35, 0.05, 1.4)[1]}
        x2={project(2.35, 0.95, 1.4)[0]}
        y2={project(2.35, 0.95, 1.4)[1]}
        stroke="#2a344b"
        strokeWidth={1.8}
        strokeLinecap="round"
      />
      <g transform={onWallX(2.5, 0.38, 1.18)}>
        <circle cx={2.5} cy={0} r={3.2} fill="#fff6c9" stroke="rgba(20,32,60,0.3)" strokeWidth={0.5} />
      </g>
      <Wheel x={2.75} y={y} z={0.5} r={0.5} />
      {/* pot d'échappement */}
      <polygon points={points([at(0.6, 0.38), at(1.3, 0.42), at(1.3, 0.5), at(0.6, 0.48)])} fill="#9aa3b5" />
    </g>
  );
}

/**
 * Dessin du véhicule dans le style du plan : la silhouette suit le type
 * (choisi, ou deviné d'après le modèle) et la carrosserie prend sa couleur.
 */
export const VehicleIllustration = memo(function VehicleIllustration({
  name,
  color,
  bodyType,
  transmission,
  className,
}: {
  name: string;
  color: string | null;
  bodyType: string | null;
  transmission?: string;
  className?: string;
}) {
  const body = bodyType ?? guessBody(name, transmission);
  const colors = paint(colorHex(color));
  return (
    <svg viewBox={body === "MOTO" ? "-30 -40 100 80" : "-40 -36 124 100"} className={className} role="img" aria-label={`Illustration : ${name}`}>
      <polygon points={quad(-0.9, -0.7, 6.3, 3.3)} fill="rgba(255,255,255,0.55)" />
      {body === "MOTO" ? <Moto colors={colors} /> : <Car body={body as keyof typeof SHAPES} colors={colors} />}
    </svg>
  );
});
