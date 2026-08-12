import * as React from "react";
import { cn } from "@/lib/cn";

/**
 * SPEC §4.4 — the marketing container and the vertical rhythm.
 *
 * "128px desktop, 80px tablet, 64px mobile. Applied consistently — this rhythm
 * is most of what makes a page feel professionally built." It is therefore a
 * component and not a class anybody types, so it cannot drift by a step.
 */

export function Container({ className, ...props }: React.ComponentProps<"div">) {
  return <div className={cn("mx-auto w-full max-w-marketing px-6 lg:px-10", className)} {...props} />;
}

export interface SectionProps extends React.ComponentProps<"section"> {
  /** `flush` drops the rhythm for sections that own their own spacing (the hero). */
  rhythm?: "default" | "flush";
}

export function Section({ className, rhythm = "default", ...props }: SectionProps) {
  return (
    <section
      className={cn(rhythm === "default" && "py-16 md:py-20 lg:py-32", className)}
      {...props}
    />
  );
}

export interface SectionHeadingProps {
  /** Renders above the title in `caption`. Omitted more often than not. */
  eyebrow?: string;
  title: string;
  /** One or two lines of `body-lg`. Never longer — SPEC §4.3 bans centred prose. */
  sub?: string;
  /** A third, quieter line. Pricing uses it for the self-serve/concierge split. */
  note?: string;
  align?: "center" | "start";
  /**
   * SPEC §11 — one `h1` per route. The pricing section is an `h2` inside the
   * home page and the `h1` of `/pricing`, so the tag is a prop and the size is
   * not: heading level and type scale are independent decisions.
   */
  level?: 1 | 2;
  headingId?: string;
  className?: string;
}

export function SectionHeading({
  eyebrow,
  title,
  sub,
  note,
  align = "center",
  level = 2,
  headingId,
  className,
}: SectionHeadingProps) {
  const Heading = level === 1 ? "h1" : "h2";
  return (
    <div
      className={cn(
        "flex flex-col gap-4",
        align === "center" ? "items-center text-center" : "items-start text-left",
        className,
      )}
    >
      {eyebrow ? <p className="eyebrow text-ink-500">{eyebrow}</p> : null}
      <Heading id={headingId} className="text-display-md lg:text-display-lg text-ink-950">
        {title}
      </Heading>
      {sub ? <p className="text-body-lg max-w-measure text-ink-500">{sub}</p> : null}
      {note ? <p className="text-body-md max-w-measure text-ink-500">{note}</p> : null}
    </div>
  );
}
