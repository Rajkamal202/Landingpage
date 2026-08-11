"use client";

import * as React from "react";
import * as DropdownPrimitive from "@radix-ui/react-dropdown-menu";
import { cn } from "@/lib/cn";
import { Icon } from "@/components/icon";
import type { IconDef } from "@/components/icons";
import { IconCheck, IconChevronRight } from "@/components/icons";
import { menuItem, menuLabel, menuSeparator, popSurface } from "./surface";

export const DropdownMenu = DropdownPrimitive.Root;
export const DropdownMenuTrigger = DropdownPrimitive.Trigger;
export const DropdownMenuGroup = DropdownPrimitive.Group;
export const DropdownMenuSub = DropdownPrimitive.Sub;
export const DropdownMenuRadioGroup = DropdownPrimitive.RadioGroup;

export const DropdownMenuContent = React.forwardRef<
  React.ComponentRef<typeof DropdownPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof DropdownPrimitive.Content>
>(function DropdownMenuContent({ className, sideOffset = 6, ...props }, ref) {
  return (
    <DropdownPrimitive.Portal>
      <DropdownPrimitive.Content
        ref={ref}
        sideOffset={sideOffset}
        className={cn(
          popSurface,
          "min-w-panel origin-(--radix-dropdown-menu-content-transform-origin)",
          className,
        )}
        {...props}
      />
    </DropdownPrimitive.Portal>
  );
});

export interface DropdownMenuItemProps
  extends React.ComponentPropsWithoutRef<typeof DropdownPrimitive.Item> {
  glyph?: IconDef;
  shortcut?: string;
  tone?: "default" | "danger";
}

export const DropdownMenuItem = React.forwardRef<
  React.ComponentRef<typeof DropdownPrimitive.Item>,
  DropdownMenuItemProps
>(function DropdownMenuItem({ className, glyph, shortcut, tone = "default", children, ...props }, ref) {
  return (
    <DropdownPrimitive.Item
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
      {shortcut ? (
        <span className="mono-sm text-ink-400 group-data-[highlighted]:text-ink-500">
          {shortcut}
        </span>
      ) : null}
    </DropdownPrimitive.Item>
  );
});

export const DropdownMenuCheckboxItem = React.forwardRef<
  React.ComponentRef<typeof DropdownPrimitive.CheckboxItem>,
  React.ComponentPropsWithoutRef<typeof DropdownPrimitive.CheckboxItem>
>(function DropdownMenuCheckboxItem({ className, children, ...props }, ref) {
  return (
    <DropdownPrimitive.CheckboxItem
      ref={ref}
      className={cn(menuItem, "pl-8", className)}
      {...props}
    >
      <DropdownPrimitive.ItemIndicator className="absolute left-2 flex items-center">
        <Icon glyph={IconCheck} size={16} className="text-brand-500" />
      </DropdownPrimitive.ItemIndicator>
      {children}
    </DropdownPrimitive.CheckboxItem>
  );
});

export const DropdownMenuRadioItem = React.forwardRef<
  React.ComponentRef<typeof DropdownPrimitive.RadioItem>,
  React.ComponentPropsWithoutRef<typeof DropdownPrimitive.RadioItem>
>(function DropdownMenuRadioItem({ className, children, ...props }, ref) {
  return (
    <DropdownPrimitive.RadioItem ref={ref} className={cn(menuItem, "pl-8", className)} {...props}>
      <DropdownPrimitive.ItemIndicator className="absolute left-2 flex items-center">
        <span className="size-2 rounded-pill bg-brand-500" />
      </DropdownPrimitive.ItemIndicator>
      {children}
    </DropdownPrimitive.RadioItem>
  );
});

export const DropdownMenuSubTrigger = React.forwardRef<
  React.ComponentRef<typeof DropdownPrimitive.SubTrigger>,
  React.ComponentPropsWithoutRef<typeof DropdownPrimitive.SubTrigger> & { glyph?: IconDef }
>(function DropdownMenuSubTrigger({ className, glyph, children, ...props }, ref) {
  return (
    <DropdownPrimitive.SubTrigger
      ref={ref}
      className={cn(menuItem, "data-[state=open]:bg-ink-100", className)}
      {...props}
    >
      {glyph ? <Icon glyph={glyph} size={16} /> : null}
      <span className="flex-1 truncate">{children}</span>
      <Icon glyph={IconChevronRight} size={16} className="text-ink-400" />
    </DropdownPrimitive.SubTrigger>
  );
});

export const DropdownMenuSubContent = React.forwardRef<
  React.ComponentRef<typeof DropdownPrimitive.SubContent>,
  React.ComponentPropsWithoutRef<typeof DropdownPrimitive.SubContent>
>(function DropdownMenuSubContent({ className, ...props }, ref) {
  return (
    <DropdownPrimitive.Portal>
      <DropdownPrimitive.SubContent
        ref={ref}
        className={cn(popSurface, "min-w-panel", className)}
        {...props}
      />
    </DropdownPrimitive.Portal>
  );
});

export const DropdownMenuLabel = React.forwardRef<
  React.ComponentRef<typeof DropdownPrimitive.Label>,
  React.ComponentPropsWithoutRef<typeof DropdownPrimitive.Label>
>(function DropdownMenuLabel({ className, ...props }, ref) {
  return <DropdownPrimitive.Label ref={ref} className={cn(menuLabel, className)} {...props} />;
});

export const DropdownMenuSeparator = React.forwardRef<
  React.ComponentRef<typeof DropdownPrimitive.Separator>,
  React.ComponentPropsWithoutRef<typeof DropdownPrimitive.Separator>
>(function DropdownMenuSeparator({ className, ...props }, ref) {
  return (
    <DropdownPrimitive.Separator ref={ref} className={cn(menuSeparator, className)} {...props} />
  );
});
