"use client";

import * as React from "react";
import Link from "next/link";
import { motion, useMotionValueEvent, useReducedMotion, useScroll, useTransform } from "motion/react";
import { cn } from "@/lib/cn";
import { Logomark } from "@/components/brand/logomark";
import { IconMenu } from "@/components/icons";
import { IconButton } from "@/components/ui/icon-button";
import {
  Sheet,
  SheetBody,
  SheetClose,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { NAV_SECTION_LINKS } from "./site-links";
import { navBeat } from "./hero-sequence";

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
      <div className="mx-auto flex max-w-marketing items-center justify-center">
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
            className="pointer-events-none absolute inset-0 rounded-pill border border-white/15 bg-ink-950/60"
          />
          {/* dynamic: fill opacity is a live scroll-derived MotionValue. */}
          <motion.span
            aria-hidden="true"
            style={{ opacity: progress }}
            className="pointer-events-none absolute inset-0 rounded-pill border border-ink-200 bg-white/80"
          />

          <Link
            href="/"
            aria-label="Avelon home"
            className="relative flex h-control-md items-center rounded-pill px-3 text-current"
          >
            <Logomark size={24} priority />
          </Link>

          {/* Section navigation links */}
          <div className="hidden md:flex items-center gap-0.5">
            {NAV_SECTION_LINKS.map((link) => (
              <a
                key={link.label}
                href={typeof link.href === "string" ? link.href : "/"}
                className={cn(
                  "text-body-sm relative h-control-md inline-flex items-center rounded-pill px-3 font-medium",
                  "transition-ui duration-(--dur-instant) hover:bg-current/10 text-current",
                )}
              >
                {link.label}
              </a>
            ))}
          </div>

          <IconButton
            label="Open menu"
            glyph={IconMenu}
            shape="pill"
            aria-expanded={menuOpen}
            onClick={() => setMenuOpen(true)}
            className="relative text-current hover:bg-current/10 hover:text-current md:hidden"
          />
        </motion.nav>
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
            <Logomark size={24} />
          </SheetTitle>
        </SheetHeader>
        <SheetBody className="flex flex-col gap-2">
          {NAV_SECTION_LINKS.map((link) => (
            <SheetClose asChild key={link.label}>
              <a
                href={typeof link.href === "string" ? link.href : "/"}
                className={cn(
                  "text-title-md flex min-h-control-lg items-center rounded-md px-3 text-ink-950",
                  "transition-ui duration-(--dur-instant) hover:bg-ink-100",
                )}
              >
                {link.label}
              </a>
            </SheetClose>
          ))}
        </SheetBody>
      </SheetContent>
    </Sheet>
  );
}
