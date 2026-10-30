"use client";

import { animate } from "motion/react";
import { Maximize2, Minus, Plus, ScanSearch } from "lucide-react";
import {
  forwardRef,
  memo,
  useCallback,
  useEffect,
  useImperativeHandle,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import type { PlanZone, ZoneId } from "@/lib/plan-types";
import { cn } from "@/lib/utils";

import { EASE_OUT } from "@/components/motion/tokens";
import { PlanMotion } from "./furniture";
import {
  AisleLife,
  DRAW_ORDER,
  Ground,
  ROOMS,
  RoomFloor,
  ZoneArt,
  roomOutline,
  sceneBounds,
  zoneAnchor,
  zoneCenter,
} from "./scene";
import { TONE_HEX } from "./tones";

// le décor ne dépend que de la zone : il n'est pas redessiné quand la caméra bouge ou au survol
const GroundLayer = memo(Ground);
const RoomFloorLayer = memo(RoomFloor);
const ZoneArtLayer = memo(ZoneArt);
const AisleLayer = memo(AisleLife);

type Camera = { cx: number; cy: number; zoom: number };

const MIN_ZOOM = 0.8;
const MAX_ZOOM = 3;
const FOCUS_ZOOM = 1.7;
const BOUNDS = sceneBounds();
const HOME: Camera = {
  cx: BOUNDS.x + BOUNDS.w / 2,
  cy: BOUNDS.y + BOUNDS.h / 2,
  zoom: 1,
};

export type IsoPlanHandle = {
  focus: (id: ZoneId | null) => void;
  reset: () => void;
};

/**
 * Plan isométrique de l'auto-école : zones cliquables, badges de statut,
 * zoom (molette, pincement, boutons), déplacement par glisser et recentrage.
 */
export const IsoPlan = forwardRef<
  IsoPlanHandle,
  {
    zones: PlanZone[] | undefined;
    selected: ZoneId | null;
    onSelect: (id: ZoneId | null) => void;
    /** Largeur masquée à droite par le panneau (px), pour centrer la zone dans la partie visible */
    insetRight: number;
    /** Hauteur masquée en bas (panneau mobile) */
    insetBottom: number;
    /** Hauteur masquée en haut par l'en-tête flottant (px) */
    insetTop?: number;
    /** Zoom de la vue générale (plus serré sur téléphone, où le plan est large et peu haut) */
    homeZoom?: number;
    /** Fige les animations (plan caché par une fenêtre) pour libérer le processeur */
    paused?: boolean;
    reducedMotion: boolean;
  }
>(function IsoPlan(
  {
    zones,
    selected,
    onSelect,
    insetRight,
    insetTop = 0,
    insetBottom,
    homeZoom = 1, reducedMotion, paused = false },
  ref,
) {
  const containerRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    const svg = svgRef.current;
    if (!svg) return;
    if (paused) svg.pauseAnimations();
    else svg.unpauseAnimations();
  }, [paused]);
  const [size, setSize] = useState({ w: 0, h: 0 });
  const home = useMemo(() => ({ ...HOME, zoom: homeZoom }), [homeZoom]);
  const [cam, setCam] = useState<Camera>(home);
  const camRef = useRef(cam);
  camRef.current = cam;
  const [hovered, setHovered] = useState<ZoneId | null>(null);
  const [focused, setFocused] = useState<ZoneId | null>(null);
  const [dragging, setDragging] = useState(false);
  const stopAnim = useRef<(() => void) | null>(null);
  const stopWheelRef = useRef<(() => void) | null>(null);

  const byId = useMemo(
    () => new Map((zones ?? []).map((z) => [z.id, z])),
    [zones],
  );

  // mesure avant la première image : le plan apparaît directement à sa taille, sans saut
  useLayoutEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    setSize({ w: el.clientWidth, h: el.clientHeight });
    const observer = new ResizeObserver(([entry]) =>
      setSize({ w: entry!.contentRect.width, h: entry!.contentRect.height }),
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  // pixels écran par pixel du plan, à zoom 1 (le plan tient en entier)
  // le centre de la caméra tombe au milieu de la partie libre, au-dessus des barres du bas
  const fit =
    size.w && size.h
      ? Math.min(
          size.w / BOUNDS.w,
          Math.max(size.h - insetTop - insetBottom, 120) / BOUNDS.h,
        )
      : 1;
  const scale = fit * cam.zoom;
  const viewBox = size.w
    ? `${(cam.cx - size.w / 2 / scale).toFixed(1)} ${(cam.cy - (insetTop + (size.h - insetTop - insetBottom) / 2) / scale).toFixed(1)} ${(size.w / scale).toFixed(1)} ${(size.h / scale).toFixed(1)}`
    : `${BOUNDS.x} ${BOUNDS.y} ${BOUNDS.w} ${BOUNDS.h}`;

  const clamp = useCallback((c: Camera): Camera => {
    const zoom = Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, c.zoom));
    const mx = BOUNDS.w * 0.45;
    const my = BOUNDS.h * 0.45;
    return {
      zoom,
      cx: Math.min(HOME.cx + mx, Math.max(HOME.cx - mx, c.cx)),
      cy: Math.min(HOME.cy + my, Math.max(HOME.cy - my, c.cy)),
    };
  }, []);

  const flyTo = useCallback(
    (target: Camera) => {
      stopAnim.current?.();
      stopWheelRef.current?.();
      const from = camRef.current;
      const to = clamp(target);
      if (reducedMotion) {
        setCam(to);
        return;
      }
      const controls = animate(0, 1, {
        duration: 0.55,
        ease: EASE_OUT,
        onUpdate: (p) =>
          setCam({
            cx: from.cx + (to.cx - from.cx) * p,
            cy: from.cy + (to.cy - from.cy) * p,
            zoom: from.zoom + (to.zoom - from.zoom) * p,
          }),
      });
      stopAnim.current = () => controls.stop();
    },
    [clamp, reducedMotion],
  );

  const focus = useCallback(
    (id: ZoneId | null) => {
      if (!id) return flyTo(home);
      const [x, y] = zoneCenter(id);
      const zoom = Math.max(camRef.current.zoom, FOCUS_ZOOM);
      const s = fit * zoom;
      // décale le centre pour que la zone tombe au milieu de la partie visible
      flyTo({ cx: x + insetRight / 2 / s, cy: y, zoom });
    },
    [fit, flyTo, insetRight, home],
  );

  useImperativeHandle(ref, () => ({ focus, reset: () => flyTo(home) }), [
    focus,
    flyTo,
    home,
  ]);

  useEffect(() => {
    if (!selected) setCam(home);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [home]);

  // recentre sur la zone choisie (clic, liste des zones ou lien)
  useEffect(() => {
    if (selected && size.w) focus(selected);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selected, size.w, insetRight, insetTop, insetBottom]);

  /* ---------- molette : zoom autour du curseur ---------- */
  // La molette fixe un zoom cible ; la caméra le rejoint en douceur à chaque image,
  // en gardant sous le curseur le point visé. Les crans successifs s'additionnent.
  const wheelZoom = useRef<{ target: number; px: number; py: number; wx: number; wy: number; frame: number; last: number } | null>(null);
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const stopWheel = () => {
      if (wheelZoom.current) cancelAnimationFrame(wheelZoom.current.frame);
      wheelZoom.current = null;
    };
    const step = (time: number) => {
      const w = wheelZoom.current;
      if (!w) return;
      const dt = Math.min(64, time - w.last);
      w.last = time;
      const c = camRef.current;
      // lissage exponentiel : ~90 % du chemin en 200 ms, quelle que soit la fréquence d'affichage
      const k = 1 - Math.exp(-dt / 90);
      const done = Math.abs(w.target - c.zoom) < 0.0015;
      const zoom = done ? w.target : c.zoom + (w.target - c.zoom) * k;
      const ns = fit * zoom;
      setCam(clamp({ zoom, cx: w.wx - w.px / ns, cy: w.wy - w.py / ns }));
      if (done) wheelZoom.current = null;
      else w.frame = requestAnimationFrame(step);
    };
    const onWheel = (event: WheelEvent) => {
      event.preventDefault();
      stopAnim.current?.();
      const rect = el.getBoundingClientRect();
      const c = camRef.current;
      const s = fit * c.zoom;
      const px = event.clientX - rect.left - rect.width / 2;
      const py =
        event.clientY -
        rect.top -
        insetTop -
        (rect.height - insetTop - insetBottom) / 2;
      // pavé tactile : deux doigts = déplacement, pincement (ctrl) = zoom
      if (
        !event.ctrlKey &&
        Math.abs(event.deltaX) > Math.abs(event.deltaY) * 0.5 &&
        event.deltaMode === 0 &&
        Math.abs(event.deltaY) < 40
      ) {
        stopWheel();
        setCam(
          clamp({
            ...c,
            cx: c.cx + event.deltaX / s,
            cy: c.cy + event.deltaY / s,
          }),
        );
        return;
      }
      if (reducedMotion) stopWheel();
      // un cran de souris (≈ 100 px, ou 3 lignes) = 12 % de zoom ; le pincement reste proportionnel
      const delta = event.deltaMode === 1 ? event.deltaY * 33 : event.deltaMode === 2 ? event.deltaY * 100 : event.deltaY;
      const factor = event.ctrlKey ? Math.exp(-delta * 0.01) : Math.exp(-Math.max(-150, Math.min(150, delta)) * 0.0012);
      const from = wheelZoom.current?.target ?? c.zoom;
      const target = Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, from * factor));
      const wx = c.cx + px / s;
      const wy = c.cy + py / s;
      if (reducedMotion) {
        const ns = fit * target;
        setCam(clamp({ zoom: target, cx: wx - px / ns, cy: wy - py / ns }));
        return;
      }
      const running = wheelZoom.current;
      if (running) Object.assign(running, { target, px, py, wx, wy });
      else {
        wheelZoom.current = { target, px, py, wx, wy, last: performance.now(), frame: 0 };
        wheelZoom.current.frame = requestAnimationFrame(step);
      }
    };
    stopWheelRef.current = stopWheel;
    el.addEventListener("wheel", onWheel, { passive: false });
    return () => {
      stopWheel();
      el.removeEventListener("wheel", onWheel);
    };
  }, [fit, clamp, insetTop, insetBottom, reducedMotion]);

  /* ---------- glisser et pincer ---------- */
  const pointers = useRef(new Map<number, { x: number; y: number }>());
  const moved = useRef(0);
  const pinch = useRef<{ dist: number; zoom: number } | null>(null);

  const onPointerDown = (event: React.PointerEvent) => {
    if ((event.target as HTMLElement).closest("[data-plan-control]")) return;
    stopAnim.current?.();
    stopWheelRef.current?.();
    pointers.current.set(event.pointerId, {
      x: event.clientX,
      y: event.clientY,
    });
    moved.current = 0;
    if (pointers.current.size === 2) {
      const [a, b] = [...pointers.current.values()];
      pinch.current = {
        dist: Math.hypot(a!.x - b!.x, a!.y - b!.y),
        zoom: camRef.current.zoom,
      };
    }
  };
  const onPointerMove = (event: React.PointerEvent) => {
    const prev = pointers.current.get(event.pointerId);
    if (!prev) return;
    const next = { x: event.clientX, y: event.clientY };
    pointers.current.set(event.pointerId, next);
    const c = camRef.current;
    if (pointers.current.size === 2 && pinch.current) {
      const [a, b] = [...pointers.current.values()];
      const dist = Math.hypot(a!.x - b!.x, a!.y - b!.y);
      setCam(
        clamp({ ...c, zoom: (pinch.current.zoom * dist) / pinch.current.dist }),
      );
      moved.current += 10;
      return;
    }
    const dx = next.x - prev.x;
    const dy = next.y - prev.y;
    moved.current += Math.abs(dx) + Math.abs(dy);
    if (moved.current > 6) {
      if (!dragging) {
        setDragging(true);
        // le glisser ne doit pas déclencher de clic sur une zone
        (event.currentTarget as HTMLElement).setPointerCapture(event.pointerId);
      }
      const s = fit * c.zoom;
      setCam(clamp({ ...c, cx: c.cx - dx / s, cy: c.cy - dy / s }));
    }
  };
  const endPointer = (event: React.PointerEvent) => {
    pointers.current.delete(event.pointerId);
    if (pointers.current.size < 2) pinch.current = null;
    if (pointers.current.size === 0) setDragging(false);
  };

  const zoomBy = (factor: number) =>
    flyTo({ ...camRef.current, zoom: camRef.current.zoom * factor });

  const choose = (id: ZoneId) => {
    if (moved.current > 6) return;
    onSelect(selected === id ? null : id);
  };

  const highlight = hovered ?? focused;
  // taille constante à l'écran pour les badges et les étiquettes
  const ui = 1 / scale;

  return (
    <div
      ref={containerRef}
      className={cn(
        "relative size-full touch-none overflow-hidden select-none",
        dragging ? "cursor-grabbing" : "cursor-grab",
      )}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={endPointer}
      onPointerCancel={endPointer}
      onPointerLeave={(event) => {
        if (event.pointerType === "mouse") setHovered(null);
      }}
    >
      <svg ref={svgRef} viewBox={viewBox} className={cn("block size-full", paused && "plan-paused")}
        role="group"
        aria-label="Plan de l'auto-école"
      >
        <PlanMotion.Provider value={!reducedMotion}>
          <GroundLayer />
          {DRAW_ORDER.map((id) => {
            const zone = byId.get(id);
            const isSelected = selected === id;
            const isHot = highlight === id;
            const tone = zone?.tone ?? "neutral";
            const ring =
              tone === "danger" || tone === "warning" ? TONE_HEX[tone] : null;
            return (
              <g key={id}>
                <g
                  role="button"
                  tabIndex={0}
                  aria-pressed={isSelected}
                  aria-label={
                    zone
                      ? `${zone.title} : ${zone.count} ${zone.countLabel}`
                      : id
                  }
                  className="plan-zone outline-none"
                  style={{ opacity: selected && !isSelected ? 0.55 : 1 }}
                  onClick={() => choose(id)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter" || event.key === " ") {
                      event.preventDefault();
                      onSelect(selected === id ? null : id);
                    }
                  }}
                  onPointerEnter={(event) =>
                    event.pointerType === "mouse" && !dragging && setHovered(id)
                  }
                  onPointerLeave={(event) =>
                    event.pointerType === "mouse" &&
                    setHovered((h) => (h === id ? null : h))
                  }
                  onFocus={() => setFocused(id)}
                  onBlur={() => setFocused((f) => (f === id ? null : f))}
                >
                  <g
                    className="plan-lift"
                    style={{
                      transform:
                        isHot || isSelected ? "translateY(-8px)" : "none",
                    }}
                  >
                    <RoomFloorLayer id={id} />
                    {ring && (
                      <polygon
                        points={roomOutline(id, 0.3)}
                        fill={ring}
                        fillOpacity={0.07}
                        stroke={ring}
                        strokeOpacity={0.55}
                        strokeWidth={1.2}
                        strokeDasharray={tone === "warning" ? "4 3" : undefined}
                      />
                    )}
                    {(isSelected || isHot) && (
                      <polygon
                        points={roomOutline(id, 0.1)}
                        fill="#2d50f5"
                        fillOpacity={isSelected ? 0.08 : 0.04}
                        stroke="#2d50f5"
                        strokeWidth={isSelected ? 2.2 : 1.4}
                        strokeOpacity={isSelected ? 0.9 : 0.6}
                        className={isSelected ? "plan-selected" : undefined}
                      />
                    )}
                    <ZoneArtLayer id={id} />
                  </g>
                </g>
                {ROOMS[id].col === 2 && (
                  <AisleLayer after={ROOMS[id].row as 0 | 1 | 2} />
                )}
              </g>
            );
          })}
        </PlanMotion.Provider>

        {/* badges de statut, toujours au premier plan */}
        {DRAW_ORDER.map((id) => {
          const zone = byId.get(id);
          if (!zone) return null;
          const [ax, ay] = zoneAnchor(id);
          const lifted = highlight === id || selected === id;
          return (
            <g
              key={`badge-${id}`}
              transform={`translate(${ax} ${ay - (lifted ? 5 : 0)}) scale(${ui})`}
              className="plan-badge"
              onClick={() => choose(id)}
              style={{ cursor: "pointer" }}
              aria-hidden
            >
              <ZoneBadge zone={zone} />
            </g>
          );
        })}

        {/* étiquette de la zone survolée */}
        {highlight && byId.get(highlight) && !dragging && (
          <g
            transform={`translate(${zoneAnchor(highlight)[0]} ${zoneAnchor(highlight)[1] - 5}) scale(${ui})`}
            style={{ pointerEvents: "none" }}
          >
            <ZoneTooltip zone={byId.get(highlight)!} />
          </g>
        )}
      </svg>

      {!zones && (
        <div className="pointer-events-none absolute inset-0 grid place-items-center">
          <span className="rounded-full bg-white/95 px-3 py-1.5 text-xs font-medium text-muted-foreground shadow-sm">
            Chargement des données…
          </span>
        </div>
      )}

      {/* commandes de caméra */}
      <div
        data-plan-control
        className="intro-left absolute bottom-3 left-3 flex flex-col gap-1 max-md:right-3 max-md:bottom-[4.25rem] max-md:left-auto rounded-xl border border-white/70 bg-white/95 p-1 shadow-[0_8px_24px_-12px_rgb(20_32_60/0.35)]"
      >
        <ControlButton label="Zoomer" onClick={() => zoomBy(1.35)}>
          <Plus />
        </ControlButton>
        <ControlButton label="Dézoomer" onClick={() => zoomBy(1 / 1.35)}>
          <Minus />
        </ControlButton>
        <span className="mx-1.5 h-px bg-border" />
        <ControlButton
          label={selected ? "Recentrer sur la zone" : "Recentrer"}
          onClick={() => (selected ? focus(selected) : flyTo(home))}
        >
          <ScanSearch />
        </ControlButton>
        <ControlButton
          label="Vue générale"
          onClick={() => {
            onSelect(null);
            flyTo(home);
          }}
        >
          <Maximize2 />
        </ControlButton>
      </div>
    </div>
  );
});

