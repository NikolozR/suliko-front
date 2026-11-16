// Moved from Suliko Office (app.suliko.ge) by scripts/sync-office.mjs. Edit it
// here: app.suliko.ge's copy is frozen.
import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { Slot } from "radix-ui";

import { cn } from "@office/shared/lib/utils";

/**
 * Button variants, matched to the Suliko design system.
 *
 * Two details are deliberate and specific to this system (see
 * docs/01-DESIGN-SYSTEM.md §5): `active:scale-[0.97]` on press, and a 3px
 * focus ring. Do not "normalise" them back to stock shadcn.
 *
 * `brand` is the Suliko-blue primary action. Note that `default` is
 * intentionally NEUTRAL -- in this design system `--primary` is a near-black /
 * near-white neutral, and `#3b59f3` lives only in `--suliko-default-color`.
 * Use `brand` for the main action on a screen, `default` for everything else.
 */
const buttonVariants = cva(
  "inline-flex shrink-0 cursor-pointer items-center justify-center gap-2 rounded-md text-sm font-medium whitespace-nowrap outline-none transition-[transform,box-shadow,background-color,color,opacity] duration-150 active:scale-[0.97] focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 disabled:pointer-events-none disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
  {
    variants: {
      variant: {
        brand:
          "bg-suliko-default-color text-white hover:bg-suliko-default-hover-color dark:text-white",
        default: "bg-primary text-primary-foreground hover:bg-primary/90",
        destructive:
          "bg-destructive text-white hover:bg-destructive/90 focus-visible:ring-destructive/20 dark:bg-destructive/60 dark:focus-visible:ring-destructive/40",
        outline:
          "border bg-background hover:bg-accent hover:text-accent-foreground dark:border-input dark:bg-input/30 dark:hover:bg-input/50",
        secondary: "bg-secondary text-secondary-foreground hover:bg-secondary/80",
        ghost: "hover:bg-accent hover:text-accent-foreground dark:hover:bg-accent/50",
        link: "text-link underline-offset-4 hover:underline",
      },
      size: {
        // One control density for the whole workspace: the sizes come from the
        // --btn-* variables in src/app/globals.css (compact for a mouse, larger for touch),
        // the same ones Translate's buttons read.
        default: "h-(--btn-h) px-(--btn-px) py-2 has-[>svg]:px-3",
        sm: "h-(--btn-h-sm) gap-1.5 rounded-md px-(--btn-px-sm) has-[>svg]:px-2.5",
        lg: "h-(--btn-h-lg) rounded-md px-(--btn-px-lg) has-[>svg]:px-4",
        icon: "size-(--btn-icon)",
        "icon-sm": "size-(--btn-h-sm)",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

function Button({
  className,
  variant,
  size,
  asChild = false,
  ...props
}: React.ComponentProps<"button"> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean;
  }) {
  const Comp = asChild ? Slot.Root : "button";

  return (
    <Comp
      data-slot="button"
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  );
}

export { Button, buttonVariants };
