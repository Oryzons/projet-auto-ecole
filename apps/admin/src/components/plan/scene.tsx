import type { ZoneId } from "@/lib/plan-types";

import { BLUE, Box, Car, GLASS, INK, SLATE, STONE, Shadow, SignLeft, Tree, WHITE, WindowsLeft, WindowsRight, points, project, quad, type BoxColors } from "./iso";

/** Dimensions du plan : 3 × 3 parcelles de 8 cases, séparées par des routes de 3 cases. */
export const PARCEL = 8;
export const ROAD = 3;
export const WORLD = 3 * PARCEL + 4 * ROAD;

/** Position de chaque zone : colonne (axe x) et rangée (axe y). La rangée 0 est au fond. */
export const ZONE_LAYOUT: Record<ZoneId, { col: number; row: number; top: number }> = {
  parc: { col: 0, row: 0, top: 1.4 },
  planning: { col: 1, row: 0, top: 4.4 },
  examens: { col: 2, row: 0, top: 3.6 },
  code: { col: 0, row: 1, top: 3 },
  accueil: { col: 1, row: 1, top: 4.6 },
  inscriptions: { col: 2, row: 1, top: 2.6 },
  communication: { col: 0, row: 2, top: 5.2 },
  administratif: { col: 1, row: 2, top: 4.2 },
  comptabilite: { col: 2, row: 2, top: 3.8 },
};

export function parcelOrigin(id: ZoneId) {
  const { col, row } = ZONE_LAYOUT[id];
  return { ox: ROAD + col * (PARCEL + ROAD), oy: ROAD + row * (PARCEL + ROAD) };
}

/** Point d'ancrage du badge d'une zone, au-dessus de son bâtiment principal. */
export function zoneAnchor(id: ZoneId, lift = 1.2) {
  const { ox, oy } = parcelOrigin(id);
  return project(ox + PARCEL / 2, oy + PARCEL / 2, ZONE_LAYOUT[id].top + lift);
}

/** Centre de la parcelle au sol (pour centrer la caméra). */
export function zoneCenter(id: ZoneId) {
  const { ox, oy } = parcelOrigin(id);
  return project(ox + PARCEL / 2, oy + PARCEL / 2, 1.5);
}

/** Bâtiment avec ombre, pour ne jamais oublier l'une ou l'autre. */
function Building(props: { x: number; y: number; z?: number; w: number; d: number; h: number; colors?: BoxColors }) {
  return (
    <>
      {!props.z && <Shadow x={props.x} y={props.y} w={props.w} d={props.d} h={props.h} />}
      <Box {...props} />
    </>
  );
}

