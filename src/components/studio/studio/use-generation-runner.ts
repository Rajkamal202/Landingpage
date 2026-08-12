"use client";

import * as React from "react";
import { useQueryClient } from "@tanstack/react-query";
import { spendTokens } from "@/lib/api/billing";
import { ApiError } from "@/lib/api/client";
import { createGeneration } from "@/lib/api/generations";
import { queryKeys } from "@/lib/api/keys";
import type { Generation, GenerationRequest } from "@/lib/schemas";
import { toast } from "@/components/ui/toast";

/**
 * SPEC §8.2 / §9 — generation runs off the API's async generator, not a timer.
 *
 * `useProgressStream` is the right tool for a stream whose latest value *is*
 * the state. This one is different: the first thing the generator does is emit
 * every placeholder in the batch back to back, and a hook that keeps only the
 * newest value would drop seven of eight tiles. So the events are folded into
 * a keyed map with functional updates, which cannot lose one.
 */
export interface GenerationRunner {
  live: readonly Generation[];
  running: boolean;
  /** Announced through a live region when a batch lands (SPEC §11). */
  announcement: string;
  run: (request: GenerationRequest, cost: number) => void;
}

export function useGenerationRunner(projectId: string): GenerationRunner {
  const queryClient = useQueryClient();
  const [live, setLive] = React.useState<readonly Generation[]>([]);
  const [running, setRunning] = React.useState(false);
  const [announcement, setAnnouncement] = React.useState("");
  const cancelled = React.useRef(false);

  React.useEffect(() => {
    return () => {
      cancelled.current = true;
    };
  }, []);

  const run = React.useCallback(
    (request: GenerationRequest, cost: number) => {
      setRunning(true);
      setAnnouncement("");

      void (async () => {
        try {
          // The meter moves with the user's action, not after the work lands.
          void spendTokens(cost).then(() => {
            void queryClient.invalidateQueries({ queryKey: queryKeys.billing.balance });
            void queryClient.invalidateQueries({ queryKey: queryKeys.billing.usage });
          });

          for await (const event of createGeneration(request)) {
            if (cancelled.current) return;
            setLive((current) => {
              const index = current.findIndex((item) => item.id === event.generation.id);
              if (index === -1) return [...current, event.generation];
              const next = [...current];
              next[index] = event.generation;
              return next;
            });
          }

          if (cancelled.current) return;
          await queryClient.invalidateQueries({
            queryKey: queryKeys.generations.list(projectId),
          });
          if (cancelled.current) return;
          setLive([]);
          setRunning(false);
          const label =
            request.batchCount === 1 ? "1 result is ready" : `${request.batchCount} results are ready`;
          setAnnouncement(label);
          toast.success(label, { description: "Open one to preview it, or download the set." });
        } catch (caught) {
          if (cancelled.current) return;
          setLive([]);
          setRunning(false);
          const error = caught instanceof ApiError ? caught : null;
          setAnnouncement("The generation didn't start.");
          toast.error(error?.message ?? "The generation didn't start", {
            description:
              error?.fix ?? "Nothing was charged. Check the prompt and settings, then run it again.",
          });
        }
      })();
    },
    [projectId, queryClient],
  );

  return { live, running, announcement, run };
}
