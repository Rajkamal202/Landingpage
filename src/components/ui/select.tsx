"use client";

import * as React from "react";
import * as SelectPrimitive from "@radix-ui/react-select";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/cn";
import { Icon } from "@/components/icon";
import { IconCheck, IconChevronDown, IconChevronUp, IconChevronsUpDown } from "@/components/icons";
import { menuItem, menuLabel, menuSeparator, popSurface } from "./surface";
import { useFieldControl } from "./field";

const trigger = cva(
  [
    "inline-flex w-full items-center justify-between gap-2 rounded-sm border bg-surface",
    "text-ink-950 transition-ui duration-(--dur-fast)",
    "data-[placeholder]:text-ink-500",
    "disabled:cursor-not-allowed disabled:bg-ink-50 disabled:text-ink-300",
    "touch-target",
  ],
  {
    variants: {
      size: {
        sm: "h-control-sm px-2 text-body-sm",
        md: "h-control-md px-3 text-body-md",
        lg: "h-control-lg px-4 text-body-md",
      },
      invalid: { true: "border-danger", false: "border-ink-200 hover:border-ink-300" },
    },
    defaultVariants: { size: "md", invalid: false },
  },
);

export const Select = SelectPrimitive.Root;
export const SelectGroup = SelectPrimitive.Group;
export const SelectValue = SelectPrimitive.Value;

export const SelectTrigger = React.forwardRef<
  React.ComponentRef<typeof SelectPrimitive.Trigger>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.Trigger> & VariantProps<typeof trigger>
>(function SelectTrigger({ className, size, invalid, children, ...props }, ref) {
  // Composes with <Field>: without this the field's label carries an htmlFor
  // pointing at an id nothing owns, so clicking the label does nothing and the
  // trigger has no accessible description. Filters that use a bare trigger are
  // unaffected — useFieldControl returns an empty object outside a Field.
  const field = useFieldControl();
  const isInvalid = invalid ?? Boolean(field["aria-invalid"]);

  return (
    <SelectPrimitive.Trigger
      ref={ref}
      className={cn(trigger({ size, invalid: isInvalid }), className)}
      {...field}
      {...props}
    >
      <span className="flex min-w-0 items-center gap-2 truncate">{children}</span>
      <SelectPrimitive.Icon asChild>
        <Icon glyph={IconChevronsUpDown} size={16} className="text-ink-400" />
      </SelectPrimitive.Icon>
    </SelectPrimitive.Trigger>
  );
});

export const SelectContent = React.forwardRef<
  React.ComponentRef<typeof SelectPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.Content>
>(function SelectContent({ className, children, position = "popper", ...props }, ref) {
  return (
    <SelectPrimitive.Portal>
      <SelectPrimitive.Content
        ref={ref}
        position={position}
        sideOffset={6}
        className={cn(
          popSurface,
          // Radix measures the space actually available, which beats any
          // fixed max-height and keeps the list on screen near a viewport edge.
          "max-h-(--radix-select-content-available-height)",
          "origin-(--radix-select-content-transform-origin)",
          position === "popper" && "w-full min-w-(--radix-select-trigger-width)",
          className,
        )}
        {...props}
      >
        <SelectPrimitive.ScrollUpButton className="flex h-6 items-center justify-center text-ink-500">
          <Icon glyph={IconChevronUp} size={16} />
        </SelectPrimitive.ScrollUpButton>
        <SelectPrimitive.Viewport className="p-0">{children}</SelectPrimitive.Viewport>
        <SelectPrimitive.ScrollDownButton className="flex h-6 items-center justify-center text-ink-500">
          <Icon glyph={IconChevronDown} size={16} />
        </SelectPrimitive.ScrollDownButton>
      </SelectPrimitive.Content>
    </SelectPrimitive.Portal>
  );
});

export const SelectItem = React.forwardRef<
  React.ComponentRef<typeof SelectPrimitive.Item>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.Item> & { hint?: React.ReactNode }
>(function SelectItem({ className, children, hint, ...props }, ref) {
  return (
    <SelectPrimitive.Item ref={ref} className={cn(menuItem, "pr-8", className)} {...props}>
      <SelectPrimitive.ItemText>{children}</SelectPrimitive.ItemText>
      {hint ? <span className="text-body-sm ml-auto text-ink-500">{hint}</span> : null}
      <SelectPrimitive.ItemIndicator className="absolute right-2 flex items-center">
        <Icon glyph={IconCheck} size={16} className="text-brand-500" />
      </SelectPrimitive.ItemIndicator>
    </SelectPrimitive.Item>
  );
});

export const SelectLabel = React.forwardRef<
  React.ComponentRef<typeof SelectPrimitive.Label>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.Label>
>(function SelectLabel({ className, ...props }, ref) {
  return <SelectPrimitive.Label ref={ref} className={cn(menuLabel, className)} {...props} />;
});

export const SelectSeparator = React.forwardRef<
  React.ComponentRef<typeof SelectPrimitive.Separator>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.Separator>
>(function SelectSeparator({ className, ...props }, ref) {
  return <SelectPrimitive.Separator ref={ref} className={cn(menuSeparator, className)} {...props} />;
});
