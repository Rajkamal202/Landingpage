import type { Generation, GenerationRequest, Model } from "@/lib/schemas";
import { GENERATIONS } from "@/lib/fixtures/generations";
import { MODELS } from "@/lib/fixtures/models";
import { VIDEO_ASSETS } from "@/lib/fixtures/assets";
import { ApiError, clone, delay, maybeFail, ticker } from "./client";

let generations: Generation[] = clone([...GENERATIONS]);

export async function listModels(): Promise<Model[]> {
  await delay(40, 120);
  return clone([...MODELS]);
}

export async function listGenerations(projectId: string): Promise<Generation[]> {
  await delay(140, 340);
  maybeFail("Loading generations");
  return clone(
    generations
      .filter((generation) => generation.projectId === projectId)
      .sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt)),
  );
}

export interface GenerationEvent {
  generation: Generation;
  done: boolean;
}

/**
 * SPEC §8.2: placeholder tiles appear immediately, then fill in. The generator
 * yields the placeholder synchronously on the first tick so the grid never has
 * a frame where the user pressed submit and nothing happened.
 */
export async function* createGeneration(
  request: GenerationRequest,
): AsyncGenerator<GenerationEvent, void, void> {
  const model = MODELS.find((candidate) => candidate.id === request.modelId);
  if (!model) {
    throw new ApiError("That model is no longer available", {
      code: "model-missing",
      fix: "Pick another model from the list and run it again.",
    });
  }
  maybeFail("Starting the generation");

  const created: Generation[] = Array.from({ length: request.batchCount }, (_, index) => ({
    id: `gen-${Math.random().toString(36).slice(2, 9)}-${index}`,
    projectId: request.projectId,
    mode: request.mode,
    prompt: clone([...request.prompt]),
    modelId: request.modelId,
    aspect: request.aspect,
    durationMs: request.durationMs,
    status: "queued",
    progress: 0,
    assetId: null,
    startFrameAssetId: request.startFrameAssetId,
    error: null,
    tokenCost: model.tokensPerGeneration,
    favorite: false,
    createdAt: new Date().toISOString(),
  }));

  generations = [...created, ...generations];
  for (const generation of created) yield { generation: clone(generation), done: false };

  // Each item in the batch runs on its own clock, staggered, so the grid fills
  // in progressively rather than snapping from all-empty to all-done.
  for (const [index, generation] of created.entries()) {
    const totalMs = 2600 + index * 700;
    for await (const fraction of ticker(totalMs, 120)) {
      generation.status = fraction >= 1 ? "ready" : "generating";
      generation.progress = Math.round(fraction * 100);
      if (fraction >= 1) {
        const asset = VIDEO_ASSETS[Math.floor(Math.random() * VIDEO_ASSETS.length)];
        generation.assetId = asset?.id ?? null;
      }
      yield { generation: clone(generation), done: fraction >= 1 };
    }
  }
}

export async function toggleGenerationFavorite(id: string): Promise<Generation> {
  await delay(70, 160);
  const generation = generations.find((candidate) => candidate.id === id);
  if (!generation) throw new ApiError("That generation is gone");
  generation.favorite = !generation.favorite;
  return clone(generation);
}

export async function deleteGeneration(id: string): Promise<void> {
  await delay(100, 220);
  generations = generations.filter((generation) => generation.id !== id);
}

export async function retryGeneration(id: string): Promise<Generation> {
  await delay(160, 320);
  const generation = generations.find((candidate) => candidate.id === id);
  if (!generation) throw new ApiError("That generation is gone");
  generation.status = "queued";
  generation.progress = 0;
  generation.error = null;
  return clone(generation);
}
