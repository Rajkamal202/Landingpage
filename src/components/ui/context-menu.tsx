"use client";

import * as React from "react";
import * as ContextMenuPrimitive from "@radix-ui/react-context-menu";
import { cn } from "@/lib/cn";
import { Icon } from "@/components/icon";
import type { IconDef } from "@/components/icons";
import { menuLabel, menuItem, menuSeparator, popSurface } from "./surface";

export const ContextMenu = ContextMenuPrimitive.Root;
export const ContextMenuTrigger = ContextMenuPrimitive.Trigger;
export const ContextMenuGroup = ContextMenuPrimitive.Group;

export const ContextMenuContent = React.forwardRef<
  React.ComponentRef<typeof ContextMenuPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof ContextMenuPrimitive.Content>
>(function ContextMenuContent({ className, ...props }, ref) {
  return (
    <ContextMenuPrimitive.Portal>
      <ContextMenuPrimitive.Content
        ref={ref}
        className={cn(
          popSurface,
          "min-w-panel origin-(--radix-context-menu-content-transform-origin)",
          className,
        )}
        {...props}
      />
    </ContextMenuPrimitive.Portal>
  );
});

export const ContextMenuItem = React.forwardRef<
  React.ComponentRef<typeof ContextMenuPrimitive.Item>,
  React.ComponentPropsWithoutRef<typeof ContextMenuPrimitive.Item> & {
    glyph?: IconDef;
    shortcut?: string;
    tone?: "default" | "danger";
  }
>(function ContextMenuItem(
  { className, glyph, shortcut, tone = "default", children, ...props },
  ref,
) {
  return (
    <ContextMenuPrimitive.Item
      ref={ref}
      className={cn(
        menuItem,
        tone === "danger" &&
          "text-danger data-[highlighted]:bg-danger data-[highlighted]:text-white",
        className,
      )}
      {...props}
    >
      {glyph ? <Icon glyph={glyph} size={16} /> : null}
      <span className="flex-1 truncate">{children}</span>
      {shortcut ? <span className="mono-sm text-ink-500">{shortcut}</span> : null}
    </ContextMenuPrimitive.Item>
  );
});

export const ContextMenuLabel = React.forwardRef<
  React.ComponentRef<typeof ContextMenuPrimitive.Label>,
  React.ComponentPropsWithoutRef<typeof ContextMenuPrimitive.Label>
>(function ContextMenuLabel({ className, ...props }, ref) {
  return <ContextMenuPrimitive.Label ref={ref} className={cn(menuLabel, className)} {...props} />;
});

export const ContextMenuSeparator = React.forwardRef<
  React.ComponentRef<typeof ContextMenuPrimitive.Separator>,
  React.ComponentPropsWithoutRef<typeof ContextMenuPrimitive.Separator>
>(function ContextMenuSeparator({ className, ...props }, ref) {
  return (
    <ContextMenuPrimitive.Separator ref={ref} className={cn(menuSeparator, className)} {...props} />
  );
});
