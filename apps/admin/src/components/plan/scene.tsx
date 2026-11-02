import type { ZoneId } from "@/lib/plan-types";

import {
  BLUE,
  Bubble,
  Cabinet,
  Chair,
  DESK,
  Desk,
  FloorLabel,
  INK,
  Led,
  LiftPost,
  Monitor,
  PARTITION,
  Partition,
  Person,
  Plant,
  RED,
  Rise,
  SOFA,
  STONE,
  TireStack,
  Vehicle,
  WHITE,
  WOOD,
  Walker,
  Workstation,
  faceX,
  faceY,
  onWallX,
  onWallY,
  usePlanMotion,
} from "./furniture";
import { Box, points, project, quad } from "./iso";

/**
 * L'auto-école vue comme un open space d'un seul tenant (36 m × 28 m) :
 * deux murs extérieurs au fond, des cloisons vitrées basses entre les espaces.
 */
export const FLOOR_W = 36;
export const FLOOR_D = 28;
const WALL_H = 3;

type Room = { x: number; y: number; w: number; d: number; row: number; col: number; floor: string; label: string };

export const ROOMS: Record<ZoneId, Room> = {
  parc: { x: 0, y: 0, w: 13.5, d: 10, row: 0, col: 0, floor: "#e6e9ef", label: "GARAGE" },
  planning: { x: 15, y: 0, w: 9, d: 10, row: 0, col: 1, floor: "#f1f3fa", label: "PLANNING" },
  examens: { x: 25.5, y: 0, w: 10.5, d: 10, row: 0, col: 2, floor: "#f8f9fc", label: "SALLE D'EXAMEN" },
  code: { x: 0, y: 11.5, w: 13.5, d: 7.5, row: 1, col: 0, floor: "#e9eefc", label: "SALLE DE CODE" },
  administratif: { x: 15, y: 11.5, w: 9, d: 7.5, row: 1, col: 1, floor: "#f5f1eb", label: "BUREAU" },
  inscriptions: { x: 25.5, y: 11.5, w: 10.5, d: 7.5, row: 1, col: 2, floor: "#edf6f1", label: "INSCRIPTIONS" },
  communication: { x: 0, y: 20.5, w: 13.5, d: 7.5, row: 2, col: 0, floor: "#f1effa", label: "COMMUNICATION" },
  accueil: { x: 15, y: 20.5, w: 9, d: 7.5, row: 2, col: 1, floor: "#f7f0e6", label: "ACCUEIL" },
  comptabilite: { x: 25.5, y: 20.5, w: 10.5, d: 7.5, row: 2, col: 2, floor: "#eef3f7", label: "COMPTABILITÉ" },
};

/** Ordre de dessin : du fond vers l'avant. */
export const DRAW_ORDER = (Object.keys(ROOMS) as ZoneId[]).sort((a, b) => ROOMS[a].row - ROOMS[b].row || ROOMS[a].col - ROOMS[b].col);

/** Point d'ancrage du badge d'une zone, au-dessus de son centre. */
export function zoneAnchor(id: ZoneId) {
  const r = ROOMS[id];
  return project(r.x + r.w / 2, r.y + r.d / 2, 2.6);
}

/** Centre de l'espace (pour centrer la caméra). */
export function zoneCenter(id: ZoneId) {
  const r = ROOMS[id];
  return project(r.x + r.w / 2, r.y + r.d / 2, 0.8);
}

export function roomOutline(id: ZoneId, inset = 0.15) {
  const r = ROOMS[id];
  return quad(r.x + inset, r.y + inset, r.w - 2 * inset, r.d - 2 * inset, 0.04);
}

/** Rectangle englobant de la scène, en pixels projetés. */
export function sceneBounds() {
  const [l] = project(0, FLOOR_D);
  const [r] = project(FLOOR_W, 0);
  const [, top] = project(0, 0, WALL_H + 0.6);
  const [, bottom] = project(FLOOR_W, FLOOR_D, -0.6);
  return { x: l - 24, y: top - 10, w: r - l + 48, h: bottom - top + 30 };
}