function ControlButton({
  label,
  onClick,
  children,
}: {
  label: string;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      onClick={onClick}
      className="grid size-9 place-items-center rounded-lg text-ink transition-colors hover:bg-primary-soft hover:text-primary focus-visible:ring-2 focus-visible:ring-primary/50 focus-visible:outline-none [&_svg]:size-4"
    >
      {children}
    </button>
  );
}

/** Pastille au-dessus d'un bâtiment : compteur coloré selon l'urgence. */
function ZoneBadge({ zone }: { zone: PlanZone }) {
  const color = TONE_HEX[zone.tone];
  const text = zone.count > 99 ? "99+" : String(zone.count);
  const w = 14 + text.length * 7.5;
  return (
    <g>
      <line x1={0} y1={0} x2={0} y2={-10} stroke={color} strokeWidth={1.5} />
      <circle r={2.4} fill={color} />
      {zone.tone === "danger" && (
        <rect
          x={-w / 2}
          y={-32}
          width={w}
          height={22}
          rx={11}
          fill={color}
          className="plan-pulse"
        />
      )}
      <rect
        x={-w / 2}
        y={-32}
        width={w}
        height={22}
        rx={11}
        fill={color}
        stroke="#ffffff"
        strokeWidth={2}
      />
      <text
        x={0}
        y={-17}
        textAnchor="middle"
        fontSize={12}
        fontWeight={700}
        fill="#ffffff"
        style={{ fontVariantNumeric: "tabular-nums" }}
      >
        {text}
      </text>
    </g>
  );
}

/** Étiquette affichée au survol ou au clavier : nom de la zone et ce qui l'attend. */
function ZoneTooltip({ zone }: { zone: PlanZone }) {
  const line = `${zone.count} ${zone.countLabel}`;
  const w = Math.max(zone.title.length * 7.4, line.length * 6.3) + 28;
  return (
    <g transform="translate(0 -42)">
      <rect
        x={-w / 2}
        y={-46}
        width={w}
        height={44}
        rx={10}
        fill="#ffffff"
        stroke="rgba(20,32,60,0.08)"
        style={{ filter: "drop-shadow(0 8px 18px rgba(20,32,60,0.18))" }}
      />
      <text
        x={0}
        y={-28}
        textAnchor="middle"
        fontSize={13}
        fontWeight={650}
        fill="#14203c"
      >
        {zone.title}
      </text>
      <text
        x={0}
        y={-12}
        textAnchor="middle"
        fontSize={11.5}
        fontWeight={500}
        fill={TONE_HEX[zone.tone === "neutral" ? "active" : zone.tone]}
      >
        {line}
      </text>
    </g>
  );
}
