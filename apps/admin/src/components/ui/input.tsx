import * as React from "react"
import { Input as InputPrimitive } from "@base-ui/react/input"
import type { LucideIcon } from "lucide-react"

import { cn } from "@/lib/utils"
import { Textarea as TextareaComponent } from "@/components/ui/textarea"

const inputClassName = [
  "h-11 w-full min-w-0 rounded-[11px] border border-input bg-card px-3.5 text-[15px] shadow-xs outline-none md:text-sm",
  "transition-[border-color,box-shadow,background-color] duration-200",
  "hover:border-[color-mix(in_srgb,var(--input),var(--primary)_25%)]",
  "focus-visible:border-primary focus-visible:ring-4 focus-visible:ring-ring/15 focus-visible:outline-none",
  "file:inline-flex file:h-7 file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground",
  "disabled:pointer-events-none disabled:cursor-not-allowed disabled:bg-secondary disabled:opacity-60",
  "aria-invalid:border-destructive aria-invalid:ring-4 aria-invalid:ring-destructive/10",
].join(" ")

function Input({ className, type, ...props }: React.ComponentProps<"input">) {
  return (
    <InputPrimitive
      type={type}
      data-slot="input"
      className={cn(inputClassName, className)}
      {...props}
    />
  )
}

function Label({
  className,
  children,
  ...props
}: React.LabelHTMLAttributes<HTMLLabelElement>) {
  return (
    <label
      className={cn("mb-1.5 block text-[13px] font-medium text-foreground", className)}
      {...props}
    >
      {children}
    </label>
  )
}

function InputWithIcon({
  icon: Icon,
  className,
  ...props
}: React.ComponentProps<"input"> & { icon: LucideIcon }) {
  return (
    <div className="group/input relative">
      <Icon className="pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-muted-foreground transition-colors group-focus-within/input:text-primary" />
      <Input className={cn("pl-10", className)} {...props} />
    </div>
  )
}

/** Champ de formulaire : libellé, contrôle, aide et message d'erreur. */
function Field({
  label,
  htmlFor,
  hint,
  error,
  className,
  children,
}: {
  label?: React.ReactNode
  htmlFor?: string
  hint?: React.ReactNode
  error?: React.ReactNode
  className?: string
  children: React.ReactNode
}) {
  return (
    <div className={cn("flex flex-col", className)}>
      {label && <Label htmlFor={htmlFor}>{label}</Label>}
      {children}
      {error ? (
        <p className="mt-1.5 text-xs font-medium text-danger" role="alert">
          {error}
        </p>
      ) : hint ? (
        <p className="mt-1.5 text-xs text-muted-foreground">{hint}</p>
      ) : null}
    </div>
  )
}

export { Input, Label, InputWithIcon, Field, TextareaComponent as Textarea, inputClassName }
