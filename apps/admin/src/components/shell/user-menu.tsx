"use client";

import Link from "next/link";
import { useSession } from "next-auth/react";
import { useQuery } from "@tanstack/react-query";
import { ChevronDown, LifeBuoy, LogOut, Settings, ShieldCheck, UserRound } from "lucide-react";

import { Avatar } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { signOutWithTransition } from "./sign-out";

type ProfileSummary = { profile?: { profilePhotoUrl?: string | null } };

export function useProfilePhoto() {
  const { data } = useQuery<ProfileSummary>({
    queryKey: ["profile"],
    queryFn: () => fetch("/api/profile").then((res) => (res.ok ? res.json() : {})),
    staleTime: 5 * 60_000,
  });
  return data?.profile?.profilePhotoUrl ?? null;
}

export function UserMenu({ compact = false }: { compact?: boolean }) {
  const { data: session } = useSession();
  const user = session?.user;
  const photo = useProfilePhoto();
  const isAdmin = user?.role === "ADMIN";

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        aria-label="Menu du compte"
        className={cn(
          "group flex items-center gap-2 rounded-full p-0.5 outline-none transition-colors hover:bg-secondary focus-visible:ring-4 focus-visible:ring-ring/20",
          !compact && "sm:pr-2",
        )}
      >
        <Avatar firstName={user?.firstName} lastName={user?.lastName} src={photo} size="sm" />
        {!compact && (
          <>
            <span className="hidden text-left sm:block">
              <span className="block max-w-32 truncate text-[13px] leading-tight font-medium text-foreground">
                {user ? `${user.firstName} ${user.lastName}` : " "}
              </span>
              <span className="block text-[11px] leading-tight text-muted-foreground">
                {isAdmin ? "Administrateur" : user?.role === "SKIPPER" ? "Moniteur" : "Élève"}
              </span>
            </span>
            <ChevronDown className="hidden size-3.5 text-muted-foreground transition-transform duration-200 group-aria-expanded:rotate-180 sm:block" />
          </>
        )}
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" sideOffset={8} className="w-64">
        <div className="flex items-center gap-3 px-2.5 py-2.5">
          <Avatar firstName={user?.firstName} lastName={user?.lastName} src={photo} size="md" />
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-foreground">
              {user?.firstName} {user?.lastName}
            </p>
            <p className="truncate text-xs text-muted-foreground">{user?.email}</p>
          </div>
        </div>
        <DropdownMenuSeparator className="my-1 h-px bg-border" />
        <DropdownMenuItem render={<Link href={isAdmin ? "/admin/profile" : "/profile"} />}>
          <UserRound className="text-muted-foreground" />
          Mon profil
        </DropdownMenuItem>
        <DropdownMenuItem render={<Link href={user?.role === "CANDIDATE" ? "/profile/privacy" : "/admin/privacy"} />}>
          <ShieldCheck className="text-muted-foreground" />
          Données et mentions légales
        </DropdownMenuItem>
        {isAdmin && (
          <>
            <DropdownMenuItem render={<Link href="/admin/settings" />}>
              <Settings className="text-muted-foreground" />
              Paramètres
            </DropdownMenuItem>
            <DropdownMenuItem render={<Link href="/admin/help" />}>
              <LifeBuoy className="text-muted-foreground" />
              Aide
            </DropdownMenuItem>
          </>
        )}
        <DropdownMenuSeparator className="my-1 h-px bg-border" />
        <DropdownMenuItem variant="destructive" onClick={() => void signOutWithTransition()}>
          <LogOut />
          Se déconnecter
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
