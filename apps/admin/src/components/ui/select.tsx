"use client";

import { Select as SelectPrimitive } from "@base-ui/react/select";
import { Check, ChevronDown, type LucideIcon } from "lucide-react";

import { cn } from "@/lib/utils";

export type SelectOption<T extends string | number> = {
  value: T;
  label: string;
  description?: string;
  icon?: LucideIcon;
  disabled?: boolean;
};

/**
 * Liste déroulante au style de l'application (remplace `<select>`).
 * Valeur contrôlée ; `null` affiche le `placeholder`.
 */
export function Select<T extends string | number>({
  value,
  onValueChange,
  options,
  placeholder = "Choisir…",
  id,
  icon: Icon,
  size = "md",
  disabled,
  invalid,
  className,
  popupClassName,
  "aria-label": ariaLabel,
}: {
  value: T | null;
  onValueChange: (value: T) => void;
  options: SelectOption<T>[];
  placeholder?: string;
  id?: string;
  icon?: LucideIcon;
  size?: "sm" | "md";
  disabled?: boolean;
  invalid?: boolean;
  className?: string;
  popupClassName?: string;
  "aria-label"?: string;
}) {
  const selected = options.find((option) => option.value === value);
  const LeadingIcon = selected?.icon ?? Icon;

  return (
    <SelectPrimitive.Root
      value={value}
      onValueChange={(next) => {
        if (next !== null) onValueChange(next as T);
      }}
      items={options.map((option) => ({ value: option.value, label: option.label }))}
      disabled={disabled}
    >
      <SelectPrimitive.Trigger
        id={id}
        aria-label={ariaLabel}
        aria-invalid={invalid || undefined}
        className={cn(
          "group/select relative flex w-full min-w-0 items-center gap-2 border border-input bg-card text-left text-foreground shadow-xs outline-none",
          "transition-[border-color,box-shadow,background-color] duration-200 hover:border-primary/35",
          "focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/20 data-popup-open:border-ring data-popup-open:ring-3 data-popup-open:ring-ring/20",
          "aria-invalid:border-danger aria-invalid:ring-danger/15 disabled:cursor-not-allowed disabled:opacity-60",
          size === "sm" ? "h-9 rounded-lg px-2.5 text-[13px]" : "h-10 rounded-xl px-3 text-sm",
          className,
        )}
      >
        {LeadingIcon && <LeadingIcon className={cn("shrink-0 text-primary", size === "sm" ? "size-3.5" : "size-4")} />}
        <SelectPrimitive.Value
          placeholder={placeholder}
          className="min-w-0 flex-1 truncate data-placeholder:text-muted-foreground"
        />
        <SelectPrimitive.Icon className="shrink-0 text-muted-foreground transition-transform duration-200 group-data-popup-open/select:rotate-180">
          <ChevronDown className="size-4" />
        </SelectPrimitive.Icon>
      </SelectPrimitive.Trigger>
      <SelectPrimitive.Portal>
        <SelectPrimitive.Positioner className="isolate z-[60] outline-none" sideOffset={6} alignItemWithTrigger={false}>
          <SelectPrimitive.Popup
            className={cn(
              "max-h-[min(var(--available-height),320px)] min-w-(--anchor-width) origin-(--transform-origin) overflow-y-auto rounded-xl border border-border bg-popover p-1 text-popover-foreground shadow-float outline-none",
              "transition-[opacity,transform] duration-200 ease-[cubic-bezier(0.22,1,0.36,1)] data-ending-style:scale-[0.97] data-ending-style:opacity-0 data-starting-style:-translate-y-1 data-starting-style:scale-[0.97] data-starting-style:opacity-0",
              popupClassName,
            )}
          >
            <SelectPrimitive.List>
              {options.map((option) => {
                const OptionIcon = option.icon;
                return (
                  <SelectPrimitive.Item
                    key={String(option.value)}
                    value={option.value}
                    disabled={option.disabled}
                    className={cn(
                      "relative flex cursor-default items-center gap-2.5 rounded-lg py-2 pr-8 pl-2.5 text-sm text-foreground outline-none select-none",
                      "transition-colors duration-150 data-highlighted:bg-primary-soft data-highlighted:text-primary-strong data-selected:font-medium data-disabled:opacity-45",
                    )}
                  >
                    {OptionIcon && (
                      <span className="grid size-7 shrink-0 place-items-center rounded-lg bg-primary-soft text-primary">
                        <OptionIcon className="size-3.5" />
                      </span>
                    )}
                    <span className="min-w-0 flex-1">
                      <SelectPrimitive.ItemText className="block truncate">{option.label}</SelectPrimitive.ItemText>
                      {option.description && (
                        <span className="block text-xs font-normal text-muted-foreground">{option.description}</span>
                      )}
                    </span>
                    <SelectPrimitive.ItemIndicator className="absolute right-2.5 text-primary">
                      <Check className="size-4" />
                    </SelectPrimitive.ItemIndicator>
                  </SelectPrimitive.Item>
                );
              })}
            </SelectPrimitive.List>
          </SelectPrimitive.Popup>
        </SelectPrimitive.Positioner>
      </SelectPrimitive.Portal>
    </SelectPrimitive.Root>
  );
}