/** Décor propre à chaque zone, dessiné dans sa parcelle (de l'arrière vers l'avant). */
export function ZoneArt({ id }: { id: ZoneId }) {
  const { ox: X, oy: Y } = parcelOrigin(id);
  switch (id) {
    case "parc":
      return (
        <g>
          <polygon points={quad(X + 0.6, Y + 0.6, 6.8, 6.8, 0.13)} fill="#e6eaf1" />
          {[0, 1, 2, 3].map((i) => (
            <polygon key={i} points={quad(X + 0.9, Y + 1 + i * 1.5, 3.6, 0.07, 0.14)} fill="#ffffff" />
          ))}
          <Car x={X + 1.6} y={Y + 1.25} color={BLUE} />
          <Car x={X + 1.3} y={Y + 2.75} color={WHITE} />
          <Car x={X + 1.5} y={Y + 5.75} color={INK} />
          <Building x={X + 5} y={Y + 1} w={2.2} d={3} h={1.5} colors={STONE} />
          <polygon points={points([project(X + 7.2, Y + 1.5, 0), project(X + 7.2, Y + 3.5, 0), project(X + 7.2, Y + 3.5, 1.1), project(X + 7.2, Y + 1.5, 1.1)])} fill="#c4ccd9" />
          {[0, 1, 2, 3].map((i) => (
            <line key={i} x1={project(X + 7.2, Y + 1.5, 0.25 + i * 0.25)[0]} y1={project(X + 7.2, Y + 1.5, 0.25 + i * 0.25)[1]} x2={project(X + 7.2, Y + 3.5, 0.25 + i * 0.25)[0]} y2={project(X + 7.2, Y + 3.5, 0.25 + i * 0.25)[1]} stroke="#aeb8c8" strokeWidth={0.8} />
          ))}
          <Tree x={X + 6.6} y={Y + 6.4} size={0.9} />
        </g>
      );
    case "planning":
      return (
        <g>
          <Tree x={X + 1.2} y={Y + 1.2} size={0.85} />
          <Building x={X + 1.8} y={Y + 1.8} w={4.4} d={4.2} h={3.2} colors={WHITE} />
          <WindowsLeft x={X + 1.8} y={Y + 1.8} w={4.4} d={4.2} floors={3} cols={4} />
          <WindowsRight x={X + 1.8} y={Y + 1.8} w={4.4} d={4.2} floors={3} cols={4} />
          <Box x={X + 3.2} y={Y + 3} z={3.2} w={1.6} d={1.6} h={1.1} colors={STONE} />
          {/* horloge du planning, peinte sur la façade */}
          <g transform={`matrix(0.866 0.5 0 1 ${project(X + 4, Y + 4.6, 3.8)[0].toFixed(1)} ${project(X + 4, Y + 4.6, 3.8)[1].toFixed(1)})`}>
            <circle r={6.5} fill="#ffffff" stroke="#2d50f5" strokeWidth={1.4} />
            <line x1={0} y1={0} x2={0} y2={-4.2} stroke="#14203c" strokeWidth={1.1} strokeLinecap="round" />
            <line x1={0} y1={0} x2={3.2} y2={0} stroke="#14203c" strokeWidth={1.1} strokeLinecap="round" />
          </g>
          <SignLeft x={X + 2.1} y={Y + 6} z={0.25} text="PLANNING" size={7.5} />
          <Tree x={X + 6.8} y={Y + 6.6} size={0.75} />
        </g>
      );
    case "examens":
      return (
        <g>
          {/* piste d'examen : boucle et plots */}
          <polygon points={quad(X + 0.7, Y + 0.7, 6.6, 6.6, 0.13)} fill="#e3e7ee" />
          <polygon points={quad(X + 1.9, Y + 1.9, 4.2, 4.2, 0.14)} fill="#f7f8fb" />
          <polygon points={quad(X + 1.3, Y + 1.3, 5.4, 5.4, 0.14)} fill="none" stroke="#ffffff" strokeWidth={1} strokeDasharray="5 5" />
          {[
            [X + 2.6, Y + 2.4],
            [X + 4, Y + 2.4],
            [X + 5.4, Y + 2.4],
          ].map(([cx, cy], i) => {
            const [px, py] = project(cx, cy, 0.14);
            return <polygon key={i} points={`${px},${py - 9} ${px - 3.5},${py} ${px + 3.5},${py}`} fill="#f08c00" stroke="#ffffff" strokeWidth={0.6} />;
          })}
          <Building x={X + 3} y={Y + 3.6} w={2.6} d={2.4} h={2} colors={WHITE} />
          <Box x={X + 3.5} y={Y + 4.1} z={2} w={1.6} d={1.4} h={1.2} colors={GLASS} />
          <Box x={X + 3.3} y={Y + 3.9} z={3.2} w={2} d={1.8} h={0.22} colors={SLATE} />
          {/* drapeau à damier */}
          <line x1={project(X + 6.6, Y + 6.4, 0)[0]} y1={project(X + 6.6, Y + 6.4, 0)[1]} x2={project(X + 6.6, Y + 6.4, 3)[0]} y2={project(X + 6.6, Y + 6.4, 3)[1]} stroke="#7a8599" strokeWidth={1.2} />
          <polygon points={points([project(X + 6.6, Y + 6.4, 3), project(X + 7.6, Y + 6.4, 3), project(X + 7.6, Y + 6.4, 2.4), project(X + 6.6, Y + 6.4, 2.4)])} fill="#14203c" />
          <SignLeft x={X + 3.1} y={Y + 6} z={0.35} text="EXAMENS" size={6.5} />
        </g>
      );
    case "code":
      return (
        <g>
          <Tree x={X + 1} y={Y + 6.8} size={0.8} />
          <Building x={X + 1.2} y={Y + 1.5} w={5.8} d={3.8} h={2.4} colors={WHITE} />
          {/* grand écran de la salle de code */}
          <polygon points={points([project(X + 1.8, Y + 5.3, 0.6), project(X + 4.6, Y + 5.3, 0.6), project(X + 4.6, Y + 5.3, 2), project(X + 1.8, Y + 5.3, 2)])} fill="#1f2a44" />
          <polygon points={points([project(X + 2.1, Y + 5.3, 1.25), project(X + 4.3, Y + 5.3, 1.25), project(X + 4.3, Y + 5.3, 1.75), project(X + 2.1, Y + 5.3, 1.75)])} fill="#5b78ff" opacity={0.85} />
          <WindowsRight x={X + 1.2} y={Y + 1.5} w={5.8} d={3.8} floors={2} cols={3} />
          <Box x={X + 1.2} y={Y + 1.5} z={2.4} w={5.8} d={3.8} h={0.18} colors={SLATE} />
          <SignLeft x={X + 4.9} y={Y + 5.3} z={0.6} text="CODE" size={7.5} />
        </g>
      );
    case "accueil":
      return (
        <g>
          <polygon points={quad(X + 0.8, Y + 5.6, 6.4, 1.8, 0.13)} fill="#e6eaf1" />
          <Building x={X + 1} y={Y + 1} w={6} d={4.6} h={3.4} colors={WHITE} />
          <WindowsLeft x={X + 1} y={Y + 1} w={6} d={4.6} floors={3} cols={5} />
          <WindowsRight x={X + 1} y={Y + 1} w={6} d={4.6} floors={3} cols={4} />
          {/* bandeau bleu et enseigne principale */}
          <Box x={X + 1} y={Y + 1} z={3.4} w={6} d={4.6} h={0.25} colors={BLUE} />
          <Box x={X + 2.6} y={Y + 5.6} z={1.2} w={2.8} d={1.2} h={0.18} colors={STONE} />
          <Box x={X + 2.7} y={Y + 6.6} w={0.15} d={0.15} h={1.2} colors={SLATE} />
          <Box x={X + 5.15} y={Y + 6.6} w={0.15} d={0.15} h={1.2} colors={SLATE} />
          <SignLeft x={X + 2.2} y={Y + 5.6} z={2.15} text="VIRAGE" size={10} color="#2d50f5" />
          <Tree x={X + 0.8} y={Y + 7.2} size={0.8} />
          <Tree x={X + 7.3} y={Y + 7.2} size={0.8} />
        </g>
      );
    case "inscriptions":
      return (
        <g>
          <Building x={X + 1.6} y={Y + 1.6} w={4.6} d={3.8} h={2.2} colors={GLASS} />
          <Box x={X + 1.4} y={Y + 1.4} z={2.2} w={5} d={4.2} h={0.24} colors={WHITE} />
          {/* auvent bleu au-dessus de l'entrée */}
          <Box x={X + 2} y={Y + 5.4} z={1.45} w={3.8} d={0.9} h={0.16} colors={BLUE} />
          <WindowsLeft x={X + 1.6} y={Y + 1.6} w={4.6} d={3.8} floors={2} cols={4} color="#b9c9fb" />
          <SignLeft x={X + 1.9} y={Y + 5.4} z={0.95} text="INSCRIPTIONS" size={6} color="#ffffff" />
          <Tree x={X + 7} y={Y + 2} size={0.8} />
          <Tree x={X + 7.1} y={Y + 6.8} size={0.9} />
        </g>
      );
    case "communication":
      return (
        <g>
          <Tree x={X + 1} y={Y + 1} size={0.8} />
          <Building x={X + 1.5} y={Y + 2} w={4.8} d={4} h={2.8} colors={WHITE} />
          <WindowsLeft x={X + 1.5} y={Y + 2} w={4.8} d={4} floors={2} cols={4} />
          <WindowsRight x={X + 1.5} y={Y + 2} w={4.8} d={4} floors={2} cols={3} />
          <Box x={X + 1.5} y={Y + 2} z={2.8} w={4.8} d={4} h={0.18} colors={SLATE} />
          {/* antenne et parabole */}
          <Box x={X + 4.6} y={Y + 2.8} z={2.98} w={0.2} d={0.2} h={2.2} colors={SLATE} />
          <ellipse cx={project(X + 3, Y + 3.4, 3.6)[0]} cy={project(X + 3, Y + 3.4, 3.6)[1]} rx={7} ry={4} fill="#ffffff" stroke="#b9c2d2" strokeWidth={0.8} />
          <circle cx={project(X + 4.7, Y + 2.9, 5.2)[0]} cy={project(X + 4.7, Y + 2.9, 5.2)[1]} r={2.2} fill="#2d50f5" />
          <SignLeft x={X + 1.9} y={Y + 6} z={0.3} text="MESSAGES" size={6.5} />
          <Tree x={X + 7} y={Y + 7} size={0.9} />
        </g>
      );
    case "administratif":
      return (
        <g>
          <Building x={X + 1} y={Y + 1} w={4.2} d={5.2} h={4} colors={WHITE} />
          <WindowsLeft x={X + 1} y={Y + 1} w={4.2} d={5.2} floors={4} cols={3} />
          <WindowsRight x={X + 1} y={Y + 1} w={4.2} d={5.2} floors={4} cols={4} />
          <Box x={X + 1} y={Y + 1} z={4} w={4.2} d={5.2} h={0.18} colors={SLATE} />
          <Building x={X + 5.2} y={Y + 3} w={2.2} d={3.2} h={2} colors={STONE} />
          <WindowsRight x={X + 5.2} y={Y + 3} w={2.2} d={3.2} floors={2} cols={2} />
          <SignLeft x={X + 1.25} y={Y + 6.2} z={0.3} text="BUREAU" size={7} />
          <Tree x={X + 7} y={Y + 1.6} size={0.8} />
        </g>
      );
    case "comptabilite":
      return (
        <g>
          <Tree x={X + 1} y={Y + 1.2} size={0.8} />
          <Building x={X + 1.5} y={Y + 2} w={4.4} d={4} h={2.6} colors={WHITE} />
          <WindowsLeft x={X + 1.5} y={Y + 2} w={4.4} d={4} floors={2} cols={4} />
          <Building x={X + 4.4} y={Y + 1.2} w={2} d={2} h={3.6} colors={STONE} />
          <WindowsRight x={X + 4.4} y={Y + 1.2} w={2} d={2} floors={3} cols={2} />
          <Box x={X + 1.5} y={Y + 2} z={2.6} w={4.4} d={4} h={0.18} colors={SLATE} />
          <SignLeft x={X + 1.8} y={Y + 6} z={0.3} text="COMPTA" size={7} />
          <Tree x={X + 7} y={Y + 6.8} size={0.85} />
        </g>
      );
  }
}

