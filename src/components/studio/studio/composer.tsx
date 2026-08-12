"use client";

import * as React from "react";
import { useSearchParams } from "next/navigation";
import { AnimatePresence, motion } from "motion/react";
import { cn } from "@/lib/cn";
import { formatNumber } from "@/lib/format";
import { dur, ease } from "@/lib/motion/tokens";
import { transition } from "@/lib/motion/variants";
import {
  promptToPlainText,
  type Asset,
  type AspectRatio,
  type GenerationMode,
  type GenerationRequest,
  type Model,
  type PromptToken,
  type TokenBalance,
} from "@/lib/schemas";
import { IconGenerate, IconImage } from "@/components/icons";
import { AssetPickerDialog } from "@/components/ui/asset-picker-dialog";
import { Icon } from "@/components/icon";
import { IconButton } from "@/components/ui/icon-button";
import { MentionInput } from "@/components/ui/mention-input";
import { AspectRatioPicker, DurationPicker, ModelPicker } from "@/components/ui/pickers";
import { NumberStepper } from "@/components/ui/number-stepper";
import { Tooltip } from "@/components/ui/tooltip";
import { useTokenGuard } from "@/components/ui/token-meter";
import { ActorPicker, TemplatePicker } from "./composer-pickers";
import { MODE_CONFIG } from "./modes";
import { StartFrame } from "./start-frame";

const DURATIONS = [5_000, 10_000, 15_000] as const;

/** `@serum-pour-close` reads as a handle; the asset's display name does not. */
function mentionLabel(name: string): string {
  return (
    name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "")
      .slice(0, 24) || "asset"
  );
}

export interface ComposerProps {
  projectId: string;
  mode: GenerationMode;
  models: readonly Model[];
  assets: readonly Asset[];
  balance: TokenBalance | undefined;
  submitting: boolean;
  /**
   * The start frame lives one level up because the library sheet — a sibling,
   * not a child — also sets it when an asset is clicked there.
   */
  frameId: string | null;
  onFrameChange: (assetId: string | null) => void;
  onSubmit: (request: GenerationRequest, cost: number) => void;
}

