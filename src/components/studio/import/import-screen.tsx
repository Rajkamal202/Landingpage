"use client";

import * as React from "react";
import { useSearchParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { AnimatePresence, LayoutGroup, motion } from "motion/react";
import { listAssets } from "@/lib/api/assets";
import { setFailureRate } from "@/lib/api/client";
import { analyzeSource, detectPlatform } from "@/lib/api/clone";
import { queryKeys } from "@/lib/api/keys";
import { getProject } from "@/lib/api/projects";
import { useProgressStream } from "@/lib/hooks/use-progress-stream";
import { transition } from "@/lib/motion/variants";
import { PLATFORM_LABEL, type CloneProgress, type CloneResult } from "@/lib/schemas";
import { IconLink } from "@/components/icons";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { toast } from "@/components/ui/toast";
import { UploadTrigger } from "@/components/ui/upload-dropzone";
import { LibrarySheet } from "../library-sheet";
import { useOpenProject } from "../use-open-project";
import type { ProjectSurface } from "../href";
import { CloneAnalyzing } from "./clone-analyzing";
import { CloneFailureCard } from "./clone-failure";
import { CloneResultCard } from "./clone-result";
import { RecentClones } from "./recent-clones";
import { UploadDialog } from "./upload-dialog";

const PANEL = {
  initial: { opacity: 0, y: 8 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -8 },
} as const;

/**
 * SPEC §8.1 — three states in one card, and the moment the product has to
 * feel like magic.
 *
 * `?url=` arrives from the marketing hero and starts the analysis on its own.
 * `?chaos=` sets the dev failure rate so the named failure states are
 * reachable without editing code (SPEC §9).
 */
export function ImportScreen() {
  const searchParams = useSearchParams();
  const urlParam = searchParams.get("url") ?? "";
  const chaosParam = searchParams.get("chaos");

  const [url, setUrl] = React.useState(urlParam);
  const [touched, setTouched] = React.useState(false);
  const [uploadOpen, setUploadOpen] = React.useState(false);
  const [uploadQueue, setUploadQueue] = React.useState<readonly File[]>([]);

  const inputRef = React.useRef<HTMLInputElement>(null);
  const urlRef = React.useRef(url);
  urlRef.current = url;

  React.useEffect(() => {
    const rate = chaosParam === null ? 0 : Number.parseFloat(chaosParam);
    setFailureRate(Number.isFinite(rate) ? rate : 0);
  }, [chaosParam]);

  const check = detectPlatform(url);
  const openProject = useOpenProject();

  const stream = useProgressStream<CloneProgress, CloneResult>(
    () => analyzeSource(urlRef.current),
    {
      onDone: (result) => {
        toast.success("Video cloned", {
          description: `${result.scenes.length} scenes and ${result.textLayers.length} text layers are editable.`,
        });
      },
    },
  );
  const { start, reset, status, progress, result, error } = stream;

  // `?url=` from the hero: validate it, then run without a second click.
  const autoStarted = React.useRef(false);
  React.useEffect(() => {
    if (autoStarted.current || !urlParam) return;
    if (detectPlatform(urlParam).status !== "ok") return;
    autoStarted.current = true;
    start();
  }, [urlParam, start]);

  const videoAssets = useQuery({
    queryKey: queryKeys.assets.list({ kind: "video", sort: "recent" }),
    queryFn: () => listAssets({ kind: "video", sort: "recent" }),
  });
  const preview = videoAssets.data?.[0];

  const resultProjectId = result?.projectId ?? null;
  const project = useQuery({
    queryKey: queryKeys.projects.detail(resultProjectId ?? "none"),
    queryFn: () => getProject(resultProjectId ?? ""),
    enabled: resultProjectId !== null,
  });

  const submit = () => {
    setTouched(true);
    if (check.status !== "ok") {
      inputRef.current?.focus();
      return;
    }
    start();
  };

  const startOver = () => {
    reset();
    setTouched(false);
    setUrl("");
    autoStarted.current = false;
  };

  const openResult = (surface: ProjectSurface) => {
    if (!result) return;
    openProject(
      {
        id: result.projectId,
        name: project.data?.name ?? `${result.handle} clone`,
        kind: project.data?.kind ?? "video",
      },
      surface,
    );
  };

  const message =
    touched && (check.status === "invalid" || check.status === "unsupported")
      ? check.message
      : touched && check.status === "empty"
        ? "Paste the link to the post you want to clone, starting with https."
        : undefined;

  const sourceLabel = url.trim() || urlParam || "Pasted link";

  return (
    <main className="flex min-h-0 flex-1 flex-col overflow-y-auto">
      <div className="mx-auto flex w-full max-w-2xl flex-col gap-8 px-4 py-12 sm:px-6">
        <header className="flex flex-col items-center gap-2 text-center">
          <h1 className="text-display-md text-ink-950">Clone a video</h1>
          <p className="text-body-lg text-ink-500">
            Paste a link and Vireo rebuilds it as editable scenes, text and captions.
          </p>
        </header>

        <LayoutGroup>
          <motion.div
            layout
            transition={transition.base}
            className="rounded-lg border border-ink-200 bg-surface p-6 shadow-elev-3"
          >
            <AnimatePresence mode="wait" initial={false}>
              {status === "running" ? (
                <motion.div key="analyzing" variants={PANEL} initial="initial" animate="animate" exit="exit" transition={transition.fast}>
                  <CloneAnalyzing
                    progress={progress}
                    sourceLabel={sourceLabel}
                    previewSrc={preview?.src}
                    previewPoster={preview?.poster}
                  />
                </motion.div>
              ) : status === "done" && result ? (
                <motion.div key="result" variants={PANEL} initial="initial" animate="animate" exit="exit" transition={transition.fast}>
                  <CloneResultCard
                    result={result}
                    onOpenTimeline={() => openResult("timeline")}
                    onOpenBulk={() => openResult("bulk")}
                    onStartOver={startOver}
                  />
                </motion.div>
              ) : status === "error" && error ? (
                <motion.div key="failure" variants={PANEL} initial="initial" animate="animate" exit="exit" transition={transition.fast}>
                  <CloneFailureCard
                    error={error}
                    sourceLabel={sourceLabel}
                    onRetry={start}
                    onStartOver={startOver}
                  />
                </motion.div>
              ) : (
                <motion.div
                  key="input"
                  variants={PANEL}
                  initial="initial"
                  animate="animate"
                  exit="exit"
                  transition={transition.fast}
                  className="flex flex-col gap-4"
                >
                  <form
                    onSubmit={(event) => {
                      event.preventDefault();
                      submit();
                    }}
                    className="flex flex-col gap-3"
                  >
                    <Field label="Video or slideshow link" error={message}>
                      <Input
                        ref={inputRef}
                        size="lg"
                        iconStart={IconLink}
                        value={url}
                        onChange={(event) => setUrl(event.target.value)}
                        placeholder="Paste a video or slideshow link"
                        inputMode="url"
                        autoComplete="off"
                        spellCheck={false}
                        suffix={
                          check.status === "ok" ? (
                            <motion.span
                              initial={{ opacity: 0, scale: 0.9 }}
                              animate={{ opacity: 1, scale: 1 }}
                              transition={transition.fast}
                              className="inline-flex"
                            >
                              <Badge tone="brand">{PLATFORM_LABEL[check.platform]}</Badge>
                            </motion.span>
                          ) : null
                        }
                      />
                    </Field>

                    <div className="flex flex-wrap items-center gap-3">
                      <Button type="submit" size="lg" variant="primary">
                        Clone video
                      </Button>
                      <span className="text-body-sm text-ink-400">or</span>
                      <UploadTrigger
                        label="Upload a file"
                        onFiles={(files) => {
                          setUploadQueue(files);
                          setUploadOpen(true);
                        }}
                      />
                    </div>
                  </form>

                  <p className="text-body-sm text-ink-400">
                    TikTok, Instagram, YouTube Shorts and Meta Ads links all work.
                  </p>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        </LayoutGroup>

        {status === "idle" ? (
          <section aria-labelledby="recent-clones-heading" className="flex flex-col gap-3">
            <h2 id="recent-clones-heading" className="text-title-md text-ink-950">
              Recent clones
            </h2>
            <RecentClones
              onReuse={(next) => {
                setUrl(next);
                setTouched(false);
                inputRef.current?.focus();
              }}
              onFocusInput={() => inputRef.current?.focus()}
            />
          </section>
        ) : null}
      </div>

      <UploadDialog open={uploadOpen} onOpenChange={setUploadOpen} queue={uploadQueue} />
      <LibrarySheet />
    </main>
  );
}
