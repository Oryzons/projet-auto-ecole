"use client";

import Link from "next/link";
import { AnimatePresence, motion, useAnimate, useMotionValue, useReducedMotion, useTransform, type PanInfo } from "motion/react";
import {
  Bell,
  CalendarDays,
  Check,
  CheckCheck,
  CheckCircle2,
  CircleAlert,
  CreditCard,
  FileText,
  MessageSquare,
  Trash2,
  X,
  type LucideIcon,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";

import { EASE_OUT, SPRING } from "@/components/motion/tokens";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { RelativeTime } from "@/components/ui/relative-time";
import { useLiveNotifications, type LiveNotification } from "@/hooks/use-live-events";
import { cn } from "@/lib/utils";

const KIND_ICONS: Record<LiveNotification["kind"], LucideIcon> = {
  message: MessageSquare,
  document: FileText,
  payment: CreditCard,
  application: CheckCircle2,
  session: CalendarDays,
};

const TONE_CLASSES: Record<LiveNotification["tone"], string> = {
  info: "bg-primary-soft text-primary",
  success: "bg-success-soft text-success",
  warning: "bg-warning-soft text-warning",
  danger: "bg-danger-soft text-danger",
};

/** Distance de glissement (px) au-delà de laquelle la notification est supprimée. */
const SWIPE_THRESHOLD = 96;

type Filter = "all" | "unread";

function NotificationItem({
  notification,
  index,
  onOpen,
  onRead,
  onDismiss,
}: {
  notification: LiveNotification;
  index: number;
  onOpen: () => void;
  onRead: () => void;
  onDismiss: () => void;
}) {
  const reduce = useReducedMotion();
  const x = useMotionValue(0);
  const dragged = useRef(false);
  // Le fond rouge apparaît à mesure que l'on glisse, dans un sens ou dans l'autre.
  const revealOpacity = useTransform(x, [-SWIPE_THRESHOLD, -24, 0, 24, SWIPE_THRESHOLD], [1, 0.35, 0, 0.35, 1]);
  const iconScale = useTransform(x, [-SWIPE_THRESHOLD, 0, SWIPE_THRESHOLD], [1.15, 0.6, 1.15]);
  const Icon = notification.tone === "danger" ? CircleAlert : KIND_ICONS[notification.kind];
  const unread = !notification.read;

  function handleDragEnd(_: unknown, info: PanInfo) {
    if (Math.abs(info.offset.x) > SWIPE_THRESHOLD || Math.abs(info.velocity.x) > 700) {
      onDismiss();
    }
    // Le clic qui suit un glissement ne doit pas ouvrir le lien.
    window.setTimeout(() => {
      dragged.current = false;
    }, 80);
  }

  const body = (
    <>
      <span className="relative mt-0.5 shrink-0">
        <span className={cn("grid size-9 place-items-center rounded-xl", TONE_CLASSES[notification.tone])}>
          <Icon className="size-[17px]" />
        </span>
        <AnimatePresence initial={false}>
          {unread && (
            <motion.span
              key="dot"
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0, opacity: 0 }}
              transition={SPRING}
              className="absolute -top-0.5 -right-0.5 size-2.5 rounded-full bg-primary ring-2 ring-card"
              aria-label="Non lue"
            />
          )}
        </AnimatePresence>
      </span>
      <span className="min-w-0 flex-1 pr-1">
        <span
          className={cn(
            "block truncate text-[13px] transition-[color,font-weight] duration-300",
            unread ? "font-semibold text-foreground" : "font-medium text-foreground/75",
          )}
        >
          {notification.title}
        </span>
        {notification.description && (
          <span className="mt-0.5 line-clamp-2 block text-xs leading-relaxed text-muted-foreground">
            {notification.description}
          </span>
        )}
        <RelativeTime
          date={new Date(notification.createdAt).toISOString()}
          className="mt-1 block text-[11px] text-muted-foreground/80"
        />
      </span>
    </>
  );

  const rowClass = "relative flex min-w-0 flex-1 gap-3 py-3 pl-3 text-left outline-none";

  return (
    <motion.li
      layout={reduce ? false : "position"}
      initial={{ opacity: 0, y: -6 }}
      animate={{ opacity: 1, y: 0 }}
      exit={
        reduce
          ? { opacity: 0 }
          : {
              opacity: 0,
              height: 0,
              marginBottom: 0,
              transition: {
                opacity: { duration: 0.18, delay: index * 0.03 },
                height: { duration: 0.26, ease: EASE_OUT, delay: 0.12 + index * 0.03 },
                marginBottom: { duration: 0.26, ease: EASE_OUT, delay: 0.12 + index * 0.03 },
              },
            }
      }
      transition={{ duration: 0.25, ease: EASE_OUT }}
      className="relative mb-1 overflow-hidden rounded-xl"
    >
      {/* Fond révélé pendant le glissement */}
      <motion.div
        aria-hidden
        style={{ opacity: revealOpacity }}
        className="absolute inset-0 flex items-center justify-between bg-danger px-5 text-white"
      >
        <motion.span style={{ scale: iconScale }}>
          <Trash2 className="size-[18px]" />
        </motion.span>
        <motion.span style={{ scale: iconScale }}>
          <Trash2 className="size-[18px]" />
        </motion.span>
      </motion.div>

      <motion.div
        drag={reduce ? false : "x"}
        dragDirectionLock
        dragConstraints={{ left: 0, right: 0 }}
        dragElastic={0.7}
        dragSnapToOrigin
        onDragStart={() => {
          dragged.current = true;
        }}
        onDragEnd={handleDragEnd}
        style={{ x }}
        exit={reduce ? undefined : { x: 48 }}
        className="group relative flex items-start rounded-xl bg-card"
      >
        {/* Teinte des notifications non lues : s'efface en douceur une fois lue. */}
        <AnimatePresence initial={false}>
          {unread && (
            <motion.span
              key="tint"
              aria-hidden
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.45, ease: EASE_OUT }}
              className="pointer-events-none absolute inset-0 rounded-xl bg-primary-soft/55"
            />
          )}
        </AnimatePresence>
        <span aria-hidden className="pointer-events-none absolute inset-0 rounded-xl bg-foreground/[0.035] opacity-0 transition-opacity duration-200 group-hover:opacity-100" />
        <AnimatePresence initial={false}>
          {unread && (
            <motion.span
              key="bar"
              aria-hidden
              initial={{ scaleY: 0 }}
              animate={{ scaleY: 1 }}
              exit={{ scaleY: 0, opacity: 0 }}
              transition={{ duration: 0.3, ease: EASE_OUT }}
              className="absolute top-3 bottom-3 left-0 w-[3px] origin-center rounded-r-full bg-primary"
            />
          )}
        </AnimatePresence>

        {notification.href ? (
          <Link
            href={notification.href}
            className={rowClass}
            draggable={false}
            onClick={(event) => {
              if (dragged.current) {
                event.preventDefault();
                return;
              }
              onOpen();
            }}
          >
            {body}
          </Link>
        ) : (
          <div className={rowClass}>{body}</div>
        )}

        <div
          className={cn(
            "relative flex shrink-0 items-center gap-0.5 self-center pr-1.5 transition-opacity duration-200",
            "[@media(hover:hover)]:opacity-0 [@media(hover:hover)]:group-focus-within:opacity-100 [@media(hover:hover)]:group-hover:opacity-100",
          )}
        >
          <AnimatePresence initial={false} mode="popLayout">
            {unread && (
              <motion.button
                key="read"
                type="button"
                aria-label="Marquer comme lue"
                title="Marquer comme lue"
                onClick={onRead}
                initial={{ scale: 0.6, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.6, opacity: 0, transition: { duration: 0.15 } }}
                whileTap={{ scale: 0.85 }}
                className="grid size-8 place-items-center rounded-lg text-muted-foreground transition-colors hover:bg-primary-soft hover:text-primary"
              >
                <Check className="size-4" />
              </motion.button>
            )}
          </AnimatePresence>
          <motion.button
            type="button"
            aria-label="Supprimer la notification"
            title="Supprimer"
            onClick={onDismiss}
            whileTap={{ scale: 0.85 }}
            className="grid size-8 place-items-center rounded-lg text-muted-foreground transition-colors hover:bg-danger-soft hover:text-danger"
          >
            <X className="size-4" />
          </motion.button>
        </div>
      </motion.div>
    </motion.li>
  );
}

