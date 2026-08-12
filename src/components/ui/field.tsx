"use client";

import * as React from "react";
import * as LabelPrimitive from "@radix-ui/react-label";
import { cn } from "@/lib/cn";
import { Icon } from "@/components/icon";
import { IconWarning } from "@/components/icons";

export const Label = React.forwardRef<
  React.ComponentRef<typeof LabelPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof LabelPrimitive.Root> & { optional?: boolean }
>(function Label({ className, children, optional, ...props }, ref) {
  return (
    <LabelPrimitive.Root
      ref={ref}
      className={cn("text-label flex items-center gap-2 text-ink-700", className)}
      {...props}
    >
      {children}
      {optional ? <span className="text-label text-ink-500">Optional</span> : null}
    </LabelPrimitive.Root>
  );
});

interface FieldContextValue {
  id: string;
  describedBy: string | undefined;
  invalid: boolean;
}

const FieldContext = React.createContext<FieldContextValue | null>(null);

/** Wires `id`, `aria-describedby` and `aria-invalid` without call-site effort. */
export function useFieldControl() {
  const ctx = React.useContext(FieldContext);
  if (!ctx) return {};
  return {
    id: ctx.id,
    "aria-describedby": ctx.describedBy,
    "aria-invalid": ctx.invalid || undefined,
  } as const;
}

export interface FieldProps {
  label?: React.ReactNode;
  /** Static help text. Replaced by `error` when one is present. */
  hint?: React.ReactNode;
  error?: string | undefined;
  optional?: boolean;
  className?: string;
  children: React.ReactNode;
}

/**
 * SPEC §13 "no layout shift": the message row is always rendered and always
 * occupies one line of `body-sm`, whether it currently holds a hint, an error,
 * or nothing. A form that jumps when it validates is the single most common
 * tell of an unconsidered build.
 */
export function Field({ label, hint, error, optional, className, children }: FieldProps) {
  const id = React.useId();
  const messageId = `${id}-message`;
  const hasMessage = Boolean(error ?? hint);

  const ctx = React.useMemo<FieldContextValue>(
    () => ({
      id,
      describedBy: hasMessage ? messageId : undefined,
      invalid: Boolean(error),
    }),
    [id, messageId, hasMessage, error],
  );

  return (
    <FieldContext.Provider value={ctx}>
      <div className={cn("flex flex-col gap-2", className)}>
        {label ? (
          <Label htmlFor={id} optional={optional}>
            {label}
          </Label>
        ) : null}
        {children}
        <p
          id={messageId}
          // Errors are announced; static hints are not, so a screen reader user
          // is not re-read the help text on every keystroke.
          role={error ? "alert" : undefined}
          className={cn(
            "text-body-sm flex min-h-5 items-center gap-1",
            error ? "text-danger" : "text-ink-500",
          )}
        >
          {error ? <Icon glyph={IconWarning} size={16} /> : null}
          {error ?? hint}
        </p>
      </div>
    </FieldContext.Provider>
  );
}
