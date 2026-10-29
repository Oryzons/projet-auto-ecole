"use client";

import Link from "next/link";
import { useQueryClient } from "@tanstack/react-query";
import { motion } from "motion/react";

import { Logo } from "@/components/brand/logo";
import { SPRING } from "@/components/motion/tokens";
import { useUnreadMessages } from "@/hooks/use-unread-messages";
import { isActivePath, type NavConfig, type NavItem } from "@/lib/navigation";
import { cn } from "@/lib/utils";

import { useNavPath } from "./navigation-progress";
import { prefetchPageData } from "./route-warmup";

function NavLink({ item, active, unread, onNavigate }: { item: NavItem; active: boolean; unread: number; onNavigate?: () => void }) {
  const Icon = item.icon;
  const count = item.badge === "unread" ? unread : 0;
  const queryClient = useQueryClient();
  return (
    <Link
      href={item.href}
      prefetch
      onClick={onNavigate}
      onPointerEnter={() => prefetchPageData(queryClient, item.href)}
      aria-current={active ? "page" : undefined}
      className={cn(
        "group relative flex h-10 items-center gap-3 rounded-xl px-3 text-[14px] font-medium transition-colors duration-200",
        active ? "text-primary-strong" : "text-muted-foreground hover:bg-secondary/80 hover:text-foreground",
      )}
    >
      {active && (
        <motion.span
          layoutId="sidebar-active"
          className="absolute inset-0 rounded-xl bg-primary-soft"
          transition={SPRING}
        />
      )}
      {active && (
        <motion.span
          layoutId="sidebar-active-bar"
          className="absolute top-2 bottom-2 -left-3 w-[3px] rounded-r-full bg-primary"
          transition={SPRING}
        />
      )}
      <Icon
        className={cn(
          "relative size-[18px] shrink-0 transition-transform duration-300 ease-out group-hover:scale-110",
          active ? "text-primary" : "",
        )}
        strokeWidth={active ? 2.2 : 1.9}
      />
      <span className="relative flex-1 truncate">{item.label}</span>
      {count > 0 && (
        <motion.span
          initial={{ scale: 0.6, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="relative grid h-5 min-w-5 place-items-center rounded-full bg-primary px-1.5 text-[11px] font-semibold text-white tabular-nums"
        >
          {count > 99 ? "99+" : count}
        </motion.span>
      )}
    </Link>
  );
}

export function SidebarNav({ config, onNavigate }: { config: NavConfig; onNavigate?: () => void }) {
  const pathname = useNavPath();
  const { data: unread = 0 } = useUnreadMessages();

  return (
    <nav className="flex flex-1 flex-col gap-6" aria-label="Navigation principale">
      <div className="space-y-1">
        <p className="px-3 pb-1 text-[11px] font-semibold tracking-[0.08em] text-muted-foreground/80 uppercase">
          {config.role === "CANDIDATE" ? "Mon espace" : "Gestion"}
        </p>
        {config.primary.map((item) => (
          <NavLink key={item.href} item={item} active={isActivePath(pathname, item.href)} unread={unread} onNavigate={onNavigate} />
        ))}
      </div>
      {config.secondary.length > 0 && (
        <div className="space-y-1">
          <p className="px-3 pb-1 text-[11px] font-semibold tracking-[0.08em] text-muted-foreground/80 uppercase">
            {config.role === "ADMIN" ? "Organisation" : "Compte"}
          </p>
          {config.secondary.map((item) => (
            <NavLink key={item.href} item={item} active={isActivePath(pathname, item.href)} unread={unread} onNavigate={onNavigate} />
          ))}
        </div>
      )}
    </nav>
  );
}

export function Sidebar({ config }: { config: NavConfig }) {
  return (
    <aside className="fixed inset-y-0 left-0 z-30 hidden w-[264px] flex-col border-r border-border bg-card px-4 pt-5 pb-4 lg:flex">
      <Link href={config.home} className="mb-8 flex items-center px-2" aria-label="Accueil Virage">
        <Logo />
      </Link>
      <SidebarNav config={config} />
      {config.role !== "SKIPPER" && (
      <div className="relative mt-6 overflow-hidden rounded-2xl bg-gradient-to-br from-primary to-primary-strong p-4 text-white">
        <svg className="pointer-events-none absolute -right-6 -bottom-3 h-16 w-48 text-white/15" viewBox="0 0 200 60" fill="none" aria-hidden>
          <path className="animate-wave-slow [transform-box:fill-box]" d="M0 30 C 25 15 50 45 75 30 C 100 15 125 45 150 30 C 175 15 200 45 225 30 C 250 15 275 45 300 30 C 325 15 350 45 375 30 C 400 15 425 45 450 30" stroke="currentColor" strokeWidth="8" strokeLinecap="round" />
        </svg>
        <p className="relative text-[13px] font-semibold">
          {config.role === "ADMIN" ? "Besoin d'aide ?" : "Une question ?"}
        </p>
        <p className="relative mt-1 text-xs leading-relaxed text-white/80">
          {config.role === "ADMIN"
            ? "Guides et réponses aux questions fréquentes."
            : "Écrivez à votre auto-école, elle vous répond ici."}
        </p>
        <Link
          href={config.role === "ADMIN" ? "/admin/help" : "/messages"}
          className="relative mt-3 inline-flex h-8 items-center rounded-lg bg-white px-3 text-xs font-semibold text-primary-strong transition-transform duration-200 hover:scale-[1.03] active:scale-[0.98]"
        >
          {config.role === "ADMIN" ? "Ouvrir l'aide" : "Envoyer un message"}
        </Link>
      </div>
      )}
    </aside>
  );
}