/** Socle, routes et marquages au sol. */
export function Ground() {
  const strips = [0, 1, 2, 3].map((i) => i * (PARCEL + ROAD));
  const dashes = [];
  for (const s of strips) {
    for (let t = 0.6; t < WORLD; t += 1.6) {
      dashes.push(<polygon key={`h${s}-${t}`} points={quad(t, s + ROAD / 2 - 0.05, 0.8, 0.1, 0.02)} fill="#ffffff" />);
      dashes.push(<polygon key={`v${s}-${t}`} points={quad(s + ROAD / 2 - 0.05, t, 0.1, 0.8, 0.02)} fill="#ffffff" />);
    }
  }
  return (
    <g>
      {/* socle */}
      <polygon points={points([project(0, WORLD, 0), project(WORLD, WORLD, 0), project(WORLD, WORLD, -1.1), project(0, WORLD, -1.1)])} fill="#dfe4ec" />
      <polygon points={points([project(WORLD, 0, 0), project(WORLD, WORLD, 0), project(WORLD, WORLD, -1.1), project(WORLD, 0, -1.1)])} fill="#cfd6e1" />
      <polygon points={quad(0, 0, WORLD, WORLD)} fill="#d9dee7" />
      {strips.map((s) => (
        <g key={s}>
          <polygon points={quad(0, s, WORLD, ROAD, 0.01)} fill="#d3d9e3" />
          <polygon points={quad(s, 0, ROAD, WORLD, 0.01)} fill="#d3d9e3" />
        </g>
      ))}
      {dashes}
      {/* passages piétons devant l'accueil */}
      {[0, 1, 2, 3, 4].map((i) => (
        <polygon key={i} points={quad(ROAD + PARCEL + ROAD + 3 + i * 0.45, 2 * PARCEL + 2 * ROAD + 0.4, 0.25, 2.2, 0.02)} fill="#f4f6fa" />
      ))}
    </g>
  );
}

