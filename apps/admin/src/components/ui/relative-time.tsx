"use client";

import { formatMessageTime, formatRelativeTime } from "@/lib/messages";
import { useHydrated } from "@/hooks/use-hydrated";

interface RelativeTimeProps {
  date: string;
  className?: string;
}

export function RelativeTime({ date, className }: RelativeTimeProps) {
  const hydrated = useHydrated();

  return (
    <span className={className} suppressHydrationWarning>
      {hydrated ? formatRelativeTime(date) : formatMessageTime(date)}
    </span>
  );
}
