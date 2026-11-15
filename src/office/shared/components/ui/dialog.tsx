"use client"
// Moved from Suliko Office (app.suliko.ge) by scripts/sync-office.mjs. Edit it
// here: app.suliko.ge's copy is frozen.

import * as React from "react"
import { cn } from "@office/shared/lib/utils"
import { XIcon, type LucideIcon } from "lucide-react"
import { useTranslations } from "next-intl"
import { Dialog as DialogPrimitive } from "radix-ui"

import { IconChip } from "@office/shared/components/icon-chip"
import { Button } from "@office/shared/components/ui/button"
import type { Hue } from "@office/shared/lib/hues"

/**
 * A dialog is three bands: a header that says what this is, a body that
 * scrolls, a footer with the decision.
 *
 *   <DialogContent>
 *     <DialogHeader icon={Wallet} hue="green">title, description</DialogHeader>
 *     <form className={dialogFormClass}>
 *       <DialogBody>fields</DialogBody>
 *       <DialogFooter>Cancel, Save</DialogFooter>
 *     </form>
 *   </DialogContent>
 *
 * The content is never taller than the screen: the body takes the overflow,
 * so the title and the buttons stay where they are. It used to be one padded
 * grid with no height limit, and "Add a document" on a 609px laptop screen
 * ran its Save button off the bottom with no way to scroll to it.
 *
 * A confirmation has no body: header, then footer.
 */

/** For the `<form>` that holds the body and the footer: it passes the column through. */
const dialogFormClass = "flex min-h-0 flex-1 flex-col"

function Dialog({
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Root>) {
  return <DialogPrimitive.Root data-slot="dialog" {...props} />
}

function DialogTrigger({
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Trigger>) {
  return <DialogPrimitive.Trigger data-slot="dialog-trigger" {...props} />
}

function DialogPortal({
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Portal>) {
  return <DialogPrimitive.Portal data-slot="dialog-portal" {...props} />
}

function DialogClose({
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Close>) {
  return <DialogPrimitive.Close data-slot="dialog-close" {...props} />
}

function DialogOverlay({
  className,
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Overlay>) {
  return (
    <DialogPrimitive.Overlay
      data-slot="dialog-overlay"
      className={cn(
        "fixed inset-0 z-50 bg-black/50 data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:animate-in data-[state=open]:fade-in-0",
        className
      )}
      {...props}
    />
  )
}

function DialogContent({
  className,
  children,
  showCloseButton = true,
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Content> & {
  showCloseButton?: boolean
}) {
  const t = useTranslations("common")
  return (
    <DialogPortal data-slot="dialog-portal">
      <DialogOverlay />
      <DialogPrimitive.Content
        data-slot="dialog-content"
        className={cn(
          "fixed top-[50%] left-[50%] z-50 flex max-h-[calc(100dvh-2rem)] w-full max-w-[calc(100%-2rem)] translate-x-[-50%] translate-y-[-50%] flex-col overflow-hidden rounded-xl border bg-popover text-popover-foreground shadow-2xl duration-200 outline-none data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95 data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=open]:zoom-in-95 sm:max-w-lg",
          className
        )}
        {...props}
      >
        {children}
        {/* After the children, so that focus on opening lands on the first
            field (or on Cancel in a confirmation), not on the cross. */}
        {showCloseButton && (
          <DialogPrimitive.Close
            data-slot="dialog-close"
            aria-label={t("close")}
            title={t("close")}
            className="absolute top-3.5 right-3.5 inline-flex size-8 cursor-pointer items-center justify-center rounded-md text-muted-foreground outline-none transition-colors hover:bg-accent hover:text-foreground focus-visible:ring-[3px] focus-visible:ring-ring/50 disabled:pointer-events-none [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0"
          >
            <XIcon aria-hidden />
          </DialogPrimitive.Close>
        )}
      </DialogPrimitive.Content>
    </DialogPortal>
  )
}

/**
 * The title band. `icon` puts the action's own mark beside the title, in a
 * hue that says what kind of thing it is: green for money in, red for a
 * delete. The eye finds "which dialog is this" before reading a word.
 */
function DialogHeader({
  className,
  icon,
  hue = "blue",
  children,
  ...props
}: React.ComponentProps<"div"> & {
  icon?: LucideIcon
  hue?: Hue
}) {
  return (
    <div
      data-slot="dialog-header"
      // Right padding keeps a long title clear of the cross.
      className={cn(
        "flex shrink-0 items-start gap-3 px-5 pt-5 pr-14 pb-4 sm:px-6 sm:pr-14",
        className
      )}
      {...props}
    >
      {icon && <IconChip icon={icon} hue={hue} className="size-9 rounded-lg" />}
      <div className="flex min-w-0 flex-1 flex-col gap-1">{children}</div>
    </div>
  )
}

/** The part that scrolls when the dialog is taller than the screen. */
function DialogBody({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="dialog-body"
      className={cn(
        "min-h-0 flex-1 overflow-y-auto overscroll-contain border-t px-5 py-5 sm:px-6",
        className
      )}
      {...props}
    />
  )
}

function DialogFooter({
  className,
  showCloseButton = false,
  children,
  ...props
}: React.ComponentProps<"div"> & {
  showCloseButton?: boolean
}) {
  const t = useTranslations("common")
  return (
    <div
      data-slot="dialog-footer"
      className={cn(
        "flex shrink-0 flex-col-reverse gap-2 border-t bg-muted/50 px-5 py-3.5 sm:flex-row sm:flex-wrap sm:items-center sm:justify-end sm:px-6 [&>*]:max-w-full",
        className
      )}
      {...props}
    >
      {children}
      {showCloseButton && (
        <DialogPrimitive.Close asChild>
          <Button variant="outline">{t("close")}</Button>
        </DialogPrimitive.Close>
      )}
    </div>
  )
}

function DialogTitle({
  className,
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Title>) {
  return (
    <DialogPrimitive.Title
      data-slot="dialog-title"
      className={cn("text-lg leading-tight font-semibold", className)}
      {...props}
    />
  )
}

function DialogDescription({
  className,
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Description>) {
  return (
    <DialogPrimitive.Description
      data-slot="dialog-description"
      className={cn("text-sm text-pretty text-muted-foreground", className)}
      {...props}
    />
  )
}

export {
  Dialog,
  DialogBody,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogOverlay,
  DialogPortal,
  DialogTitle,
  DialogTrigger,
  dialogFormClass,
}
