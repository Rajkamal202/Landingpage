import * as React from "react";
import Link from "next/link";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/cn";
import { Icon } from "@/components/icon";
import type { IconDef } from "@/components/icons";
import { Spinner } from "./spinner";

/**
 * SPEC §5. Six states, every one designed:
 *
 * - resting / hover  — fill and border shift, never the layout
 * - active           — the button drops 1px and loses its contact shadow, so
 *                      it reads as physically pressed rather than just darker
 * - focus-visible    — the global 2px brand ring at 2px offset (§11)
 * - disabled         — flat fill, no shadow, no hover; still reachable by
 *                      keyboard so the tooltip explaining *why* can be read
 * - loading          — the label stays in the flow at `opacity-0` and the
 *                      spinner is absolutely centred, so the button cannot
 *                      change width mid-press (SPEC §13, no layout shift)
 *
 * There is no `asChild`. A button that navigates is an anchor, so links use
 * `ButtonLink` and get the same variants with correct semantics — which also
 * means no Slot-cloning gymnastics around the loading overlay.
 */
export const buttonVariants = cva(
  [
    "relative inline-flex select-none items-center justify-center gap-2 whitespace-nowrap",
    "font-medium transition-ui duration-(--dur-instant)",
    "disabled:pointer-events-none disabled:shadow-none",
    "touch-target",
  ],
  {
    variants: {
      variant: {
        primary: [
          "bg-ink-950 text-white shadow-elev-1",
          "hover:bg-ink-900",
          "active:translate-y-px active:bg-ink-950 active:shadow-none",
          "disabled:bg-ink-200 disabled:text-ink-400",
        ],
        secondary: [
          "border border-ink-200 bg-surface text-ink-950 shadow-elev-1",
          "hover:border-ink-300 hover:bg-ink-50",
          "active:translate-y-px active:bg-ink-100 active:shadow-none",
          "disabled:border-ink-200 disabled:bg-ink-50 disabled:text-ink-300",
        ],
        ghost: [
          "text-ink-700",
          "hover:bg-ink-100 hover:text-ink-950",
          "active:bg-ink-200",
          "disabled:bg-transparent disabled:text-ink-300",
        ],
        danger: [
          "bg-danger text-white shadow-elev-1",
          "hover:bg-danger-600",
          "active:translate-y-px active:shadow-none",
          "disabled:bg-ink-200 disabled:text-ink-400",
        ],
        /** The marketing CTA: a solid ink pill that lifts on hover. */
        pill: [
          "rounded-pill bg-ink-950 text-white shadow-elev-2",
          "hover:bg-ink-900 hover:shadow-elev-3",
          "active:translate-y-px active:shadow-elev-1",
          "disabled:bg-ink-200 disabled:text-ink-400",
        ],
        /**
         * White-on-dark, for CTAs on the ink-950 pricing and enterprise slabs.
         * Not in the SPEC §5 list; the alternative was six one-off overrides
         * scattered across the marketing page. Recorded in DECISIONS.md.
         */
        inverse: [
          "bg-white text-ink-950 shadow-elev-2",
          "hover:bg-ink-50",
          "active:translate-y-px active:shadow-elev-1",
          "disabled:bg-ink-700 disabled:text-ink-400",
        ],
      },
      size: {
        sm: "h-control-sm rounded-md px-3 text-body-sm",
        md: "h-control-md rounded-md px-4 text-body-md",
        lg: "h-control-lg rounded-md px-5 text-body-md",
      },
      shape: { rect: "", pill: "rounded-pill" },
      block: { true: "w-full", false: "" },
    },
    compoundVariants: [{ variant: "pill", class: "rounded-pill" }],
    defaultVariants: { variant: "primary", size: "md", shape: "rect", block: false },
  },
);

type ButtonVariants = VariantProps<typeof buttonVariants>;

interface ContentProps {
  size: ButtonVariants["size"];
  loading?: boolean;
  iconStart?: IconDef;
  iconEnd?: IconDef;
  children?: React.ReactNode;
}

function ButtonContent({ size, loading, iconStart, iconEnd, children }: ContentProps) {
  const iconSize = size === "lg" ? 20 : 16;
  return (
    <>
      {loading ? (
        <span className="absolute inset-0 grid place-items-center">
          <Spinner size={iconSize} />
        </span>
      ) : null}
      <span className={cn("inline-flex items-center gap-2", loading && "opacity-0")}>
        {iconStart ? <Icon glyph={iconStart} size={iconSize} /> : null}
        {children}
        {iconEnd ? <Icon glyph={iconEnd} size={iconSize} /> : null}
      </span>
    </>
  );
}

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    ButtonVariants {
  loading?: boolean;
  iconStart?: IconDef;
  iconEnd?: IconDef;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  {
    className,
    variant,
    size = "md",
    shape,
    block,
    loading = false,
    iconStart,
    iconEnd,
    disabled,
    children,
    type = "button",
    onClick,
    ...props
  },
  ref,
) {
  return (
    <button
      ref={ref}
      type={type}
      className={cn(
        buttonVariants({ variant, size, shape, block }),
        // A loading button is *busy*, not disabled: it keeps its variant's
        // fill so it still reads as the primary action, and stays focusable so
        // a screen reader can announce the busy state. Setting `disabled`
        // instead would drop it out of the tab order and paint it with the
        // disabled fill, which reads as "this control died".
        loading && "pointer-events-none",
        className,
      )}
      disabled={disabled}
      aria-disabled={loading || undefined}
      aria-busy={loading || undefined}
      data-loading={loading || undefined}
      onClick={loading ? undefined : onClick}
      {...props}
    >
      <ButtonContent size={size} loading={loading} iconStart={iconStart} iconEnd={iconEnd}>
        {children}
      </ButtonContent>
    </button>
  );
});

export interface ButtonLinkProps
  extends React.ComponentPropsWithoutRef<typeof Link>,
    ButtonVariants {
  iconStart?: IconDef;
  iconEnd?: IconDef;
}

export const ButtonLink = React.forwardRef<HTMLAnchorElement, ButtonLinkProps>(
  function ButtonLink(
    { className, variant, size = "md", shape, block, iconStart, iconEnd, children, ...props },
    ref,
  ) {
    return (
      <Link
        ref={ref}
        className={cn(buttonVariants({ variant, size, shape, block }), className)}
        {...props}
      >
        <ButtonContent size={size} iconStart={iconStart} iconEnd={iconEnd}>
          {children}
        </ButtonContent>
      </Link>
    );
  },
);
