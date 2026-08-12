"use client";

import type * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/cn";
import { Icon } from "@/components/icon";
import { IconBilling, IconTeam, IconUser } from "@/components/icons";
import { LibrarySheet } from "../library-sheet";

/**
 * SPEC §7.2 — the three settings routes share one frame: a nav on the left at
 * desktop widths, a scrolling row of the same links above the content at
 * phone widths.
 *
 * The heading stays with each page rather than living here, so every route
 * still has exactly one `h1` naming the section the user is actually on.
 */
const LINKS = [
  {
    href: "/app/settings/account",
    label: "Account",
    description: "Name, email and password",
    glyph: IconUser,
  },
  {
    href: "/app/settings/billing",
    label: "Billing",
    description: "Plan, tokens and invoices",
    glyph: IconBilling,
  },
  {
    href: "/app/settings/team",
    label: "Team",
    description: "Members, roles and invites",
    glyph: IconTeam,
  },
] as const;

export function SettingsFrame({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-y-auto">
      <div className="mx-auto flex w-full max-w-marketing flex-col gap-6 px-4 py-6 sm:px-6 sm:py-8 lg:flex-row lg:gap-10">
        <nav aria-label="Settings" className="shrink-0 lg:w-panel">
          <ul className="flex gap-2 overflow-x-auto pb-1 lg:flex-col lg:gap-1 lg:overflow-visible lg:pb-0">
            {LINKS.map((link) => {
              const active = pathname === link.href;
              return (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    aria-current={active ? "page" : undefined}
                    className={cn(
                      "flex items-center gap-3 whitespace-nowrap rounded-md px-3 py-2",
                      "transition-ui duration-(--dur-instant)",
                      active
                        ? "bg-ink-100 text-ink-950"
                        : "text-ink-700 hover:bg-ink-100 hover:text-ink-950",
                    )}
                  >
                    <Icon glyph={link.glyph} size={16} />
                    <span className="flex flex-col">
                      <span className="text-body-sm font-medium">{link.label}</span>
                      <span className="text-body-sm hidden text-ink-700 lg:block">
                        {link.description}
                      </span>
                    </span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        <div className="min-w-0 flex-1">{children}</div>
      </div>

      <LibrarySheet />
    </div>
  );
}
