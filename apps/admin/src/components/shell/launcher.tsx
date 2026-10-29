"use client";

import { LayoutGrid } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

import { useUnreadMessages } from "@/hooks/use-unread-messages";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { adminNav } from "@/lib/navigation";
import { cn } from "@/lib/utils";

import { PLAN_PATH } from "./page-popup";

/** Menu des rubriques : chacune s'ouvre en fenêtre au-dessus du plan. */
export function Launcher({ className }: { className?: string }) {
  const [open, setOpen] = useState(false);
  const { data: unread = 0 } = useUnreadMessages();
  const items = [...adminNav.primary, ...adminNav.secondary].filter((item) => item.href !== PLAN_PATH);
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger
        render={
          <button
            type="button"
            aria-label="Toutes les rubriques"
            className={cn(
              "relative inline-flex h-9 items-center gap-2 rounded-xl border border-border bg-white/85 px-3 text-[13px] font-medium text-foreground shadow-xs backdrop-blur-md transition-colors hover:border-primary/30 hover:bg-white focus-visible:ring-2 focus-visible:ring-primary/40 focus-visible:outline-none",
              className,
            )}
          />
        }
      >
        <LayoutGrid className="size-4 text-primary" />
        <span className="max-sm:hidden">Menu</span>
        {unread > 0 && <span className="absolute -top-1 -right-1 grid min-w-4 place-items-center rounded-full bg-primary px-1 text-[10px] leading-4 font-semibold text-white ring-2 ring-white">{unread}</span>}
      </PopoverTrigger>
      <PopoverContent align="end" sideOffset={8} className="w-[min(92vw,340px)] p-2">
        <div className="grid grid-cols-3 gap-1">
          {items.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setOpen(false)}
              className="relative flex flex-col items-center gap-1.5 rounded-xl px-1 py-3 text-center text-[12px] font-medium text-foreground transition-colors hover:bg-primary-soft/60 focus-visible:ring-2 focus-visible:ring-primary/40 focus-visible:outline-none"
            >
              <span className="grid size-10 place-items-center rounded-xl bg-secondary text-primary">
                <item.icon className="size-[18px]" />
              </span>
              {item.label}
              {item.badge === "unread" && unread > 0 && (
                <span className="absolute top-2 right-4 grid min-w-4 place-items-center rounded-full bg-primary px-1 text-[10px] leading-4 font-semibold text-white">{unread}</span>
              )}
            </Link>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  );
}
