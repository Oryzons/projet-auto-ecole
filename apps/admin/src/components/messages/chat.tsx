"use client";

import { AnimatePresence, motion } from "motion/react";
import { ArrowUp, MessageSquareText } from "lucide-react";
import { Fragment, useEffect, useLayoutEffect, useRef, type ReactNode } from "react";

import { EASE_OUT } from "@/components/motion/tokens";
import { Avatar } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import type { ChatMessage } from "@/hooks/use-messaging";
import { formatMessageTime, groupMessagesByDate } from "@/lib/messages";
import { cn } from "@/lib/utils";

function Bubble({
  message,
  mine,
  firstOfGroup,
  lastOfGroup,
  showAvatar,
}: {
  message: ChatMessage;
  mine: boolean;
  firstOfGroup: boolean;
  lastOfGroup: boolean;
  showAvatar: boolean;
}) {
  return (
    <motion.div
      layout="position"
      initial={{ opacity: 0, y: 10, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.32, ease: EASE_OUT }}
      className={cn("flex flex-col", mine ? "items-end" : "items-start", firstOfGroup ? "mt-4" : "mt-1")}
    >
      {firstOfGroup && !mine && (
        <span className="mb-1 pl-10 text-[11px] font-medium text-muted-foreground">
          {message.sender.firstName} {message.sender.role === "ADMIN" ? "· Auto-école" : ""}
        </span>
      )}
      <div className={cn("flex max-w-[82%] items-end gap-2 sm:max-w-[68%]", mine && "flex-row-reverse")}>
        {!mine && (
          <span className="grid w-8 shrink-0 place-items-center">
            {showAvatar && lastOfGroup ? (
              <Avatar size="sm" firstName={message.sender.firstName} lastName={message.sender.lastName} />
            ) : null}
          </span>
        )}
        <div
          className={cn(
            "px-3.5 py-2.5 text-[15px] leading-relaxed break-words whitespace-pre-wrap sm:text-sm",
            mine
              ? "rounded-[1.25rem] bg-primary text-white"
              : "rounded-[1.25rem] bg-card text-foreground ring-1 ring-black/[0.05]",
            mine && firstOfGroup && "rounded-br-md",
            mine && !firstOfGroup && !lastOfGroup && "rounded-r-md",
            mine && lastOfGroup && !firstOfGroup && "rounded-tr-md",
            !mine && firstOfGroup && "rounded-bl-md",
            !mine && !firstOfGroup && !lastOfGroup && "rounded-l-md",
            !mine && lastOfGroup && !firstOfGroup && "rounded-tl-md",
          )}
        >
          {message.content}
        </div>
      </div>
      {lastOfGroup && (
        <span className={cn("mt-1 text-[11px] text-muted-foreground tabular-nums", !mine && "pl-10")}>
          {formatMessageTime(message.createdAt)}
          {mine && message.readAt ? " · Lu" : ""}
        </span>
      )}
    </motion.div>
  );
}

export function ChatMessages({
  messages,
  currentUserId,
  loading,
  empty,
}: {
  messages: ChatMessage[];
  currentUserId?: string;
  loading?: boolean;
  empty?: ReactNode;
}) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const firstRender = useRef(true);
  const lastId = messages[messages.length - 1]?.id;

  useLayoutEffect(() => {
    const el = scrollRef.current;
    if (!el || !lastId) return;
    el.scrollTo({ top: el.scrollHeight, behavior: firstRender.current ? "auto" : "smooth" });
    firstRender.current = false;
  }, [lastId]);

  const groups = groupMessagesByDate(messages);

  return (
    <div ref={scrollRef} className="scroll-area min-h-0 flex-1 overflow-y-auto px-4 py-4 sm:px-6">
      <div className={cn("flex min-h-full flex-col", messages.length > 0 && !loading && "justify-end")}>
      {loading ? (
        <div className="space-y-4">
          <Skeleton className="h-12 w-1/2 rounded-2xl" />
          <Skeleton className="ml-auto h-10 w-2/5 rounded-2xl" />
          <Skeleton className="h-16 w-3/5 rounded-2xl" />
        </div>
      ) : messages.length === 0 ? (
        empty
      ) : (
        <AnimatePresence initial={false}>
          {groups.map((group) => (
            <Fragment key={group.label}>
              <div className="sticky top-1 z-10 my-3 flex justify-center">
                <span className="rounded-full bg-card/95 px-3 py-1 text-[11px] font-medium text-muted-foreground capitalize shadow-[0_8px_20px_-14px_rgba(10,77,104,0.6)] ring-1 ring-black/[0.04] backdrop-blur">
                  {group.label}
                </span>
              </div>
              {group.messages.map((message, index) => {
                const prev = group.messages[index - 1];
                const next = group.messages[index + 1];
                const sameAsPrev = prev?.sender.id === message.sender.id;
                const sameAsNext = next?.sender.id === message.sender.id;
                return (
                  <Bubble
                    key={message.id}
                    message={message}
                    mine={message.sender.id === currentUserId}
                    firstOfGroup={!sameAsPrev}
                    lastOfGroup={!sameAsNext}
                    showAvatar
                  />
                );
              })}
            </Fragment>
          ))}
        </AnimatePresence>
      )}
      </div>
    </div>
  );
}