/** Dalle, murs extérieurs du fond et allées. */
export function Ground() {
  const windowsBack = [];
  for (let x = 15.6; x < FLOOR_W - 1; x += 2.6) windowsBack.push(<polygon key={x} points={faceY(x, x + 1.8, 0, 1, 2.4)} fill="#d6e1f7" />);
  const windowsLeft = [];
  for (let y = 12.4; y < FLOOR_D - 1; y += 2.6) {
    // les écrans de la salle de code et de la communication occupent une partie du mur
    if ((y > 12.5 && y < 18.5) || (y > 21 && y < 26.5)) continue;
    windowsLeft.push(<polygon key={y} points={faceX(0, y, y + 1.8, 1, 2.4)} fill="#ccd8f0" />);
  }
  return (
    <g>
      {/* épaisseur de la dalle */}
      <polygon points={points([project(0, FLOOR_D, 0), project(FLOOR_W, FLOOR_D, 0), project(FLOOR_W, FLOOR_D, -0.6), project(0, FLOOR_D, -0.6)])} fill="#dfe4ec" />
      <polygon points={points([project(FLOOR_W, 0, 0), project(FLOOR_W, FLOOR_D, 0), project(FLOOR_W, FLOOR_D, -0.6), project(FLOOR_W, 0, -0.6)])} fill="#cfd6e1" />
      <polygon points={quad(0, 0, FLOOR_W, FLOOR_D)} fill="#fbfcfd" />
      {/* murs du fond, vus de l'intérieur */}
      <Box x={-0.35} y={-0.35} w={FLOOR_W + 0.35} d={0.35} h={WALL_H} colors={{ top: "#e3e8f0", left: "#f4f6fa", right: "#dfe4ec" }} />
      <Box x={-0.35} y={0} w={0.35} d={FLOOR_D} h={WALL_H} colors={{ top: "#e3e8f0", left: "#dfe4ec", right: "#eef1f6" }} />
      {windowsBack}
      {windowsLeft}
      {/* plinthes bleues */}
      <polygon points={faceY(0, FLOOR_W, 0, 0, 0.12)} fill="#c9d3ef" />
      <polygon points={faceX(0, 0, FLOOR_D, 0, 0.12)} fill="#c0cbea" />
      {/* allées */}
      <polygon points={quad(0, 10, FLOOR_W, 1.5, 0.01)} fill="#f1f3f7" />
      <polygon points={quad(0, 19, FLOOR_W, 1.5, 0.01)} fill="#f1f3f7" />
      <polygon points={quad(13.5, 0, 1.5, FLOOR_D, 0.01)} fill="#f1f3f7" />
      <polygon points={quad(24, 0, 1.5, FLOOR_D, 0.01)} fill="#f1f3f7" />
    </g>
  );
}

/** Sol de l'espace, cloisons du fond et nom peint au sol. */
export function RoomFloor({ id }: { id: ZoneId }) {
  const r = ROOMS[id];
  const closed = id === "examens";
  return (
    <g>
      <polygon points={quad(r.x, r.y, r.w, r.d, 0.02)} fill={r.floor} />
      {r.y > 0 && !closed && <Partition axis="x" at={r.y} from={r.x} to={r.x + r.w} gap={[r.x + r.w / 2 - 0.8, r.x + r.w / 2 + 0.8]} />}
      {r.x > 0 && !closed && <Partition axis="y" at={r.x} from={r.y} to={r.y + r.d} gap={[r.y + r.d / 2 - 0.8, r.y + r.d / 2 + 0.8]} />}
      {closed && <Partition axis="y" at={r.x + 0.3} from={r.y} to={r.y + r.d - 0.3} h={2.2} />}
      <FloorLabel x={r.x + 0.5} y={r.y + r.d - 0.45} text={r.label} />
    </g>
  );
}