/** SPEC §8.2 — the docked composer. */
export function Composer({
  projectId,
  mode,
  models,
  assets,
  balance,
  submitting,
  frameId,
  onFrameChange,
  onSubmit,
}: ComposerProps) {
  const searchParams = useSearchParams();
  const config = MODE_CONFIG[mode];

  const [prompt, setPrompt] = React.useState<PromptToken[]>([]);
  const [modelId, setModelId] = React.useState("");
  const [aspect, setAspect] = React.useState<AspectRatio>("9:16");
  const [durationMs, setDurationMs] = React.useState<number>(5_000);
  const [batchCount, setBatchCount] = React.useState(1);
  const [templateId, setTemplateId] = React.useState<string | null>(null);
  const [actorId, setActorId] = React.useState<string | null>(null);
  const [pickingReference, setPickingReference] = React.useState(false);
  const [flight, setFlight] = React.useState<{ id: number; cost: number } | null>(null);

  // Arriving from the actors or templates browser with a choice already made.
  const actorParam = searchParams.get("actor");
  const templateParam = searchParams.get("template");
  React.useEffect(() => {
    if (actorParam) setActorId(actorParam);
  }, [actorParam]);
  React.useEffect(() => {
    if (templateParam) setTemplateId(templateParam);
  }, [templateParam]);

  const available = React.useMemo(
    () => models.filter((model) => model.modes.includes(mode)),
    [models, mode],
  );

  React.useEffect(() => {
    const first = available[0];
    if (!first) return;
    if (available.some((model) => model.id === modelId)) return;
    setModelId(first.id);
  }, [available, modelId]);

  const model = available.find((candidate) => candidate.id === modelId) ?? available[0];
  const cost = (model?.tokensPerGeneration ?? 0) * batchCount;
  const guard = useTokenGuard(balance, cost);

  const assetById = React.useMemo(
    () => new Map(assets.map((asset) => [asset.id, asset])),
    [assets],
  );
  const frame = frameId ? assetById.get(frameId) : undefined;

  const mentionOptions = React.useMemo(
    () =>
      assets.slice(0, 40).map((asset) => ({
        id: asset.id,
        label: mentionLabel(asset.name),
        kind: asset.kind,
        poster: asset.poster,
      })),
    [assets],
  );

  const promptEmpty = promptToPlainText(prompt).trim().length === 0;
  const durationOptions = DURATIONS.filter((ms) => ms <= (model?.maxDurationMs ?? 15_000));

  const reason = promptEmpty
    ? "Write a prompt first — describe the shot, the script or the change you want."
    : !model
      ? "No model in your plan handles this mode yet. Pick another mode."
      : guard.reason;
  const canSubmit = !reason && !submitting;

  const submit = () => {
    if (!canSubmit || !model) return;
    onSubmit(
      {
        projectId,
        mode,
        prompt,
        modelId: model.id,
        aspect: config.aspect ? aspect : "9:16",
        durationMs: config.duration ? Math.min(durationMs, model.maxDurationMs) : 1,
        batchCount,
        startFrameAssetId: config.frame === "hidden" ? null : frameId,
      },
      cost,
    );
    setFlight({ id: Date.now(), cost });
    setPrompt([]);
  };

  const addReference = (asset: Asset) => {
    setPrompt((current) => [
      ...current,
      { type: "text", value: current.length === 0 ? "" : " " },
      { type: "mention", assetId: asset.id, label: mentionLabel(asset.name) },
    ]);
  };

  return (
    <div className="relative rounded-lg border border-ink-200 bg-surface p-3 shadow-elev-3">
      <AnimatePresence>
        {flight ? (
          <motion.span
            key={flight.id}
            initial={{ opacity: 1, x: 0, y: 0, scale: 1 }}
            animate={{ opacity: 0, x: 96, y: -220, scale: 0.85 }}
            transition={{ duration: dur.slow, ease: ease.out }}
            onAnimationComplete={() => setFlight(null)}
            aria-hidden="true"
            className="mono-sm pointer-events-none absolute right-4 top-2 rounded-pill bg-ink-950 px-2 py-1 text-white"
          >
            −{formatNumber(flight.cost)}
          </motion.span>
        ) : null}
      </AnimatePresence>

      <motion.div layout transition={transition.base} className="flex flex-col gap-3">
        <div className="flex items-start gap-3">
          {config.frame !== "hidden" ? (
            <StartFrame
              label={config.frameLabel}
              asset={frame}
              onSelect={(asset) => onFrameChange(asset.id)}
              onClear={() => onFrameChange(null)}
              onDropAssetId={onFrameChange}
            />
          ) : null}

          <div className="min-w-0 flex-1 pt-2">
            <MentionInput
              value={prompt}
              onValueChange={setPrompt}
              options={mentionOptions}
              placeholder={config.placeholder}
              ariaLabel="Prompt"
              onSubmit={submit}
            />
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-1">
            {config.templates ? (
              <TemplatePicker value={templateId} onValueChange={setTemplateId} />
            ) : null}
            {config.actor ? <ActorPicker value={actorId} onValueChange={setActorId} /> : null}
            {config.reference ? (
              <button
                type="button"
                onClick={() => setPickingReference(true)}
                className={cn(
                  "inline-flex h-control-md items-center gap-2 rounded-md px-3",
                  "text-body-sm text-ink-700 transition-ui duration-(--dur-instant)",
                  "hover:bg-ink-100 hover:text-ink-950",
                )}
              >
                <Icon glyph={IconImage} size={16} className="text-ink-400" />
                Reference
              </button>
            ) : null}
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <ModelPicker
              models={available}
              value={model?.id ?? ""}
              onValueChange={setModelId}
              className="w-32 lg:w-panel"
            />
            {config.aspect ? (
              <AspectRatioPicker value={aspect} onValueChange={setAspect} />
            ) : null}
            {config.duration ? (
              <DurationPicker
                value={durationMs}
                onValueChange={setDurationMs}
                options={durationOptions}
              />
            ) : null}
            <NumberStepper
              value={batchCount}
              onValueChange={setBatchCount}
              min={1}
              max={8}
              ariaLabel="batch count"
            />
            <span className="mono-sm hidden text-ink-400 sm:inline">
              {formatNumber(cost)} tokens
            </span>
            <Tooltip content={reason} disabledTrigger={Boolean(reason)}>
              <IconButton
                label={`Generate ${batchCount} ${batchCount === 1 ? "result" : "results"} for ${formatNumber(cost)} tokens`}
                glyph={IconGenerate}
                size="lg"
                shape="pill"
                variant="primary"
                disabled={Boolean(reason)}
                loading={submitting}
                onClick={submit}
              />
            </Tooltip>
          </div>
        </div>

        <p className="text-body-sm text-ink-400">{config.hint}</p>
      </motion.div>

      <AssetPickerDialog
        open={pickingReference}
        onOpenChange={setPickingReference}
        onSelect={addReference}
        title="Add a reference"
        description="References are inserted into the prompt as @ mentions you can move or delete."
      />
    </div>
  );
}