export function ChatStarters({
  title,
  description,
  starters,
  onSelect,
}: {
  title: string;
  description?: string;
  starters: string[];
  onSelect: (text: string) => void;
}) {
  return (
    <div className="mx-auto flex max-w-md flex-col items-center py-8 text-center">
      <span className="grid size-12 place-items-center rounded-2xl bg-primary-soft text-primary">
        <MessageSquareText className="size-5" />
      </span>
      <p className="mt-4 text-[15px] font-semibold text-foreground">{title}</p>
      {description && <p className="mt-1 text-sm text-muted-foreground">{description}</p>}
      <div className="mt-5 flex w-full flex-col gap-2">
        {starters.map((starter, index) => (
          <motion.button
            key={starter}
            type="button"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, ease: EASE_OUT, delay: 0.05 * index }}
            onClick={() => onSelect(starter)}
            className="rounded-xl border border-border bg-card px-4 py-2.5 text-left text-sm text-foreground shadow-xs transition-[border-color,background-color,transform] duration-200 hover:-translate-y-0.5 hover:border-primary/30 hover:bg-primary-soft/40"
          >
            {starter}
          </motion.button>
        ))}
      </div>
    </div>
  );
}

export function ChatComposer({
  value,
  onChange,
  onSend,
  sending,
  error,
  placeholder = "Écrire un message…",
  disabled,
  floating = false,
}: {
  value: string;
  onChange: (value: string) => void;
  onSend: () => void;
  sending?: boolean;
  error?: string | null;
  placeholder?: string;
  disabled?: boolean;
  /** Bulle flottante sur mobile, barre classique à partir de lg. */
  floating?: boolean;
}) {
  const ref = useRef<HTMLTextAreaElement>(null);
  const canSend = value.trim().length > 0 && !sending && !disabled;

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, 160)}px`;
  }, [value]);

  return (
    <div
      className={cn(
        "shrink-0",
        floating
          ? "px-3 pt-1 pb-2 lg:border-t lg:border-border lg:bg-card lg:px-4 lg:pt-3 lg:pb-3"
          : "border-t border-border bg-card px-3 pt-3 pb-3 sm:px-4",
      )}
    >
      <AnimatePresence>
        {error && (
          <motion.p
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="mb-2 overflow-hidden rounded-lg bg-danger-soft px-3 py-2 text-xs text-danger"
          >
            {error}
          </motion.p>
        )}
      </AnimatePresence>
      <div
        className={cn(
          "flex items-end gap-2 transition-[border-color,box-shadow,background-color] duration-200",
          floating
            ? "rounded-full bg-card py-1 pr-1.5 pl-4 shadow-[0_10px_28px_-16px_rgba(10,77,104,0.5)] ring-1 ring-black/[0.05] focus-within:ring-primary/20 lg:rounded-2xl lg:border lg:border-input lg:bg-subtle lg:py-0 lg:pr-1.5 lg:pl-3.5 lg:shadow-none lg:ring-0 lg:focus-within:border-primary lg:focus-within:bg-card lg:focus-within:ring-4 lg:focus-within:ring-ring/10"
            : "rounded-2xl border border-input bg-subtle p-1.5 pl-3.5 focus-within:border-primary focus-within:bg-card focus-within:ring-4 focus-within:ring-ring/10",
        )}
      >
        <textarea
          ref={ref}
          rows={1}
          value={value}
          disabled={disabled}
          onChange={(event) => onChange(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter" && !event.shiftKey && !event.nativeEvent.isComposing) {
              event.preventDefault();
              if (canSend) onSend();
            }
          }}
          placeholder={placeholder}
          aria-label="Message"
          className={cn(
            "scroll-area max-h-40 flex-1 resize-none bg-transparent text-[15px] leading-relaxed text-foreground outline-none placeholder:text-muted-foreground/70 sm:text-sm",
            floating ? "min-h-9 py-2 lg:min-h-10 lg:py-2.5" : "min-h-10 py-2.5",
          )}
        />
        <motion.button
          type="button"
          onClick={onSend}
          disabled={!canSend}
          aria-label="Envoyer"
          whileTap={{ scale: 0.9 }}
          animate={{ scale: canSend ? 1 : 0.92, opacity: canSend ? 1 : 0.45 }}
          transition={{ type: "spring", stiffness: 500, damping: 30 }}
          className={cn(
            "grid size-10 shrink-0 place-items-center bg-primary text-white shadow-primary disabled:shadow-none",
            floating ? "rounded-full lg:rounded-xl" : "rounded-xl",
          )}
        >
          <ArrowUp className={cn("size-[18px]", sending && "animate-pulse")} strokeWidth={2.4} />
        </motion.button>
      </div>
      <p className={cn("mt-1.5 hidden px-1 text-[11px] text-muted-foreground", floating ? "lg:block" : "sm:block")}>
        Entrée pour envoyer · Maj + Entrée pour aller à la ligne
      </p>
    </div>
  );
}
