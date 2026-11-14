import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/shared/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-[transform,box-shadow,background-color,color,opacity] duration-150 active:scale-[0.97] disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 shrink-0 [&_svg]:shrink-0 outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive cursor-pointer",
  {
    variants: {
      // The same set as Suliko Office's Button. `brand` is the Suliko blue, for
      // the ONE main action on a screen; `default` is the neutral near-black.
      variant: {
        brand:
          "bg-suliko-default-color text-white hover:bg-suliko-default-hover-color dark:text-white",
        default:
          "bg-primary text-primary-foreground shadow-xs hover:bg-primary/90",
        destructive:
          "bg-destructive text-white shadow-xs dark:focus-visible:ring-destructive/40 dark:bg-destructive/60",
        outline:
          "border bg-background shadow-xs hover:bg-accent hover:text-accent-foreground dark:bg-input/30 dark:border-input dark:hover:bg-input/50",
        secondary:
          "bg-secondary text-secondary-foreground shadow-xs hover:bg-secondary/80",
        ghost:
          "hover:bg-accent hover:text-accent-foreground dark:hover:bg-accent/50",
        link: "text-link underline-offset-4 hover:underline",
      },
      // Touch: 44 / 48 / 52px. Mouse (pointer: fine): 32 / 36 / 40px, see
      // globals.css "Control density". On touch nothing here may sit below 44px: `sm` is the app's
      // workhorse (73 call sites against 3 for `lg`), so it carries the floor
      // rather than the smallest number. Horizontal padding grows with the
      // height so the taller controls don't read as cramped.
      size: {
        default: "h-(--btn-h) px-(--btn-px) py-2 has-[>svg]:px-4",
        sm: "h-(--btn-h-sm) rounded-md gap-1.5 px-(--btn-px-sm) has-[>svg]:px-3",
        lg: "h-(--btn-h-lg) rounded-md px-(--btn-px-lg) has-[>svg]:px-5",
        icon: "size-(--btn-icon)",
        "icon-sm": "size-(--btn-h-sm)",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

function Button({
  className,
  variant,
  size,
  asChild = false,
  ...props
}: React.ComponentProps<"button"> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean
  }) {
  const Comp = asChild ? Slot : "button"

  return (
    <Comp
      data-slot="button"
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  )
}

export { Button, buttonVariants }
