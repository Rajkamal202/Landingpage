import Link from "next/link";
import { cn } from "@/lib/cn";
import { Logo } from "@/components/brand/logomark";
import { Icon } from "@/components/icon";
import { IconExternal, IconHelp, IconSend, IconTeam } from "@/components/icons";
import type { IconDef } from "@/components/icons";
import { Container } from "./section";
import { FOOTER_COLUMNS, OUTBOUND_LINKS, type SiteLink } from "./site-links";

const OUTBOUND_GLYPHS: Record<string, IconDef> = {
  Community: IconTeam,
  Support: IconHelp,
  Contact: IconSend,
};

export function MarketingFooter() {
  return (
    <footer className="bg-ink-950 text-white border-t border-white/10">
      <Container className="flex flex-col gap-16 py-16 lg:gap-20 lg:py-20">
        <div className="grid gap-12 lg:grid-cols-3 lg:gap-16">
          <div className="flex flex-col gap-6">
            <Link href="/" aria-label="Avelon home" className="self-start text-white">
              <Logo size={24} />
            </Link>
            <p className="text-body-md max-w-measure text-ink-300 leading-relaxed">
              The AI video ad studio engineered for modern DTC brands and performance agencies.
              Deconstruct winning formats, cast lifelike AI actors, and multiply conversions.
            </p>
            <ul className="flex flex-wrap gap-2">
              {OUTBOUND_LINKS.map((link) => (
                <li key={link.label}>
                  <FooterOutbound link={link} />
                </li>
              ))}
            </ul>
          </div>

          <div className="grid gap-10 sm:grid-cols-2 lg:col-span-2 lg:grid-cols-4">
            {FOOTER_COLUMNS.map((column) => (
              <nav key={column.heading} aria-label={column.heading} className="flex flex-col gap-4">
                <p className="eyebrow text-ink-400 font-semibold tracking-wider uppercase text-xs">
                  {column.heading}
                </p>
                <ul className="flex flex-col gap-3">
                  {column.links.map((link) => (
                    <li key={link.label}>
                      <FooterLink link={link} />
                    </li>
                  ))}
                </ul>
              </nav>
            ))}
          </div>
        </div>

        <div className="flex flex-col gap-3 border-t border-white/15 pt-8 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-body-sm text-ink-400">© 2026 Avelon. All rights reserved.</p>
          <p className="text-body-sm max-w-measure text-ink-400">
            Coming Soon. Engineered for high-growth DTC brands and performance agencies.
          </p>
        </div>
      </Container>
    </footer>
  );
}

const linkClass = cn(
  "text-body-md inline-flex min-h-control-md items-center gap-2 text-ink-300",
  "transition-ui duration-(--dur-instant) hover:text-white",
);

function FooterLink({ link }: { link: SiteLink }) {
  if (link.external) {
    return <FooterOutbound link={link} />;
  }
  const isHash = typeof link.href === "string" && link.href.startsWith("#");
  if (isHash) {
    return (
      <a href={link.href as string} className={linkClass}>
        {link.label}
      </a>
    );
  }
  return (
    <Link href={link.href} className={linkClass}>
      {link.label}
    </Link>
  );
}

function FooterOutbound({ link }: { link: SiteLink }) {
  const glyph = OUTBOUND_GLYPHS[link.label];
  const mail = typeof link.href === "string" && link.href.startsWith("mailto:");
  return (
    <a
      href={typeof link.href === "string" ? link.href : "/"}
      {...(mail ? {} : { target: "_blank", rel: "noreferrer" })}
      className={cn(linkClass, "rounded-md")}
    >
      {glyph ? <Icon glyph={glyph} size={16} className="text-ink-400" /> : null}
      {link.label}
      {mail ? null : <Icon glyph={IconExternal} size={16} className="text-ink-400" />}
    </a>
  );
}
