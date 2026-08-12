"use client";

import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/cn";
import { Icon } from "@/components/icon";
import type { IconDef } from "@/components/icons";
import { useFieldControl } from "./field";

const inputShell = cva(
  [
    "group relative flex items-center gap-2 rounded-sm border bg-surface",
    "transition-ui duration-(--dur-fast)",
    // The ring is moved from the bare <input> to the shell so it traces the
    // control the user actually sees, icon and suffix included. The outline is
    // replaced, never removed (SPEC §11).
    "has-[input:focus-visible]:border-brand-500 has-[input:focus-visible]:ring-focus",
    "has-[input:disabled]:bg-ink-50 has-[input:disabled]:text-ink-300",
  ],
  {
    variants: {
      size: {
        sm: "h-control-sm px-2 text-body-sm",
        md: "h-control-md px-3 text-body-md",
        lg: "h-control-lg px-4 text-body-md",
      },
      invalid: {
        true: "border-danger",
        false: "border-ink-200 hover:border-ink-300",
      },
    },
    defaultVariants: { size: "md", invalid: false },
  },
);

export interface InputProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "size">,
    VariantProps<typeof inputShell> {
  iconStart?: IconDef;
  /** Trailing content — a unit, a counter, a small action. */
  suffix?: React.ReactNode;
  containerClassName?: string;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(function Input(
  { className, containerClassName, size = "md", invalid, iconStart, suffix, ...props },
  ref,
) {
  const field = useFieldControl();
  const isInvalid = invalid ?? Boolean(field["aria-invalid"]);

  return (
    <div className={cn(inputShell({ size, invalid: isInvalid }), containerClassName)}>
      {iconStart ? (
        <Icon
          glyph={iconStart}
          size={16}
          className={cn("text-ink-500", isInvalid && "text-danger")}
        />
      ) : null}
      <input
        ref={ref}
        className={cn(
          "min-w-0 flex-1 bg-transparent text-ink-950 focus-visible:outline-none",
          "placeholder:text-ink-400",
          "disabled:cursor-not-allowed disabled:text-ink-300",
          className,
        )}
        {...field}
        {...props}
      />
      {suffix ? <span className="text-body-sm shrink-0 text-ink-500">{suffix}</span> : null}
    </div>
  );
});
