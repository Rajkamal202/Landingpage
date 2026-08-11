import { cn } from "@/lib/cn";

/**
 * The only spinner in the product. SPEC §13 asks for skeletons rather than
 * spinners for *content* — this exists solely for controls that are themselves
 * the thing loading (a submitting button, a saving field), where a skeleton
 * would mean replacing the control the user just pressed.
 */
export function Spinner({ size = 16, className }: { size?: number; className?: string }) {
  return (
    <svg
      viewBox="0 0 16 16"
      width={size}
      height={size}
      fill="none"
      aria-hidden="true"
      focusable="false"
      className={cn("animate-spin", className)}
    >
      <circle cx="8" cy="8" r="6.5" stroke="currentColor" strokeWidth="1.5" opacity="0.25" />
      <path
        d="M14.5 8A6.5 6.5 0 0 0 8 1.5"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </svg>
  );
}
