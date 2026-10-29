"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, Search } from "lucide-react";
import { useEffect, useState } from "react";

import { Logo } from "@/components/brand/logo";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";
import { findNavItem, type NavConfig } from "@/lib/navigation";
import { cn } from "@/lib/utils";
import { CommandMenu } from "./command-menu";
import { NotificationsMenu } from "./notifications-menu";
import { SidebarNav } from "./sidebar";
import { UserMenu } from "./user-menu";

export function Topbar({ config }: { config: NavConfig }) {
  const pathname = usePathname();
  const current = findNavItem(config, pathname);
  const isAdmin = config.role === "ADMIN";
  const [searchOpen, setSearchOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 4);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    if (!isAdmin) return;
    const onKey = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setSearchOpen((open) => !open);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [isAdmin]);

  return (
    <header
      className={cn(
        "sticky top-0 z-20 border-b bg-background/80 backdrop-blur-xl transition-[border-color,box-shadow] duration-300",
        scrolled ? "border-border shadow-[0_1px_0_rgb(15_40_84/0.02),0_8px_24px_-18px_rgb(15_40_84/0.25)]" : "border-transparent",
      )}
    >
      <div className="mx-auto flex h-16 max-w-[1400px] items-center gap-3 px-4 sm:px-6 lg:px-8">
        {isAdmin && (
          <Button variant="ghost" size="icon" className="-ml-2 lg:hidden" aria-label="Ouvrir le menu" onClick={() => setMenuOpen(true)}>
            <Menu className="size-5" />
          </Button>
        )}
        <Link href={config.home} className="lg:hidden" aria-label="Accueil">
          <Logo showText={!isAdmin} />
        </Link>
        <p className="hidden text-sm font-medium text-muted-foreground lg:block">
          {current?.label ?? ""}
        </p>

        <div className="ml-auto flex items-center gap-1.5 sm:gap-2">
          {isAdmin && (
            <>
              <button
                type="button"
                onClick={() => setSearchOpen(true)}
                className="hidden h-10 w-72 items-center gap-2.5 rounded-xl border border-border bg-card px-3 text-sm text-muted-foreground shadow-xs transition-[border-color,box-shadow] duration-200 hover:border-primary/30 hover:shadow-card md:flex"
              >
                <Search className="size-4" />
                <span className="flex-1 text-left">Rechercher un élève…</span>
                <kbd className="rounded-md border border-border bg-secondary px-1.5 text-[11px] font-medium">⌘K</kbd>
              </button>
              <Button variant="ghost" size="icon" className="rounded-full md:hidden" aria-label="Rechercher" onClick={() => setSearchOpen(true)}>
                <Search className="size-[18px]" />
              </Button>
              <CommandMenu open={searchOpen} onOpenChange={setSearchOpen} />
            </>
          )}
          <NotificationsMenu />
          <span className="mx-1 hidden h-6 w-px bg-border sm:block" aria-hidden />
          <UserMenu />
        </div>
      </div>

      {isAdmin && (
        <Sheet open={menuOpen} onOpenChange={setMenuOpen}>
          <SheetContent side="left" className="w-[280px] px-4 pt-5 pb-6">
            <SheetTitle className="sr-only">Menu</SheetTitle>
            <div className="mb-8 px-2">
              <Logo />
            </div>
            <SidebarNav config={config} onNavigate={() => setMenuOpen(false)} />
          </SheetContent>
        </Sheet>
      )}
    </header>
  );
}
