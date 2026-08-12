"use client";

import * as React from "react";
import Link from "next/link";
import { motion, useMotionValueEvent, useReducedMotion, useScroll, useTransform } from "motion/react";
import { cn } from "@/lib/cn";
import { Logo, Logomark } from "@/components/brand/logomark";
import { IconExternal, IconMenu } from "@/components/icons";
import { Icon } from "@/components/icon";
import { ButtonLink } from "@/components/ui/button";
import { IconButton } from "@/components/ui/icon-button";
import {
  Sheet,
  SheetBody,
  SheetClose,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { COMMUNITY_URL, NAV_SECTION_LINKS } from "./site-links";
import { navBeat } from "./hero-sequence";

/**
 * SPEC §6.1 — a floating pill 24px from the top, translucent with backdrop
 * blur, `--elev-2`, and a separate solid ink "Get started" pill at top right.
 *
 * The inversion is a genuine cross-fade rather than a class swap, in two parts:
 *
 * - the pill's two fills (translucent ink and translucent white) are stacked
 *   and their opacities are driven *continuously* off `scrollY`, so mid-scroll
 *   the surface is a real blend of both rather than one or the other;
 * - the foreground — text, mark, hairline — cannot be duplicated without
 *   duplicating the links for assistive tech, so it crosses over on a
 *   `--dur-base` colour transition triggered at the halfway point.
 *
 * Together that reads as one continuous inversion, which is what the spec is
 * describing when it rules out "a hard swap".
 */

/** Where the cross-fade lands, relative to the bottom of the hero. */
const FADE_LEAD_IN = 200;
const FADE_DISTANCE = 160;
const FADE_FLOOR = 240;

export interface MarketingNavProps {
  /** True only on `/`, where the nav starts white-on-cobalt. */
  overHero: boolean;
}

export function MarketingNav({ overHero }: MarketingNavProps) {
  const reduced = useReducedMotion();
  const { scrollY } = useScroll();
  const [past, setPast] = React.useState(!overHero);
  const [menuOpen, setMenuOpen] = React.useState(false);

  /**
   * The cross-fade band tracks the viewport rather than a constant, because
   * the hero is `min-h-dvh`: on a 1440×900 monitor the inversion has to happen
   * 700px down, on a 390×844 phone 644px down. Held in a ref and read inside
   * the transform so a resize never re-subscribes the scroll listener.
   */
  const startRef = React.useRef(FADE_FLOOR * 2);
  React.useEffect(() => {
    if (!overHero) return;
    const measure = () => {
      startRef.current = Math.max(FADE_FLOOR, window.innerHeight - FADE_LEAD_IN);
    };
    measure();
    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
  }, [overHero]);

  const progress = useTransform(scrollY, (value) => {
    if (!overHero) return 1;
    const ratio = (value - startRef.current) / FADE_DISTANCE;
    return Math.min(1, Math.max(0, ratio));
  });
  const darkFill = useTransform(progress, (value) => 1 - value);

  useMotionValueEvent(progress, "change", (value) => {
    setPast(value > 0.5);
  });

  return (
    <header className="fixed inset-x-0 top-6 z-(--z-nav) px-6 lg:px-10">
      <div className="mx-auto flex max-w-marketing items-center justify-between gap-4">
        <motion.nav
          aria-label="Main"
          data-past={past ? "true" : "false"}
          initial={{ y: -8, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={navBeat(reduced)}
          className={cn(
            "glass relative flex items-center gap-1 rounded-pill p-1 shadow-elev-2",
            "text-white transition-ui duration-(--dur-base) data-[past=true]:text-ink-950",
          )}
        >
          {/* dynamic: fill opacity is a live scroll-derived MotionValue. */}
          <motion.span
            aria-hidden="true"
            style={{ opacity: darkFill }}
            className="pointer-events-none absolute inset-0 rounded-pill border border-white/15 bg-ink-950/55"
          />
          {/* dynamic: fill opacity is a live scroll-derived MotionValue. */}
          <motion.span
            aria-hidden="true"
            style={{ opacity: progress }}
            className="pointer-events-none absolute inset-0 rounded-pill border border-ink-200 bg-white/75"
          />

          <Link
            href="/"
            aria-label="Vireo home"
            className="relative flex h-control-md items-center rounded-pill px-3 text-current"
          >
            <Logo size={20} className="hidden sm:inline-flex" />
            <Logomark size={20} className="sm:hidden" />
          </Link>

          <a
            href={COMMUNITY_URL}
            target="_blank"
            rel="noreferrer"
            className={cn(
              "text-body-sm relative hidden h-control-md items-center gap-1 rounded-pill px-3 font-medium",
              "transition-ui duration-(--dur-instant) hover:bg-current/10 md:inline-flex",
            )}
          >
            Community
            <Icon glyph={IconExternal} size={16} className="opacity-60" />
          </a>

          <Link
            href="/login"
            className={cn(
              "text-body-sm relative hidden h-control-md items-center rounded-pill px-3 font-medium",
              "transition-ui duration-(--dur-instant) hover:bg-current/10 md:inline-flex",
            )}
          >
            Log in
          </Link>

          <IconButton
            label="Open menu"
            glyph={IconMenu}
            shape="pill"
            aria-expanded={menuOpen}
            onClick={() => setMenuOpen(true)}
            className="relative text-current hover:bg-current/10 hover:text-current md:hidden"
          />
        </motion.nav>

        <motion.div
          initial={{ y: -8, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={navBeat(reduced)}
        >
          <ButtonLink href="/signup" variant="pill" size="md">
            Get started
          </ButtonLink>
        </motion.div>
      </div>

      <MobileMenu open={menuOpen} onOpenChange={setMenuOpen} />
    </header>
  );
}

function MobileMenu({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent aria-describedby={undefined} className="md:hidden">
        <SheetHeader>
          <SheetTitle>
            <Logo size={20} />
          </SheetTitle>
        </SheetHeader>
        <SheetBody className="flex flex-col gap-2">
          {NAV_SECTION_LINKS.map((link) => (
            <SheetClose asChild key={link.label}>
              <Link
                href={link.href}
                className={cn(
                  "text-title-md flex min-h-control-lg items-center rounded-md px-3 text-ink-950",
                  "transition-ui duration-(--dur-instant) hover:bg-ink-100",
                )}
              >
                {link.label}
              </Link>
            </SheetClose>
          ))}
          <a
            href={COMMUNITY_URL}
            target="_blank"
            rel="noreferrer"
            className={cn(
              "text-title-md flex min-h-control-lg items-center gap-2 rounded-md px-3 text-ink-950",
              "transition-ui duration-(--dur-instant) hover:bg-ink-100",
            )}
          >
            Community
            <Icon glyph={IconExternal} size={16} className="text-ink-400" />
          </a>

          <div className="mt-6 flex flex-col gap-3">
            <SheetClose asChild>
              <ButtonLink href="/signup" variant="pill" size="lg" block>
                Get started
              </ButtonLink>
            </SheetClose>
            <SheetClose asChild>
              <ButtonLink href="/login" variant="secondary" shape="pill" size="lg" block>
                Log in
              </ButtonLink>
            </SheetClose>
          </div>
        </SheetBody>
      </SheetContent>
    </Sheet>
  );
}