/** Aiguille d'horloge qui tourne autour de son point d'attache. */
function ClockSpin({ dur }: { dur: number }) {
  const animated = usePlanMotion();
  if (!animated) return null;
  return <animateTransform attributeName="transform" type="rotate" from="0 0 0" to="360 0 0" dur={`${dur}s`} repeatCount="indefinite" />;
}

/** Diapositive suivante du cours de code, qui s'affiche une fois sur deux. */
function Slide() {
  const animated = usePlanMotion();
  if (!animated) return null;
  return (
    <g opacity={0}>
      <animate attributeName="opacity" values="0;0;1;1;0" keyTimes="0;0.45;0.5;0.95;1" dur="12s" repeatCount="indefinite" />
      <rect x={0} y={0} width={80} height={34} rx={2} fill="#2d50f5" />
      <circle cx={21} cy={17} r={11} fill="#ffffff" />
      <circle cx={21} cy={17} r={8.5} fill="#e11d48" />
      <rect x={14} y={15.5} width={14} height={3} fill="#ffffff" />
      <rect x={42} y={9} width={30} height={4} rx={2} fill="#ffffff" />
      <rect x={42} y={17} width={22} height={4} rx={2} fill="#b9c8ff" />
    </g>
  );
}

/** Passants dans les allées entre les rangées d'espaces (dessinés après la rangée `after`). */
export function AisleLife({ after }: { after: 0 | 1 | 2 }) {
  if (after === 0)
    return (
      <g>
        <Walker path={[[2, 10.6, 1], [34, 10.8, 2]]} shirt={SHIRTS[4]} look={2} offset={6} />
        <Walker path={[[30, 10.9, 0], [8, 10.7, 3]]} shirt={SHIRTS[6]} look={0} offset={14} speed={1} />
      </g>
    );
  if (after === 1)
    return (
      <g>
        <Walker path={[[33, 19.7, 2], [3, 19.8, 1]]} shirt={SHIRTS[5]} look={3} offset={3} />
        <Walker path={[[16, 19.9, 0], [27, 19.6, 2]]} shirt={SHIRTS[0]} look={1} offset={9} speed={0.9} />
      </g>
    );
  return (
    <g>
      <Walker path={[[14.3, 0.8, 2], [14.2, 26.5, 1]]} shirt={SHIRTS[3]} look={4} offset={4} />
      <Walker path={[[24.8, 26.8, 1], [24.7, 1.2, 2]]} shirt={SHIRTS[7]} look={0} offset={11} speed={1} />
    </g>
  );
}

const SHIRTS = ["#2d50f5", "#14203c", "#16a34a", "#f59e0b", "#e11d48", "#64748b", "#0ea5e9", "#8b5cf6"];

