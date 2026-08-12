"use client";

import * as React from "react";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/cn";
import { MarketingNav } from "./nav";

/**
 * Decides which chrome each marketing route gets.
 *
 * `/login` and `/signup` deliberately get none: a floating nav offering
 * "Log in" above a login form, and a four-column footer under it, are both
 * noise at the one moment the page has a single job. Those pages carry their
 * own mark and their own way back.
 *
 * The footer arrives as a prop so it stays a server component — this file has
 * to be a client one for `usePathname`, and there is no reason to ship a static
 * four-column list of links to the browser to find that out.
 */

const BARE_ROUTES = new Set(["/login", "/signup"]);

export function MarketingChrome({
  footer,
  children,
}: {
  footer: React.ReactNode;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  if (BARE_ROUTES.has(pathname)) return <>{children}</>;

  return (
    <>
      <a
        href="#main"
        className={cn(
          "text-body-sm sr-only rounded-md bg-ink-950 px-4 py-2 font-medium text-white",
          "focus:not-sr-only focus:fixed focus:left-6 focus:top-6 focus:z-(--z-dialog)",
        )}
      >
        Skip to content
      </a>
      <MarketingNav overHero={pathname === "/"} />
      {children}
      {footer}
    </>
  );
}
