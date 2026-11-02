"use client";

import { Popover as PopoverPrimitive } from "@base-ui/react/popover";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { CalendarDays, ChevronLeft, ChevronRight, X } from "lucide-react";
import { useState } from "react";

import { EASE_OUT } from "@/components/motion/tokens";
import { Select } from "@/components/ui/select";
import { cn } from "@/lib/utils";

/* Les dates circulent au format du champ natif : "AAAA-MM-JJ" (date locale). */

function parse(value: string | null | undefined) {
  if (!value || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return null;
  const [y, m, d] = value.split("-").map(Number);
  const date = new Date(y!, m! - 1, d!);
  return Number.isNaN(date.getTime()) ? null : date;
}

function toKey(date: Date) {
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${date.getFullYear()}-${m}-${d}`;
}

const MONTHS = ["janvier", "février", "mars", "avril", "mai", "juin", "juillet", "août", "septembre", "octobre", "novembre", "décembre"];
const WEEKDAYS = ["L", "M", "M", "J", "V", "S", "D"];

function capitalize(text: string) {
  return text.charAt(0).toUpperCase() + text.slice(1);
}

function formatLong(date: Date) {
  return new Intl.DateTimeFormat("fr-FR", { weekday: "short", day: "numeric", month: "long", year: "numeric" }).format(date);
}

/** 6 semaines affichées, lundi en premier. */
function monthGrid(year: number, month: number) {
  const first = new Date(year, month, 1);
  const offset = (first.getDay() + 6) % 7;
  return Array.from({ length: 42 }, (_, index) => new Date(year, month, 1 - offset + index));
}

/**
 * Sélecteur de date au style de l'application (remplace `<input type="date">`).
 * `variant="birth"` ouvre sur l'année choisie ou il y a 25 ans, avec un choix d'année rapide.
 */
export function DatePicker({
  value,
  onChange,
  id,
  min,
  max,
  placeholder = "Choisir une date",
  invalid,
  clearable,
  variant = "default",
  className,
}: {
  value: string;
  onChange: (value: string) => void;
  id?: string;
  min?: string;
  max?: string;
  placeholder?: string;
  invalid?: boolean;
  clearable?: boolean;
  variant?: "default" | "birth";
  className?: string;
}) {
  const reduce = useReducedMotion();
  const [today] = useState(() => new Date());
  // Une date de naissance ne peut pas être dans le futur.
  const upper = max ?? (variant === "birth" ? toKey(today) : undefined);
  const selected = parse(value);
  const minDate = parse(min);
  const maxDate = parse(upper);
  const initial = () => {
    const base = selected ?? (variant === "birth" ? new Date(today.getFullYear() - 25, 0, 1) : today);
    return { year: base.getFullYear(), month: base.getMonth() };
  };
  const [open, setOpen] = useState(false);
  const [view, setView] = useState(initial);
  const [direction, setDirection] = useState(0);

  const todayKey = toKey(today);
  const firstYear = minDate?.getFullYear() ?? (variant === "birth" ? today.getFullYear() - 100 : today.getFullYear() - 5);
  const lastYear = maxDate?.getFullYear() ?? today.getFullYear() + (variant === "birth" ? 0 : 5);
  const years = Array.from({ length: lastYear - firstYear + 1 }, (_, i) => lastYear - i);

  function shift(delta: number) {
    setDirection(delta);
    setView((current) => {
      const date = new Date(current.year, current.month + delta, 1);
      return { year: date.getFullYear(), month: date.getMonth() };
    });
  }

  function isDisabled(date: Date) {
    const key = toKey(date);
    return Boolean((min && key < min) || (upper && key > upper));
  }

  function pick(date: Date) {
    onChange(toKey(date));
    setOpen(false);
  }

  const days = monthGrid(view.year, view.month);
  const canPrev = !minDate || new Date(view.year, view.month, 1) > new Date(minDate.getFullYear(), minDate.getMonth(), 1);
  const canNext = !maxDate || new Date(view.year, view.month, 1) < new Date(maxDate.getFullYear(), maxDate.getMonth(), 1);

  return (
    <PopoverPrimitive.Root
      open={open}
      onOpenChange={(next) => {
        if (next) setView(initial());
        setOpen(next);
      }}
    >
      <div className={cn("relative", className)}>
        <PopoverPrimitive.Trigger
          id={id}
          aria-invalid={invalid || undefined}
          className={cn(
            "group/date flex h-10 w-full min-w-0 items-center gap-2 rounded-xl border border-input bg-card px-3 text-left text-sm text-foreground shadow-xs outline-none",
            "transition-[border-color,box-shadow] duration-200 hover:border-primary/35",
            "focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/20 data-popup-open:border-ring data-popup-open:ring-3 data-popup-open:ring-ring/20",
            "aria-invalid:border-danger aria-invalid:ring-danger/15",
            clearable && selected && "pr-9",
          )}
        >
          <CalendarDays className="size-4 shrink-0 text-primary" />
          <span className={cn("min-w-0 flex-1 truncate", !selected && "text-muted-foreground")}>
            {selected ? capitalize(formatLong(selected)) : placeholder}
          </span>
        </PopoverPrimitive.Trigger>
        {clearable && selected && (
          <button
            type="button"
            aria-label="Effacer la date"
            onClick={() => onChange("")}
            className="absolute top-1/2 right-2 grid size-6 -translate-y-1/2 place-items-center rounded-md text-muted-foreground transition-colors hover:bg-subtle hover:text-foreground"
          >
            <X className="size-3.5" />
          </button>
        )}
      </div>

      <PopoverPrimitive.Portal>
        <PopoverPrimitive.Positioner className="isolate z-[60]" side="bottom" align="start" sideOffset={6}>
          <PopoverPrimitive.Popup
            className={cn(
              "w-[304px] origin-(--transform-origin) rounded-2xl border border-border bg-popover p-3 text-popover-foreground shadow-float outline-none",
              "transition-[opacity,transform] duration-200 ease-[cubic-bezier(0.22,1,0.36,1)] data-ending-style:scale-[0.97] data-ending-style:opacity-0 data-starting-style:-translate-y-1 data-starting-style:scale-[0.97] data-starting-style:opacity-0",
            )}
          >
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                aria-label="Mois précédent"
                disabled={!canPrev}
                onClick={() => shift(-1)}
                className="grid size-8 shrink-0 place-items-center rounded-lg text-muted-foreground transition-colors hover:bg-primary-soft hover:text-primary disabled:pointer-events-none disabled:opacity-30"
              >
                <ChevronLeft className="size-4" />
              </button>
              {variant === "birth" ? (
                <div className="flex min-w-0 flex-1 gap-1.5">
                  <Select
                    size="sm"
                    aria-label="Mois"
                    value={view.month}
                    onValueChange={(month) => setView((v) => ({ ...v, month }))}
                    options={MONTHS.map((label, index) => ({ value: index, label: capitalize(label) }))}
                    className="flex-[1.3]"
                  />
                  <Select
                    size="sm"
                    aria-label="Année"
                    value={view.year}
                    onValueChange={(year) => setView((v) => ({ ...v, year }))}
                    options={years.map((year) => ({ value: year, label: String(year) }))}
                    className="flex-1"
                  />
                </div>
              ) : (
                <p className="min-w-0 flex-1 text-center text-sm font-semibold text-foreground">
                  {capitalize(MONTHS[view.month]!)} {view.year}
                </p>
              )}
              <button
                type="button"
                aria-label="Mois suivant"
                disabled={!canNext}
                onClick={() => shift(1)}
                className="grid size-8 shrink-0 place-items-center rounded-lg text-muted-foreground transition-colors hover:bg-primary-soft hover:text-primary disabled:pointer-events-none disabled:opacity-30"
              >
                <ChevronRight className="size-4" />
              </button>
            </div>

            <div className="mt-3 grid grid-cols-7 text-center text-[11px] font-semibold text-muted-foreground">
              {WEEKDAYS.map((day, index) => (
                <span key={index} className="py-1">
                  {day}
                </span>
              ))}
            </div>

            <div className="relative overflow-hidden">
              <AnimatePresence mode="popLayout" initial={false} custom={direction}>
                <motion.div
                  key={`${view.year}-${view.month}`}
                  custom={direction}
                  initial={reduce ? { opacity: 0 } : { opacity: 0, x: direction * 24 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={reduce ? { opacity: 0 } : { opacity: 0, x: direction * -24 }}
                  transition={{ duration: 0.22, ease: EASE_OUT }}
                  role="grid"
                  aria-label={`${capitalize(MONTHS[view.month]!)} ${view.year}`}
                  className="grid grid-cols-7 gap-0.5"
                >
                  {days.map((date) => {
                    const key = toKey(date);
                    const outside = date.getMonth() !== view.month;
                    const isSelected = key === value;
                    const isToday = key === todayKey;
                    const disabled = isDisabled(date);
                    return (
                      <button
                        key={key}
                        type="button"
                        role="gridcell"
                        aria-selected={isSelected}
                        aria-label={capitalize(formatLong(date))}
                        disabled={disabled}
                        onClick={() => pick(date)}
                        className={cn(
                          "relative grid h-9 place-items-center rounded-lg text-[13px] tabular-nums transition-colors duration-150",
                          isSelected
                            ? "bg-primary font-semibold text-white shadow-[0_4px_12px_-4px_var(--color-primary)]"
                            : outside
                              ? "text-muted-foreground/45 hover:bg-subtle"
                              : "text-foreground hover:bg-primary-soft hover:text-primary-strong",
                          isToday && !isSelected && "font-semibold text-primary",
                          disabled && "pointer-events-none opacity-30",
                        )}
                      >
                        {date.getDate()}
                        {isToday && !isSelected && (
                          <span className="absolute bottom-1 left-1/2 size-1 -translate-x-1/2 rounded-full bg-primary" />
                        )}
                      </button>
                    );
                  })}
                </motion.div>
              </AnimatePresence>
            </div>

            {variant !== "birth" && !isDisabled(today) && (
              <div className="mt-2 flex justify-end border-t border-border pt-2">
                <button
                  type="button"
                  onClick={() => pick(today)}
                  className="rounded-lg px-2.5 py-1.5 text-xs font-medium text-primary transition-colors hover:bg-primary-soft"
                >
                  Aujourd&apos;hui
                </button>
              </div>
            )}
          </PopoverPrimitive.Popup>
        </PopoverPrimitive.Positioner>
      </PopoverPrimitive.Portal>
    </PopoverPrimitive.Root>
  );
}

/** Créneaux horaires de 15 minutes, de 6 h à 22 h (plus la valeur actuelle si elle n'en fait pas partie). */
export function timeOptions(current?: string) {
  const slots: string[] = [];
  for (let minutes = 6 * 60; minutes <= 22 * 60; minutes += 15) {
    slots.push(`${String(Math.floor(minutes / 60)).padStart(2, "0")}:${String(minutes % 60).padStart(2, "0")}`);
  }
  if (current && /^\d{2}:\d{2}$/.test(current) && !slots.includes(current)) slots.push(current);
  return slots.sort().map((slot) => ({ value: slot, label: slot }));
}