/** Mobilier propre à chaque espace, de l'arrière vers l'avant. */
export function ZoneArt({ id }: { id: ZoneId }) {
  const { x: X, y: Y, w: W, d: D } = ROOMS[id];
  switch (id) {
    case "parc":
      return (
        <g>
          {/* portes sectionnelles du garage */}
          {[1.4, 7.6].map((x0) => (
            <g key={x0}>
              <polygon points={faceY(X + x0, X + x0 + 4.4, 0, 0, 2.6)} fill="#cdd4e0" />
              {[0.4, 0.8, 1.2, 1.6, 2, 2.4].map((z) => (
                <line key={z} x1={project(X + x0, 0, z)[0]} y1={project(X + x0, 0, z)[1]} x2={project(X + x0 + 4.4, 0, z)[0]} y2={project(X + x0 + 4.4, 0, z)[1]} stroke="#b4bdcc" strokeWidth={0.8} />
              ))}
            </g>
          ))}
          {/* marquages au sol des deux ponts */}
          <polygon points={quad(X + 1.8, Y + 1.8, 3.6, 5.6, 0.03)} fill="none" stroke="#f5b400" strokeWidth={1.2} strokeDasharray="6 4" />
          <polygon points={quad(X + 8, Y + 1.8, 3.6, 5.6, 0.03)} fill="none" stroke="#f5b400" strokeWidth={1.2} strokeDasharray="6 4" />
          <TireStack x={X + 12.6} y={Y + 1.2} />
          <TireStack x={X + 12.6} y={Y + 2.6} count={3} />
          <LiftPost x={X + 1.9} y={Y + 4.2} />
          <Rise by={22} dur={14}>
            <Vehicle x={X + 2.7} y={Y + 2.4} axis="y" color={BLUE} z={0.25} />
          </Rise>
          <LiftPost x={X + 4.9} y={Y + 4.2} />
          <LiftPost x={X + 8.1} y={Y + 4.2} />
          <Vehicle x={X + 8.9} y={Y + 2.4} axis="y" color={WHITE} />
          <LiftPost x={X + 11.1} y={Y + 4.2} />
          <Walker path={[[X + 6.6, Y + 1.6, 3], [X + 6.6, Y + 6.6, 4]]} shirt="#1e3a8a" look={1} />
          <Cabinet x={X + 0.2} y={Y + 6.6} w={0.7} d={2.6} h={0.95} colors={RED} drawers={4} />
          <Person x={X + 1.6} y={Y + 8} shirt="#1e3a8a" look={2} />
          <Vehicle x={X + 7.6} y={Y + 7.6} axis="x" color={{ top: "#3a4660", left: "#2a344b", right: "#1f283b" }} />
        </g>
      );
    case "planning":
      return (
        <g>
          {/* grand planning mural : moniteurs en lignes, créneaux en couleurs */}
          <polygon points={faceY(X + 0.8, X + 7.2, 0.02, 0.8, 2.6)} fill="#ffffff" stroke="#d3daea" strokeWidth={0.8} />
          <g transform={onWallY(X + 1, 0.02, 2.45)}>
            {[0, 1, 2, 3, 4].map((row) =>
              [0, 1, 2, 3, 4, 5, 6, 7, 8, 9].map((col) => {
                const busy = (row * 7 + col * 3) % 5;
                if (busy > 2) return null;
                const fill = busy === 0 ? "#2d50f5" : busy === 1 ? "#93a8ff" : "#f5b400";
                const live = (row + col * 2) % 4 === 0;
                return (
                  <rect
                    key={`${row}-${col}`}
                    x={10 + col * 9.6}
                    y={4 + row * 6.4}
                    width={8.4}
                    height={5}
                    rx={1.2}
                    fill={fill}
                    className={live ? "plan-glow" : undefined}
                    style={live ? { animationDelay: `${-((row * 1.3 + col * 0.7) % 4)}s` } : undefined}
                  />
                );
              }),
            )}
            {[0, 1, 2, 3, 4].map((row) => (
              <circle key={row} cx={4} cy={6.5 + row * 6.4} r={2.2} fill="#c3cce0" />
            ))}
          </g>
          <Walker path={[[X + 7.8, Y + 1.1, 3], [X + 1.4, Y + 1.2, 5]]} shirt={SHIRTS[2]} look={3} speed={0.8} />
          <Bubble x={X + 2.85} y={Y + 4} z={1.6} delay={2} />
          {/* table de réunion des moniteurs */}
          <Chair x={X + 2.6} y={Y + 3.6} back="y" />
          <Person x={X + 2.85} y={Y + 4} seated shirt={SHIRTS[0]} look={0} />
          <Chair x={X + 4.4} y={Y + 3.6} back="y" />
          <Person x={X + 4.65} y={Y + 4} seated shirt={SHIRTS[3]} look={4} />
          <Desk x={X + 2.2} y={Y + 4.3} w={4.2} d={1.5} colors={WOOD} />
          <Box x={X + 3} y={Y + 4.6} z={0.75} w={0.5} d={0.35} h={0.04} colors={WHITE} />
          <Chair x={X + 3.5} y={Y + 6} back="-y" />
          <Person x={X + 3.75} y={Y + 6.2} seated shirt={SHIRTS[6]} look={2} />
          <Workstation x={X + 0.6} y={Y + 8.3} shirt={SHIRTS[1]} look={1} />
          <Plant x={X + 8.2} y={Y + 8.8} />
        </g>
      );
    case "examens":
      return (
        <g>
          {/* horloge et consigne au mur */}
          <g transform={onWallY(X + 5.2, 0.02, 2.4)}>
            <circle cx={0} cy={0} r={7} fill="#ffffff" stroke="#14203c" strokeWidth={1.2} />
            <line x1={0} y1={0} x2={0} y2={-4.5} stroke="#14203c" strokeWidth={1}>
              <ClockSpin dur={60} />
            </line>
            <line x1={0} y1={0} x2={3.4} y2={0} stroke="#e11d48" strokeWidth={0.8}>
              <ClockSpin dur={8} />
            </line>
          </g>
          <g transform={onWallY(X + 1.4, 0.02, 1.9)}>
            <rect x={0} y={0} width={46} height={12} rx={2} fill="#14203c" />
            <text x={23} y={8.4} textAnchor="middle" fontSize={6} fontWeight={700} fill="#ffffff" letterSpacing={0.8}>
              SILENCE
            </text>
          </g>
          {/* examinateur */}
          <Desk x={X + 4.2} y={Y + 1.3} w={2.2} d={0.8} colors={WOOD} />
          <Box x={X + 4.5} y={Y + 1.5} z={0.75} w={0.45} d={0.32} h={0.05} colors={WHITE} />
          {/* pupitres des candidats, deux rangées de trois */}
          {[3.6, 6.6].map((row, r) =>
            [1.6, 4.6, 7.6].map((col, c) => (
              <g key={`${row}-${col}`}>
                <Chair x={X + col + 0.25} y={Y + row - 0.6} back="y" />
                <Person x={X + col + 0.5} y={Y + row - 0.3} seated shirt={SHIRTS[(r * 3 + c + 2) % SHIRTS.length]} look={r * 3 + c} />
                <Desk x={X + col} y={Y + row} w={1} d={0.6} />
                <Box x={X + col + 0.3} y={Y + row + 0.1} z={0.75} w={0.42} d={0.3} h={0.03} colors={{ top: "#2d50f5", left: "#1f283b", right: "#1f283b" }} />
              </g>
            )),
          )}
          <Walker path={[[X + 3.6, Y + 1, 4], [X + 3.6, Y + 8.4, 1], [X + 6.6, Y + 8.4, 1], [X + 6.6, Y + 1, 3]]} shirt={SHIRTS[1]} look={4} speed={0.6} />
          <Bubble x={X + 5.1} y={Y + 6.3} z={1.6} delay={4} kind="check" color="#16a34a" />
          {/* salle fermée : vitrages avant */}
          <Partition axis="x" at={Y + D - 0.3} from={X + 0.3} to={X + W - 0.3} gap={[X + 1, X + 2.2]} h={2.2} />
          <Partition axis="y" at={X + W - 0.3} from={Y} to={Y + D - 0.3} h={2.2} />
        </g>
      );
    case "code":
      return (
        <g>
          {/* écran de projection sur le mur */}
          <polygon points={faceX(0.02, Y + 1.2, Y + 6.2, 0.7, 2.7)} fill="#1f2a44" />
          <g transform={onWallX(0.02, Y + 5.9, 2.5)}>
            <rect x={0} y={0} width={80} height={34} rx={2} fill="#2d50f5" />
            <rect x={6} y={6} width={30} height={22} rx={2} fill="#dfe7ff" />
            <polygon points="12,23 30,23 21,10" fill="#e11d48" />
            <polygon points="16,21 26,21 21,14" fill="#ffffff" />
            <rect x={42} y={7} width={32} height={4} rx={2} fill="#ffffff" />
            <rect x={42} y={15} width={26} height={4} rx={2} fill="#b9c8ff" />
            <rect x={42} y={23} width={29} height={4} rx={2} fill="#b9c8ff" />
            <Slide />
          </g>
          <Person x={X + 1.2} y={Y + 6.6} shirt={SHIRTS[0]} look={3} />
          {/* rangées de chaises tournées vers l'écran */}
          {[3.4, 5.6, 7.8, 10].map((col, c) =>
            [1.3, 2.5, 3.7, 4.9, 6.1].map((row, r) => {
              const seated = (c * 5 + r * 3) % 4 !== 0;
              return (
                <g key={`${col}-${row}`}>
                  <Box x={X + col - 0.55} y={Y + row} z={0.68} w={0.35} d={0.5} h={0.04} colors={DESK} />
                  <Chair x={X + col} y={Y + row} back="-x" colors={{ top: "#7f95f0", left: "#6178e0", right: "#4f65cc" }} />
                  {seated && <Person x={X + col + 0.15} y={Y + row + 0.25} seated shirt={SHIRTS[(c + r * 2) % SHIRTS.length]} look={c + r} />}
                </g>
              );
            }),
          )}
          <Plant x={X + 12.6} y={Y + 6.4} />
          <Bubble x={X + 7.95} y={Y + 2.75} z={1.5} delay={1} kind="check" color="#16a34a" />
          <Bubble x={X + 10.15} y={Y + 4.15} z={1.5} delay={4.5} />
        </g>
      );
    case "administratif":
      return (
        <g>
          {/* armoires à dossiers contre la cloison */}
          <Cabinet x={X + 5.6} y={Y + 0.3} w={3} d={0.6} h={1.5} colors={STONE} drawers={4} />
          <Workstation x={X + 0.8} y={Y + 2.4} shirt={SHIRTS[4]} look={0} papers />
          <Workstation x={X + 2.7} y={Y + 2.4} shirt={SHIRTS[1]} look={2} papers />
          <Cabinet x={X + 8} y={Y + 1.6} w={0.6} d={2.8} h={1.2} colors={WHITE} drawers={3} />
          <Workstation x={X + 0.8} y={Y + 5.3} shirt={SHIRTS[6]} look={1} />
          <Workstation x={X + 2.7} y={Y + 5.3} empty papers />
          {/* imprimante et piles de dossiers */}
          <Box x={X + 5.6} y={Y + 4.6} w={0.9} d={0.7} h={0.85} colors={STONE} />
          <Box x={X + 5.7} y={Y + 4.7} z={0.85} w={0.7} d={0.5} h={0.18} colors={WHITE} />
          <Rise by={-6} dur={5} offset={1}>
            <Box x={X + 5.85} y={Y + 5.25} z={0.6} w={0.4} d={0.05} h={0.22} colors={WHITE} />
          </Rise>
          <Led x={X + 6.4} y={Y + 5.3} z={0.75} />
          <Bubble x={X + 1.5} y={Y + 1.98} z={1.6} delay={3} kind="mail" />
          <Plant x={X + 8.2} y={Y + 6.4} />
        </g>
      );
    case "inscriptions":
      return (
        <g>
          {/* présentoir à brochures */}
          <Box x={X + 9.3} y={Y + 0.6} w={0.5} d={1.8} h={1.5} colors={WHITE} />
          {[0.75, 1.05, 1.35].map((z, i) => (
            <polygon key={z} points={faceX(X + 9.81, Y + 0.8, Y + 2.2, z - 0.22, z)} fill={["#2d50f5", "#16a34a", "#f59e0b"][i]} />
          ))}
          {[1.4, 5.4].map((col, i) => (
            <g key={col}>
              <Chair x={X + col + 0.45} y={Y + 1.6} back="y" />
              <Person x={X + col + 0.7} y={Y + 1.95} seated shirt={i ? SHIRTS[2] : SHIRTS[0]} look={i + 1} />
              <Desk x={X + col} y={Y + 2.4} w={1.6} d={0.8} />
              <Monitor x={X + col + 0.2} y={Y + 2.5} w={0.5} />
              <Box x={X + col + 0.95} y={Y + 2.7} z={0.75} w={0.4} d={0.3} h={0.02} colors={WHITE} />
              <Chair x={X + col + 0.15} y={Y + 3.6} back="-y" />
              <Person x={X + col + 0.4} y={Y + 3.85} seated shirt={SHIRTS[(i + 5) % SHIRTS.length]} look={i + 3} />
              <Chair x={X + col + 0.95} y={Y + 3.6} back="-y" />
              {i === 1 && <Person x={X + col + 1.2} y={Y + 3.85} seated shirt={SHIRTS[3]} look={0} />}
            </g>
          ))}
          {/* borne de préinscription */}
          <Box x={X + 8.8} y={Y + 4.6} w={0.4} d={0.4} h={1.1} colors={WHITE} />
          <Box x={X + 8.7} y={Y + 4.5} z={1.1} w={0.6} d={0.6} h={0.06} colors={BLUE} />
          <Led x={X + 9} y={Y + 5.1} z={1.2} color="#2d50f5" />
          <Walker path={[[X + 8.6, Y + 5.5, 4], [X + 8.9, Y + 3, 3]]} shirt={SHIRTS[7]} look={2} speed={0.7} />
          <Bubble x={X + 2.1} y={Y + 1.95} z={1.6} delay={0.5} kind="check" color="#16a34a" />
          <Plant x={X + 9.6} y={Y + 6.6} />
        </g>
      );
    case "communication":
      return (
        <g>
          {/* écran mural des conversations */}
          <polygon points={faceX(0.02, Y + 1, Y + 5.8, 0.8, 2.6)} fill="#ffffff" stroke="#d3daea" strokeWidth={0.8} />
          <g transform={onWallX(0.02, Y + 5.5, 2.4)}>
            <rect x={0} y={0} width={30} height={9} rx={4.5} fill="#e8edfb" className="plan-glow" style={{ animationDelay: "-1s" }} />
            <rect x={36} y={12} width={38} height={9} rx={4.5} fill="#2d50f5" className="plan-glow" style={{ animationDelay: "-2.4s" }} />
            <rect x={0} y={24} width={44} height={9} rx={4.5} fill="#e8edfb" className="plan-glow" style={{ animationDelay: "-3.6s" }} />
          </g>
          {/* casiers à courrier */}
          <Cabinet x={X + 10.4} y={Y + 0.4} w={2.6} d={0.6} h={1.6} colors={WHITE} drawers={4} />
          <Workstation x={X + 2.6} y={Y + 2.6} shirt={SHIRTS[7]} look={4} headset />
          <Workstation x={X + 4.6} y={Y + 2.6} shirt={SHIRTS[0]} look={1} headset />
          <Workstation x={X + 6.6} y={Y + 2.6} shirt={SHIRTS[5]} look={2} headset />
          <Walker path={[[X + 10.6, Y + 2.2, 3], [X + 10.6, Y + 6.6, 1], [X + 8.8, Y + 6.6, 2]]} shirt={SHIRTS[3]} look={3} speed={0.9} />
          <Bubble x={X + 3.3} y={Y + 2.18} z={1.6} delay={0} kind="mail" />
          <Bubble x={X + 5.3} y={Y + 2.18} z={1.6} delay={2.3} />
          <Bubble x={X + 7.3} y={Y + 2.18} z={1.6} delay={4.6} kind="mail" />
          <Workstation x={X + 3.6} y={Y + 5.6} shirt={SHIRTS[2]} look={0} />
          <Plant x={X + 12.6} y={Y + 6.4} />
        </g>
      );
    case "accueil":
      return (
        <g>
          <Plant x={X + 0.5} y={Y + 0.6} size={1.1} />
          {/* banque d'accueil et secrétaire */}
          <Chair x={X + 3.8} y={Y + 1.2} back="y" />
          <Person x={X + 4.05} y={Y + 1.55} seated shirt={SHIRTS[4]} look={0} />
          <Box x={X + 6.2} y={Y + 1} w={0.7} d={1.3} h={1.05} colors={WHITE} />
          <Box x={X + 2.2} y={Y + 2.3} w={4.7} d={0.7} h={1.05} colors={WHITE} />
          <polygon points={faceY(X + 2.2, X + 6.9, Y + 3, 0.2, 0.8)} fill="#2d50f5" />
          <g transform={onWallY(X + 3.55, Y + 3, 0.36)}>
            <text x={0} y={0} fontSize={10} fontWeight={800} fill="#ffffff" letterSpacing={2.5}>
              VIRAGE
            </text>
          </g>
          <Box x={X + 2.1} y={Y + 2.2} z={1.05} w={4.9} d={0.9} h={0.06} colors={WOOD} />
          <Monitor x={X + 3.8} y={Y + 2.35} z={1.11} w={0.55} />
          {/* coin d'attente */}
          <Box x={X + 0.5} y={Y + 3.8} w={0.3} d={2.6} h={0.85} colors={SOFA} />
          <Box x={X + 0.8} y={Y + 3.8} w={0.9} d={2.6} h={0.42} colors={SOFA} />
          <Person x={X + 1.3} y={Y + 4.6} seated shirt={SHIRTS[6]} look={2} />
          <Person x={X + 1.3} y={Y + 5.8} seated shirt={SHIRTS[3]} look={4} />
          <Box x={X + 2.3} y={Y + 4.4} w={0.8} d={1.4} h={0.4} colors={WOOD} />
          {/* entrée */}
          <polygon points={quad(X + 3.6, Y + D - 1.3, 2.4, 1.2, 0.03)} fill="#d7dce6" />
          <FloorLabel x={X + 3.9} y={Y + D - 0.5} text="ENTRÉE" size={6} color="#9aa5bb" />
          <Walker path={[[X + 4.4, Y + 3.7, 6], [X + 4.6, Y + 5.6, 0], [X + 4.8, Y + D - 0.4, 2]]} shirt={SHIRTS[2]} look={1} speed={0.9} />
          <Bubble x={X + 4.05} y={Y + 1.55} z={1.6} delay={1.5} />
          <Plant x={X + 8.2} y={Y + 6.6} />
        </g>
      );
    case "comptabilite":
      return (
        <g>
          <Cabinet x={X + 0.6} y={Y + 0.4} w={3.2} d={0.6} h={1.3} colors={WHITE} drawers={3} />
          {/* coffre-fort */}
          <Box x={X + 8.8} y={Y + 0.6} w={1} d={1} h={1.1} colors={INK} />
          <g transform={onWallY(X + 9.3, Y + 1.6, 0.6)}>
            <circle r={3.4} fill="#9aa3b5" />
            <circle r={1.3} fill="#2a344b" />
          </g>
          <Workstation x={X + 1.6} y={Y + 2.8} shirt={SHIRTS[5]} look={1} papers />
          <Workstation x={X + 4.2} y={Y + 2.8} shirt={SHIRTS[0]} look={3} />
          {/* terminal de paiement sur le comptoir */}
          <Box x={X + 6.6} y={Y + 4.6} w={2.6} d={0.7} h={1} colors={WHITE} />
          <Box x={X + 7.6} y={Y + 4.75} z={1} w={0.3} d={0.4} h={0.12} colors={INK} />
          <Led x={X + 7.75} y={Y + 4.95} z={1.13} delay={0.4} />
          <Bubble x={X + 7.9} y={Y + 5.9} z={1.95} delay={3.5} kind="euro" color="#16a34a" />
          <Person x={X + 7.9} y={Y + 5.9} shirt={SHIRTS[6]} look={4} />
          <Plant x={X + 9.6} y={Y + 6.6} />
        </g>
      );
  }
}

export { PARTITION };
