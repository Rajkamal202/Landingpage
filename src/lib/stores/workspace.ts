"use client";

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import type { ProjectKind, WorkspaceTab } from "@/lib/schemas";

/**
 * SPEC §7.1: tabs are the primary navigation model, and SPEC §10 asks for
 * session persistence of open tabs. Persisted to `sessionStorage`, so a
 * refresh restores the workspace but a new tab starts clean — which matches
 * how people actually use a studio.
 */

export type EditorSurface = WorkspaceTab["surface"];

export const SURFACE_FOR_KIND: Record<ProjectKind, EditorSurface> = {
  video: "timeline",
  slideshow: "slideshow",
  canvas: "canvas",
};

interface WorkspaceState {
  tabs: WorkspaceTab[];
  activeProjectId: string | null;
  libraryOpen: boolean;
  hydrated: boolean;

  openTab: (tab: WorkspaceTab) => void;
  closeTab: (projectId: string) => void;
  closeOthers: (projectId: string) => void;
  setActive: (projectId: string) => void;
  renameTab: (projectId: string, name: string) => void;
  reorderTabs: (tabs: WorkspaceTab[]) => void;
  setSurface: (projectId: string, surface: EditorSurface) => void;
  setLibraryOpen: (open: boolean) => void;
}

export const useWorkspaceStore = create<WorkspaceState>()(
  persist(
    (set) => ({
      tabs: [],
      activeProjectId: null,
      libraryOpen: false,
      hydrated: false,

      openTab: (tab) =>
        set((state) => {
          const existing = state.tabs.find((candidate) => candidate.projectId === tab.projectId);
          if (existing) {
            return {
              activeProjectId: tab.projectId,
              tabs: state.tabs.map((candidate) =>
                candidate.projectId === tab.projectId
                  ? { ...candidate, surface: tab.surface }
                  : candidate,
              ),
            };
          }
          return { tabs: [...state.tabs, tab], activeProjectId: tab.projectId };
        }),

      closeTab: (projectId) =>
        set((state) => {
          const index = state.tabs.findIndex((tab) => tab.projectId === projectId);
          const tabs = state.tabs.filter((tab) => tab.projectId !== projectId);
          if (state.activeProjectId !== projectId) return { tabs };
          // Activate the neighbour to the right, or the new last tab — the
          // same rule browsers use, so it needs no explanation.
          const next = tabs[Math.min(index, tabs.length - 1)];
          return { tabs, activeProjectId: next?.projectId ?? null };
        }),

      closeOthers: (projectId) =>
        set((state) => ({
          tabs: state.tabs.filter((tab) => tab.projectId === projectId),
          activeProjectId: projectId,
        })),

      setActive: (projectId) => set({ activeProjectId: projectId }),

      renameTab: (projectId, name) =>
        set((state) => ({
          tabs: state.tabs.map((tab) => (tab.projectId === projectId ? { ...tab, name } : tab)),
        })),

      reorderTabs: (tabs) => set({ tabs }),

      setSurface: (projectId, surface) =>
        set((state) => ({
          tabs: state.tabs.map((tab) =>
            tab.projectId === projectId ? { ...tab, surface } : tab,
          ),
        })),

      setLibraryOpen: (libraryOpen) => set({ libraryOpen }),
    }),
    {
      name: "vireo:workspace",
      storage: createJSONStorage(() =>
        typeof window === "undefined" ? emptyStorage : window.sessionStorage,
      ),
      partialize: (state) => ({ tabs: state.tabs, activeProjectId: state.activeProjectId }),
      onRehydrateStorage: () => (state) => {
        // Guarded so the first client render matches the server's empty tab
        // strip; without it the tabs pop in and the top bar shifts.
        if (state) state.hydrated = true;
      },
    },
  ),
);

const emptyStorage: Storage = {
  length: 0,
  clear: () => undefined,
  getItem: () => null,
  key: () => null,
  removeItem: () => undefined,
  setItem: () => undefined,
};
