import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/cn";
import { Icon } from "@/components/icon";
import type { IconDef } from "@/components/icons";
import { Spinner } from "./spinner";

/**
 * SPEC §11: "All icon-only buttons carry `aria-label`." `label` is required by
 * the type, so an unlabelled icon button is a compile error rather than an
 * audit finding. It doubles as the tooltip string at every call site.
 */
const iconButtonVariants = cva(
  [
    "relative inline-grid shrink-0 place-items-center",
    "transition-ui duration-(--dur-instant)",
    "disabled:pointer-events-none disabled:shadow-none",
    "touch-target",
  ],
  {
    variants: {
      variant: {
        ghost: [
          "text-ink-500",
          "hover:bg-ink-100 hover:text-ink-950",
          "active:bg-ink-200",
          "disabled:bg-transparent disabled:text-ink-300",
        ],
        secondary: [
          "border border-ink-200 bg-surface text-ink-700 shadow-elev-1",
          "hover:border-ink-300 hover:bg-ink-50 hover:text-ink-950",
          "active:translate-y-px active:bg-ink-100 active:shadow-none",
          "disabled:bg-ink-50 disabled:text-ink-300",
        ],
        primary: [
          "bg-ink-950 text-white shadow-elev-1",
          "hover:bg-ink-900",
          "active:translate-y-px active:shadow-none",
          "disabled:bg-ink-200 disabled:text-ink-400",
        ],
        danger: [
          "text-ink-500",
          "hover:bg-danger hover:text-white",
          "active:bg-danger-600",
          "disabled:bg-transparent disabled:text-ink-300",
        ],
        /** Sits on top of media — needs its own contrast, not the page's. */
        overlay: [
          "glass bg-ink-950/55 text-white",
          "hover:bg-ink-950/75",
          "active:bg-ink-950/85",
          "disabled:bg-ink-950/30 disabled:text-white/40",
        ],
      },
      size: {
        sm: "size-control-sm rounded-sm",
        md: "size-control-md rounded-md",
        lg: "size-control-lg rounded-md",
      },
      shape: { rect: "", pill: "rounded-pill" },
    },
    defaultVariants: { variant: "ghost", size: "md", shape: "rect" },
  },
);

export interface IconButtonProps
  extends Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, "children">,
    VariantProps<typeof iconButtonVariants> {
  /** Accessible name. Required — never optional on an icon-only control. */
  label: string;
  glyph: IconDef;
  loading?: boolean;
}

export const IconButton = React.forwardRef<HTMLButtonElement, IconButtonProps>(
  function IconButton(
    {
      className,
      variant,
      size = "md",
      shape,
      label,
      glyph,
      loading = false,
      disabled,
      type = "button",
      onClick,
      ...props
    },
    ref,
  ) {
    const iconSize = size === "sm" ? 16 : size === "lg" ? 20 : 16;

    return (
      <button
        ref={ref}
        type={type}
        aria-label={label}
        aria-busy={loading || undefined}
        aria-disabled={loading || undefined}
        disabled={disabled}
        onClick={loading ? undefined : onClick}
        // Busy, not disabled — see the note in `Button`.
        className={cn(
          iconButtonVariants({ variant, size, shape }),
          loading && "pointer-events-none",
          className,
        )}
        {...props}
      >
        {loading ? <Spinner size={iconSize} /> : <Icon glyph={glyph} size={iconSize} />}
      </button>
    );
  },
);
