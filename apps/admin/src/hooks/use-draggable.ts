"use client";

import { useEffect, useRef, useState, type CSSProperties, type PointerEvent as ReactPointerEvent } from "react";

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

/**
 * Fenêtre déplaçable par une poignée : on la saisit et on la fait glisser,
 * un double-clic la remet à sa place. Sa poignée ne peut pas sortir de l'écran.
 * `resetKey` : la position revient au centre quand cette valeur change (réouverture).
 */
export function useDraggable<T extends HTMLElement>(resetKey?: unknown) {
  const ref = useRef<T | null>(null);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [dragging, setDragging] = useState(false);

  useEffect(() => {
    setOffset({ x: 0, y: 0 });
  }, [resetKey]);

  const onPointerDown = (event: ReactPointerEvent) => {
    if (event.button !== 0 || !ref.current) return;
    event.preventDefault();
    const handle = event.currentTarget.getBoundingClientRect();
    const start = { x: event.clientX, y: event.clientY, ox: offset.x, oy: offset.y };
    // la poignée reste toujours à l'écran : on peut donc toujours ramener la fenêtre
    const margin = 8;
    const bounds = {
      minX: start.ox - (handle.left - margin),
      maxX: start.ox + (window.innerWidth - handle.right - margin),
      minY: start.oy - (handle.top - margin),
      maxY: start.oy + (window.innerHeight - handle.bottom - margin),
    };
    const move = (e: PointerEvent) =>
      setOffset({
        x: clamp(start.ox + e.clientX - start.x, bounds.minX, bounds.maxX),
        y: clamp(start.oy + e.clientY - start.y, bounds.minY, bounds.maxY),
      });
    const up = () => {
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", up);
      document.body.style.userSelect = "";
      setDragging(false);
    };
    document.body.style.userSelect = "none";
    setDragging(true);
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", up);
  };

  const moved = offset.x !== 0 || offset.y !== 0;
  const style: CSSProperties | undefined = moved ? { transform: `translate(${offset.x}px, ${offset.y}px)` } : undefined;

  return {
    ref,
    style,
    dragging,
    handleProps: {
      onPointerDown,
      onDoubleClick: () => setOffset({ x: 0, y: 0 }),
      title: "Déplacer la fenêtre (double-clic pour la recentrer)",
      "aria-label": "Déplacer la fenêtre",
    },
  };
}
