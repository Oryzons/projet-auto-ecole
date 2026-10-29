"use client"

import * as React from "react"
import { Dialog as DialogPrimitive } from "@base-ui/react/dialog"
import { MoveIcon, XIcon } from "lucide-react"

import { useDraggable } from "@/hooks/use-draggable"

import { cn } from "@/lib/utils"

function Dialog(props: DialogPrimitive.Root.Props) {
  return <DialogPrimitive.Root data-slot="dialog" {...props} />
}

function DialogTrigger(props: DialogPrimitive.Trigger.Props) {
  return <DialogPrimitive.Trigger data-slot="dialog-trigger" {...props} />
}

function DialogClose(props: DialogPrimitive.Close.Props) {
  return <DialogPrimitive.Close data-slot="dialog-close" {...props} />
}

function DialogContent({
  showCloseButton = true,
  position = "center",
  ...props
}: DialogPrimitive.Popup.Props & { showCloseButton?: boolean; position?: "center" | "top" }) {
  return (
    <DialogPrimitive.Portal>
      <DialogPrimitive.Backdrop
        className="fixed inset-0 z-50 bg-ink/35 transition-opacity duration-300 data-ending-style:opacity-0 data-starting-style:opacity-0"
      />
      <DialogPopup showCloseButton={showCloseButton} position={position} {...props} />
    </DialogPrimitive.Portal>
  )
}

// monté seulement quand la fenêtre est ouverte : elle se rouvre toujours au centre
function DialogPopup({
  className,
  children,
  showCloseButton,
  position,
  style,
  ...props
}: DialogPrimitive.Popup.Props & { showCloseButton: boolean; position: "center" | "top" }) {
  const drag = useDraggable<HTMLDivElement>()
  return (
    <DialogPrimitive.Popup
      ref={drag.ref}
      data-slot="dialog-content"
      className={cn(
        "fixed left-1/2 z-50 w-[calc(100%-2rem)] max-w-lg -translate-x-1/2 rounded-2xl border border-border bg-popover text-popover-foreground shadow-float outline-none",
        "transition-[opacity,translate,scale] duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] data-ending-style:scale-[0.97] data-ending-style:opacity-0 data-starting-style:translate-y-2 data-starting-style:scale-[0.97] data-starting-style:opacity-0",
        position === "center" ? "top-1/2 -translate-y-1/2 data-starting-style:-translate-y-[calc(50%-0.5rem)]" : "top-[12vh]",
        className
      )}
      style={{ ...(style as React.CSSProperties | undefined), ...drag.style }}
      {...props}
    >
      {children}
      {showCloseButton && (
        <>
          <button
            type="button"
            {...drag.handleProps}
            className="absolute top-4 right-13 grid size-8 cursor-grab touch-none place-items-center rounded-lg text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground active:cursor-grabbing max-sm:hidden"
          >
            <MoveIcon className="size-4" />
          </button>
          <DialogPrimitive.Close
            aria-label="Fermer"
            className="absolute top-4 right-4 grid size-8 place-items-center rounded-lg text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
          >
            <XIcon className="size-4" />
          </DialogPrimitive.Close>
        </>
      )}
    </DialogPrimitive.Popup>
  )
}

function DialogHeader({ className, ...props }: React.ComponentProps<"div">) {
  return <div className={cn("space-y-1.5 px-6 pt-6", className)} {...props} />
}

function DialogFooter({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      className={cn("flex flex-col-reverse gap-2 px-6 pt-2 pb-6 sm:flex-row sm:justify-end", className)}
      {...props}
    />
  )
}

function DialogTitle({ className, ...props }: DialogPrimitive.Title.Props) {
  return (
    <DialogPrimitive.Title
      className={cn("pr-8 sm:pr-16 text-[17px] font-semibold tracking-[-0.01em] text-foreground", className)}
      {...props}
    />
  )
}

function DialogDescription({ className, ...props }: DialogPrimitive.Description.Props) {
  return (
    <DialogPrimitive.Description
      className={cn("text-sm leading-relaxed text-muted-foreground", className)}
      {...props}
    />
  )
}

export { Dialog, DialogTrigger, DialogClose, DialogContent, DialogHeader, DialogFooter, DialogTitle, DialogDescription }
