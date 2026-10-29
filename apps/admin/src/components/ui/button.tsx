import { Button as ButtonPrimitive } from "@base-ui/react/button"
import { cva, type VariantProps } from "class-variance-authority"
import { Loader2 } from "lucide-react"

import { cn } from "@/lib/utils"

type LegacyButtonVariant = "primary" | "danger"
type ButtonVariant = NonNullable<VariantProps<typeof buttonVariants>["variant"]> | LegacyButtonVariant
type ButtonSize = NonNullable<VariantProps<typeof buttonVariants>["size"]> | "md"

const buttonVariants = cva(
  [
    "group/button relative inline-flex shrink-0 items-center justify-center gap-2 rounded-[11px] border border-transparent",
    "text-sm font-medium whitespace-nowrap select-none outline-none",
    "transition-[background-color,border-color,color,box-shadow,transform] duration-200 ease-out",
    "active:scale-[0.98] focus-visible:ring-4 focus-visible:ring-ring/20 focus-visible:outline-none",
    "disabled:pointer-events-none disabled:opacity-50",
    "aria-invalid:border-destructive",
    "[&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
  ].join(" "),
  {
    variants: {
      variant: {
        default:
          "bg-primary text-primary-foreground shadow-primary hover:bg-primary-strong",
        outline:
          "border-border bg-card text-foreground shadow-xs hover:border-primary/30 hover:bg-primary-soft/50 aria-expanded:bg-primary-soft/60",
        secondary:
          "bg-primary-soft text-primary-strong hover:bg-[color-mix(in_srgb,var(--primary-soft),var(--primary)_10%)] aria-expanded:bg-primary-soft",
        ghost:
          "text-muted-foreground hover:bg-secondary hover:text-foreground aria-expanded:bg-secondary aria-expanded:text-foreground",
        destructive:
          "bg-danger-soft text-danger hover:bg-[color-mix(in_srgb,var(--danger-soft),var(--danger)_12%)]",
        link: "h-auto px-0 text-primary underline-offset-4 hover:underline active:scale-100",
        inverse:
          "bg-white text-primary-strong shadow-xs hover:bg-white/90",
      },
      size: {
        default: "h-10 px-4",
        xs: "h-7 gap-1 rounded-lg px-2.5 text-xs [&_svg:not([class*='size-'])]:size-3.5",
        sm: "h-8 gap-1.5 rounded-[9px] px-3 text-[13px] [&_svg:not([class*='size-'])]:size-3.5",
        lg: "h-12 rounded-xl px-5 text-[15px]",
        icon: "size-10",
        "icon-xs": "size-7 rounded-lg [&_svg:not([class*='size-'])]:size-3.5",
        "icon-sm": "size-8 rounded-[9px]",
        "icon-lg": "size-12 rounded-xl",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

function resolveVariant(variant: ButtonVariant | undefined): VariantProps<typeof buttonVariants>["variant"] {
  if (variant === "primary") return "default"
  if (variant === "danger") return "destructive"
  return variant
}

function resolveSize(size: ButtonSize | undefined): VariantProps<typeof buttonVariants>["size"] {
  if (size === "md") return "default"
  return size
}

function Button({
  className,
  variant = "default",
  size = "default",
  loading,
  disabled,
  children,
  ...props
}: ButtonPrimitive.Props &
  Omit<VariantProps<typeof buttonVariants>, "variant" | "size"> & {
    variant?: ButtonVariant
    size?: ButtonSize
    loading?: boolean
  }) {
  return (
    <ButtonPrimitive
      data-slot="button"
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      className={cn(
        buttonVariants({
          variant: resolveVariant(variant),
          size: resolveSize(size),
          className,
        })
      )}
      {...props}
    >
      {loading && <Loader2 className="animate-spin" aria-hidden="true" />}
      {children}
    </ButtonPrimitive>
  )
}

export { Button, buttonVariants }
