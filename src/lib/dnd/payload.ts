import type { MediaKind } from "@/lib/schemas";

/**
 * The drag contract between surfaces.
 *
 * The drag *source* (the library sheet) and the drop *targets* (the composer's
 * start-frame slot, a canvas source node, a slideshow layer, a bulk media
 * cell) are written by different agents. Without one typed payload they would
 * agree on nothing, so this module is the interface between them and lives in
 * the frozen set.
 */

export const ASSET_MIME = "application/x-vireo-asset";

export interface AssetDragPayload {
  type: "asset";
  assetId: string;
  kind: MediaKind;
  name: string;
  poster: string;
}

export function setAssetDragPayload(
  dataTransfer: DataTransfer,
  payload: AssetDragPayload,
): void {
  dataTransfer.effectAllowed = "copy";
  dataTransfer.setData(ASSET_MIME, JSON.stringify(payload));
  // Plain-text fallback so dragging into a prompt field or an external editor
  // still produces something meaningful rather than nothing.
  dataTransfer.setData("text/plain", payload.name);
}

export function readAssetDragPayload(dataTransfer: DataTransfer): AssetDragPayload | null {
  const raw = dataTransfer.getData(ASSET_MIME);
  if (!raw) return null;
  try {
    const parsed: unknown = JSON.parse(raw);
    if (!isAssetDragPayload(parsed)) return null;
    return parsed;
  } catch {
    return null;
  }
}

/** Cheap check during `dragover`, where the payload itself is unreadable. */
export function hasAssetDragPayload(dataTransfer: DataTransfer | null): boolean {
  if (!dataTransfer) return false;
  return Array.from(dataTransfer.types).includes(ASSET_MIME);
}

function isAssetDragPayload(value: unknown): value is AssetDragPayload {
  if (typeof value !== "object" || value === null) return false;
  const candidate = value as Record<string, unknown>;
  return (
    candidate["type"] === "asset" &&
    typeof candidate["assetId"] === "string" &&
    typeof candidate["kind"] === "string" &&
    typeof candidate["name"] === "string" &&
    typeof candidate["poster"] === "string"
  );
}
