"use client";

import { AnimatePresence, motion } from "motion/react";
import { transition } from "@/lib/motion/variants";
import { IconClose, IconDelete, IconDownload, IconFavorite } from "@/components/icons";
import { Button } from "@/components/ui/button";
import { IconButton } from "@/components/ui/icon-button";

/**
 * SPEC §8.2 — "a contextual action bar rises from the bottom when a selection
 * exists." It sits above the composer so neither control blocks the other.
 */
export function SelectionBar({
  count,
  onDownload,
  onFavorite,
  onDelete,
  onClear,
}: {
  count: number;
  onDownload: () => void;
  onFavorite: () => void;
  onDelete: () => void;
  onClear: () => void;
}) {
  return (
    <AnimatePresence>
      {count > 0 ? (
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 16 }}
          transition={transition.base}
          className="flex items-center gap-3 rounded-pill bg-ink-950 py-2 pl-5 pr-2 shadow-elev-4"
        >
          <p className="text-body-sm whitespace-nowrap text-white" aria-live="polite">
            {count} selected
          </p>
          <Button size="sm" variant="inverse" iconStart={IconDownload} onClick={onDownload}>
            Download
          </Button>
          <Button size="sm" variant="inverse" iconStart={IconFavorite} onClick={onFavorite}>
            Favourite
          </Button>
          <Button size="sm" variant="danger" iconStart={IconDelete} onClick={onDelete}>
            Delete
          </Button>
          <IconButton
            label="Clear selection"
            glyph={IconClose}
            size="sm"
            variant="overlay"
            onClick={onClear}
          />
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
