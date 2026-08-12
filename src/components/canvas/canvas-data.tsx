"use client";

import * as React from "react";
import type { Actor, Asset, Model } from "@/lib/schemas";

/**
 * Library assets, models and actors, resolved once for the whole canvas.
 *
 * Node components are rendered by React Flow, so they cannot be handed props
 * from the screen. Rather than have thirty nodes each fire their own lookup,
 * the screen loads these once and publishes them here; a node reads the map
 * it needs and nothing else.
 */
export interface CanvasData {
  assets: ReadonlyMap<string, Asset>;
  models: readonly Model[];
  actors: readonly Actor[];
  /** False while the first load is in flight, so nodes can show a skeleton. */
  ready: boolean;
}

const EMPTY: CanvasData = {
  assets: new Map(),
  models: [],
  actors: [],
  ready: false,
};

const CanvasDataContext = React.createContext<CanvasData>(EMPTY);

export function CanvasDataProvider({
  value,
  children,
}: {
  value: CanvasData;
  children: React.ReactNode;
}) {
  return <CanvasDataContext.Provider value={value}>{children}</CanvasDataContext.Provider>;
}

export function useCanvasData(): CanvasData {
  return React.useContext(CanvasDataContext);
}

export function useAsset(assetId: string | null): Asset | undefined {
  const { assets } = useCanvasData();
  return assetId === null ? undefined : assets.get(assetId);
}