export function NotificationsMenu({ className }: { className?: string }) {
  const { notifications, unreadCount, markRead, dismiss, markAllRead, clear, restore } = useLiveNotifications();
  const [open, setOpen] = useState(false);
  const [filter, setFilter] = useState<Filter>("all");
  const reduce = useReducedMotion();
  const [bellRef, animateBell] = useAnimate<HTMLSpanElement>();
  const previousUnread = useRef(unreadCount);

  // La cloche s'agite seulement à l'arrivée d'une nouvelle notification.
  useEffect(() => {
    if (unreadCount > previousUnread.current && !reduce) {
      void animateBell(bellRef.current, { rotate: [0, -14, 12, -8, 5, 0] }, { duration: 0.6, ease: EASE_OUT });
    }
    previousUnread.current = unreadCount;
  }, [unreadCount, reduce, animateBell, bellRef]);

  const visible = filter === "unread" ? notifications.filter((n) => !n.read) : notifications;

  function remove(notification: LiveNotification) {
    dismiss(notification.id);
    toast("Notification supprimée", {
      action: { label: "Annuler", onClick: () => restore([notification]) },
    });
  }

  function removeAll() {
    const snapshot = notifications;
    clear();
    toast(`${snapshot.length} notification${snapshot.length > 1 ? "s" : ""} supprimée${snapshot.length > 1 ? "s" : ""}`, {
      action: { label: "Annuler", onClick: () => restore(snapshot) },
    });
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger
        render={
          <Button
            variant="ghost"
            size="icon"
            aria-label={unreadCount > 0 ? `Notifications, ${unreadCount} non lues` : "Notifications"}
            className={cn("relative rounded-full", className)}
          />
        }
      >
        <span ref={bellRef} className="grid origin-top place-items-center">
          <Bell className="size-[18px]" />
        </span>
        <AnimatePresence>
          {unreadCount > 0 && (
            <motion.span
              key="count"
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0 }}
              transition={SPRING}
              className="absolute top-1 right-1 grid min-w-4 place-items-center rounded-full bg-primary px-1 text-[10px] leading-4 font-semibold text-white tabular-nums ring-2 ring-background"
            >
              {unreadCount > 9 ? "9+" : unreadCount}
            </motion.span>
          )}
        </AnimatePresence>
      </PopoverTrigger>
      <PopoverContent className="w-[min(94vw,392px)] overflow-hidden p-0">
        <div className="px-4 pt-4 pb-3">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <p className="text-[15px] font-semibold text-foreground">Notifications</p>
              <AnimatePresence initial={false}>
                {unreadCount > 0 && (
                  <motion.span
                    key="pill"
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.8 }}
                    className="rounded-full bg-primary-soft px-2 py-0.5 text-[11px] font-semibold text-primary tabular-nums"
                  >
                    {unreadCount} non lue{unreadCount > 1 ? "s" : ""}
                  </motion.span>
                )}
              </AnimatePresence>
            </div>
            {notifications.length > 0 && (
              <div className="flex items-center gap-0.5">
                <button
                  type="button"
                  onClick={markAllRead}
                  disabled={unreadCount === 0}
                  title="Tout marquer comme lu"
                  aria-label="Tout marquer comme lu"
                  className="grid size-8 place-items-center rounded-lg text-muted-foreground transition-colors hover:bg-primary-soft hover:text-primary disabled:pointer-events-none disabled:opacity-35"
                >
                  <CheckCheck className="size-[17px]" />
                </button>
                <button
                  type="button"
                  onClick={removeAll}
                  title="Tout effacer"
                  aria-label="Tout effacer"
                  className="grid size-8 place-items-center rounded-lg text-muted-foreground transition-colors hover:bg-danger-soft hover:text-danger"
                >
                  <Trash2 className="size-4" />
                </button>
              </div>
            )}
          </div>

          {notifications.length > 0 && (
            <div role="tablist" aria-label="Filtrer" className="mt-3 inline-flex rounded-lg bg-secondary p-0.5">
              {(
                [
                  { value: "all", label: "Toutes" },
                  { value: "unread", label: "Non lues" },
                ] as const
              ).map((tab) => (
                <button
                  key={tab.value}
                  type="button"
                  role="tab"
                  aria-selected={filter === tab.value}
                  onClick={() => setFilter(tab.value)}
                  className={cn(
                    "relative h-7 rounded-md px-3 text-xs font-medium transition-colors",
                    filter === tab.value ? "text-foreground" : "text-muted-foreground hover:text-foreground",
                  )}
                >
                  {filter === tab.value && (
                    <motion.span
                      layoutId="notifications-filter"
                      className="absolute inset-0 rounded-md bg-card shadow-sm ring-1 ring-black/[0.04]"
                      transition={SPRING}
                    />
                  )}
                  <span className="relative">{tab.label}</span>
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="border-t border-border">
          <AnimatePresence mode="wait" initial={false}>
            {visible.length === 0 ? (
              <motion.div
                key={`empty-${filter}`}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.3, ease: EASE_OUT, delay: 0.15 }}
                className="flex flex-col items-center gap-2 px-6 py-10 text-center"
              >
                <span className="grid size-12 place-items-center rounded-2xl bg-success-soft text-success">
                  <CheckCheck className="size-5" />
                </span>
                <p className="mt-1 text-sm font-semibold text-foreground">
                  {filter === "unread" && notifications.length > 0 ? "Tout est lu" : "Vous êtes à jour"}
                </p>
                <p className="max-w-[240px] text-xs leading-relaxed text-muted-foreground">
                  Les nouveaux messages, documents, paiements et cours apparaîtront ici en direct.
                </p>
              </motion.div>
            ) : (
              <motion.ul
                key="list"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="scroll-area max-h-[min(62vh,440px)] overflow-x-hidden overflow-y-auto p-1.5"
              >
                <AnimatePresence initial={false}>
                  {visible.map((notification, index) => (
                    <NotificationItem
                      key={notification.id}
                      notification={notification}
                      index={Math.min(index, 8)}
                      onOpen={() => {
                        markRead(notification.id);
                        setOpen(false);
                      }}
                      onRead={() => markRead(notification.id)}
                      onDismiss={() => remove(notification)}
                    />
                  ))}
                </AnimatePresence>
              </motion.ul>
            )}
          </AnimatePresence>
        </div>
        {visible.length > 0 && (
          <p className="border-t border-border px-4 py-2 text-center text-[11px] text-muted-foreground lg:hidden">
            Glissez une notification sur le côté pour la supprimer.
          </p>
        )}
      </PopoverContent>
    </Popover>
  );
}
