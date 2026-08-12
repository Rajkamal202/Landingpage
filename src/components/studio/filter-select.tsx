"use client";

import { cn } from "@/lib/cn";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

/**
 * Every grid in the app filters the same way, so the "no filter" option is one
 * sentinel rather than five spellings of it. Radix Select forbids an empty
 * string value, so the absence of a filter is a real value here and is
 * translated back to `undefined` at the query boundary.
 */
export const ANY = "any";

export interface FilterOption<T extends string = string> {
  value: T;
  label: string;
}

export interface FilterSelectProps<T extends string> {
  label: string;
  /** What the unfiltered state is called — "All types", "Any language". */
  anyLabel: string;
  /**
   * The value the `anyLabel` row stands for. Defaults to the `ANY` sentinel,
   * which is right for a filter — but a *sort* always has a real default, and
   * passing `anyValue="recent"` lets this render "Recently edited" as the
   * default row instead of leaving the trigger blank because no item matched.
   */
  anyValue?: T | typeof ANY;
  value: T;
  onValueChange: (value: T) => void;
  options: readonly FilterOption<T>[];
  className?: string;
}

export function FilterSelect<T extends string>({
  label,
  anyLabel,
  anyValue = ANY,
  value,
  onValueChange,
  options,
  className,
}: FilterSelectProps<T>) {
  return (
    <Select value={value} onValueChange={(next) => onValueChange(next as T)}>
      <SelectTrigger
        size="sm"
        aria-label={label}
        className={cn(value === anyValue ? "text-ink-500" : "text-ink-950", className)}
      >
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value={anyValue}>{anyLabel}</SelectItem>
        {options.map((option) => (
          <SelectItem key={option.value} value={option.value}>
            {option.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

/** `any` means "no filter" to the UI and `undefined` to the API layer. */
export function filterValue<T extends string>(value: string): T | undefined {
  return value === ANY ? undefined : (value as T);
}
