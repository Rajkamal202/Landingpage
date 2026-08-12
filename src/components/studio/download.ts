import type { Asset } from "@/lib/schemas";

/**
 * The placeholder media is served from `/media`, so a download here is a real
 * file landing in the user's downloads folder rather than a toast pretending
 * one did.
 */
export function downloadAsset(asset: Asset): void {
  const extension = asset.src.split(".").pop() ?? "mp4";
  const link = document.createElement("a");
  link.href = asset.src;
  link.download = `${asset.name.replace(/[^\w -]+/g, "")}.${extension}`;
  link.rel = "noopener";
  document.body.appendChild(link);
  link.click();
  link.remove();
}
