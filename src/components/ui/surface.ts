/**
 * Every floating layer in the product — popover, dropdown, context menu,
 * combobox, command palette, select — shares one surface and one item style.
 * Defined once so six different menus cannot end up with six different
 * paddings, radii and hover fills.
 */

export const popSurface =
  "anim-pop z-(--z-dropdown) overflow-hidden rounded-lg border border-ink-200 bg-surface p-1 " +
  "shadow-elev-3";

export const menuItem =
  "relative flex w-full cursor-default select-none items-center gap-2 rounded-sm px-2 py-2 " +
  "text-body-sm text-ink-700 outline-none transition-ui duration-(--dur-instant) " +
  "data-[highlighted]:bg-ink-100 data-[highlighted]:text-ink-950 " +
  "data-[state=checked]:text-ink-950 " +
  "data-[disabled]:pointer-events-none data-[disabled]:text-ink-300";

export const menuLabel = "eyebrow px-2 py-2 text-ink-400";

export const menuSeparator = "-mx-1 my-1 h-px bg-ink-200";