/** Parcelle d'une zone : dalle légèrement surélevée. */
export function Parcel({ id }: { id: ZoneId }) {
  const { ox, oy } = parcelOrigin(id);
  return (
    <g>
      <polygon points={points([project(ox, oy + PARCEL, 0), project(ox + PARCEL, oy + PARCEL, 0), project(ox + PARCEL, oy + PARCEL, 0.12), project(ox, oy + PARCEL, 0.12)])} fill="#e9edf3" />
      <polygon points={points([project(ox + PARCEL, oy, 0), project(ox + PARCEL, oy + PARCEL, 0), project(ox + PARCEL, oy + PARCEL, 0.12), project(ox + PARCEL, oy, 0.12)])} fill="#dde2ea" />
      <polygon points={quad(ox, oy, PARCEL, PARCEL, 0.12)} fill="#f6f7fa" />
    </g>
  );
}

export function parcelOutline(id: ZoneId, inset = -0.25) {
  const { ox, oy } = parcelOrigin(id);
  return quad(ox + inset, oy + inset, PARCEL - 2 * inset, PARCEL - 2 * inset, 0.13);
}

/** Voitures qui circulent sur les deux routes horizontales intérieures. */
export function Traffic({ road }: { road: 1 | 2 }) {
  const lane = road * (PARCEL + ROAD) + (road === 1 ? 2 : 0.25);
  const [dx, dy] = project(WORLD + 4, 0);
  return (
    <g className="plan-traffic" style={{ ["--dx" as string]: `${road === 1 ? dx : -dx}px`, ["--dy" as string]: `${road === 1 ? dy : -dy}px`, animationDuration: road === 1 ? "26s" : "34s" }}>
      {road === 1 ? <Car x={-2} y={lane} color={BLUE} /> : <Car x={WORLD + 1} y={lane} color={WHITE} />}
    </g>
  );
}

/** Rectangle englobant de la scène, en pixels projetés. */
export function sceneBounds() {
  const [l] = project(0, WORLD);
  const [r] = project(WORLD, 0);
  const [, top] = project(0, 0, 6.5);
  const [, bottom] = project(WORLD, WORLD, -1.1);
  return { x: l - 30, y: top, w: r - l + 60, h: bottom - top + 20 };
}