/**
 * Liste déroulante à choix multiples : chaque option se coche ou se décoche,
 * la liste reste ouverte pour en choisir plusieurs.
 */
export function MultiSelect<T extends string>({
  value,
  onValueChange,
  options,
  placeholder = "Choisir…",
  icon: Icon,
  disabled,
  className,
  "aria-label": ariaLabel,
}: {
  value: T[];
  onValueChange: (value: T[]) => void;
  options: SelectOption<T>[];
  placeholder?: string;
  icon?: LucideIcon;
  disabled?: boolean;
  className?: string;
  "aria-label"?: string;
}) {
  const chosen = options.filter((option) => value.includes(option.value));
  const summary =
    chosen.length === 0 ? null : chosen.length <= 2 ? chosen.map((option) => option.label).join(", ") : `${chosen[0]!.label} et ${chosen.length - 1} autres`;

  return (
    <SelectPrimitive.Root
      multiple
      value={value}
      onValueChange={(next) => onValueChange((next ?? []) as T[])}
      items={options.map((option) => ({ value: option.value, label: option.label }))}
      disabled={disabled}
    >
      <SelectPrimitive.Trigger
        aria-label={ariaLabel}
        className={cn(
          "group/select relative flex h-10 w-full min-w-0 items-center gap-2 rounded-xl border border-input bg-card px-3 text-left text-sm text-foreground shadow-xs outline-none",
          "transition-[border-color,box-shadow,background-color] duration-200 hover:border-primary/35",
          "focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/20 data-popup-open:border-ring data-popup-open:ring-3 data-popup-open:ring-ring/20",
          "disabled:cursor-not-allowed disabled:opacity-60",
          className,
        )}
      >
        {Icon && <Icon className="size-4 shrink-0 text-primary" />}
        <span className={cn("min-w-0 flex-1 truncate", !summary && "text-muted-foreground")}>{summary ?? placeholder}</span>
        {chosen.length > 1 && (
          <span className="grid h-5 min-w-5 shrink-0 place-items-center rounded-full bg-primary-soft px-1.5 text-[11px] font-semibold text-primary-strong tabular-nums">
            {chosen.length}
          </span>
        )}
        <SelectPrimitive.Icon className="shrink-0 text-muted-foreground transition-transform duration-200 group-data-popup-open/select:rotate-180">
          <ChevronDown className="size-4" />
        </SelectPrimitive.Icon>
      </SelectPrimitive.Trigger>
      <SelectPrimitive.Portal>
        <SelectPrimitive.Positioner className="isolate z-[60] outline-none" sideOffset={6} alignItemWithTrigger={false}>
          <SelectPrimitive.Popup
            className={cn(
              "max-h-[min(var(--available-height),320px)] min-w-(--anchor-width) origin-(--transform-origin) overflow-y-auto rounded-xl border border-border bg-popover p-1 text-popover-foreground shadow-float outline-none",
              "transition-[opacity,transform] duration-200 ease-[cubic-bezier(0.22,1,0.36,1)] data-ending-style:scale-[0.97] data-ending-style:opacity-0 data-starting-style:-translate-y-1 data-starting-style:scale-[0.97] data-starting-style:opacity-0",
            )}
          >
            <SelectPrimitive.List>
              {options.map((option) => (
                <SelectPrimitive.Item
                  key={option.value}
                  value={option.value}
                  disabled={option.disabled}
                  className={cn(
                    "relative flex cursor-default items-center gap-2.5 rounded-lg py-2 pr-2.5 pl-2.5 text-sm text-foreground outline-none select-none",
                    "transition-colors duration-150 data-highlighted:bg-primary-soft data-highlighted:text-primary-strong data-selected:font-medium data-disabled:opacity-45",
                  )}
                >
                  <span
                    className={cn(
                      "grid size-4 shrink-0 place-items-center rounded-[5px] border transition-colors",
                      value.includes(option.value) ? "border-primary bg-primary text-white" : "border-input bg-card text-transparent",
                    )}
                  >
                    <Check className="size-3" strokeWidth={3} />
                  </span>
                  <span className="min-w-0 flex-1">
                    <SelectPrimitive.ItemText className="block truncate">{option.label}</SelectPrimitive.ItemText>
                    {option.description && <span className="block text-xs font-normal text-muted-foreground">{option.description}</span>}
                  </span>
                </SelectPrimitive.Item>
              ))}
            </SelectPrimitive.List>
          </SelectPrimitive.Popup>
        </SelectPrimitive.Positioner>
      </SelectPrimitive.Portal>
    </SelectPrimitive.Root>
  );
}
