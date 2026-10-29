import * as React from "react"

import { cn } from "@/lib/utils"

function Card({
  className,
  size = "default",
  interactive = false,
  ...props
}: React.ComponentProps<"div"> & { size?: "default" | "sm"; interactive?: boolean }) {
  return (
    <div
      data-slot="card"
      data-size={size}
      className={cn(
        "group/card relative flex flex-col gap-(--card-spacing) rounded-2xl border border-border bg-card py-(--card-spacing) text-sm text-card-foreground shadow-card",
        "[--card-spacing:--spacing(5)] data-[size=sm]:[--card-spacing:--spacing(4)] has-data-[slot=card-footer]:pb-0",
        interactive &&
          "transition-[box-shadow,border-color,transform] duration-300 ease-out hover:-translate-y-0.5 hover:border-primary/20 hover:shadow-raised",
        className
      )}
      {...props}
    />
  )
}

function CardHeader({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-header"
      className={cn(
        "grid auto-rows-min items-start gap-1 px-(--card-spacing) has-data-[slot=card-action]:grid-cols-[1fr_auto] [.border-b]:pb-(--card-spacing)",
        className
      )}
      {...props}
    />
  )
}

function CardTitle({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-title"
      className={cn(
        "font-heading text-[15px] leading-snug font-semibold tracking-[-0.01em] text-foreground",
        className
      )}
      {...props}
    />
  )
}

function CardDescription({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-description"
      className={cn("text-[13px] leading-relaxed text-muted-foreground", className)}
      {...props}
    />
  )
}

function CardAction({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-action"
      className={cn(
        "col-start-2 row-span-2 row-start-1 self-start justify-self-end",
        className
      )}
      {...props}
    />
  )
}

function CardContent({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-content"
      className={cn("px-(--card-spacing)", className)}
      {...props}
    />
  )
}

function CardFooter({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-footer"
      className={cn(
        "flex items-center gap-2 rounded-b-2xl border-t border-border bg-subtle px-(--card-spacing) py-3",
        className
      )}
      {...props}
    />
  )
}

type BadgeVariant = "default" | "success" | "warning" | "danger" | "info" | "neutral"

const badgeVariants: Record<BadgeVariant, string> = {
  default: "bg-primary-soft text-primary-strong",
  info: "bg-primary-soft text-primary-strong",
  neutral: "bg-secondary text-muted-foreground",
  success: "bg-success-soft text-success",
  warning: "bg-warning-soft text-warning",
  danger: "bg-danger-soft text-danger",
}

const dotVariants: Record<BadgeVariant, string> = {
  default: "bg-primary",
  info: "bg-primary",
  neutral: "bg-muted-foreground/60",
  success: "bg-success",
  warning: "bg-warning",
  danger: "bg-danger",
}

function Badge({
  variant = "default",
  dot = false,
  children,
  className,
}: {
  variant?: BadgeVariant
  dot?: boolean
  children: React.ReactNode
  className?: string
}) {
  return (
    <span
      data-slot="badge"
      className={cn(
        "inline-flex h-6 items-center gap-1.5 rounded-full px-2.5 text-xs font-medium whitespace-nowrap",
        badgeVariants[variant],
        className
      )}
    >
      {dot && <span className={cn("size-1.5 rounded-full", dotVariants[variant])} aria-hidden />}
      {children}
    </span>
  )
}

export {
  Card,
  CardHeader,
  CardFooter,
  CardTitle,
  CardAction,
  CardDescription,
  CardContent,
  Badge,
  type BadgeVariant,
}
