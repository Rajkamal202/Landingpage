"use client";

import { Controller, FormProvider, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { saveBrandKit } from "@/lib/api/assets";
import { queryKeys } from "@/lib/api/keys";
import type { Asset, BrandKit } from "@/lib/schemas";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/components/ui/toast";
import { Tooltip } from "@/components/ui/tooltip";
import { formatEdited } from "../time";
import { BrandSection } from "./brand-section";
import {
  brandFormSchema,
  FONT_OPTIONS,
  toBrandKit,
  toFormValues,
  type BrandFormValues,
} from "./brand-schema";
import { ColorList } from "./color-list";
import { LogoField } from "./logo-field";
import { ProductList } from "./product-list";

/**
 * SPEC §8.3 — the brand kit, saved in one action.
 *
 * The save is optimistic: the cached kit updates on the click, so every screen
 * reading the brand kit reflects the change immediately, and a failure puts
 * the previous kit back and says so rather than leaving the user guessing
 * which version is live.
 */
export function BrandForm({
  kit,
  assetById,
}: {
  kit: BrandKit;
  assetById: ReadonlyMap<string, Asset>;
}) {
  const queryClient = useQueryClient();

  const form = useForm<BrandFormValues>({
    resolver: zodResolver(brandFormSchema),
    defaultValues: toFormValues(kit),
    mode: "onSubmit",
  });

  const {
    register,
    control,
    formState: { errors, isDirty },
  } = form;

  const save = useMutation({
    mutationFn: (next: BrandKit) => saveBrandKit(next),
    onMutate: async (next) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.assets.brandKit });
      const previous = queryClient.getQueryData<BrandKit>(queryKeys.assets.brandKit);
      queryClient.setQueryData<BrandKit>(queryKeys.assets.brandKit, next);
      return { previous };
    },
    onError: (_error, _next, context) => {
      if (context?.previous) {
        queryClient.setQueryData(queryKeys.assets.brandKit, context.previous);
      }
      toast.error("Your brand kit didn't save", {
        description: "Nothing reached the server and your edits are still on screen. Press Save brand kit again.",
      });
    },
    onSuccess: (saved) => {
      form.reset(toFormValues(saved));
      toast.success("Brand kit saved", {
        description: `Every new project starts from ${saved.name} now.`,
      });
    },
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.assets.brandKit });
    },
  });

  const submit = form.handleSubmit((values) => save.mutate(toBrandKit(kit, values)));

  const logoId = form.watch("logoAssetId");

  return (
    <FormProvider {...form}>
      <form onSubmit={(event) => void submit(event)} noValidate className="flex flex-col gap-6">
        <div className="grid items-start gap-6 lg:grid-cols-2">
          <BrandSection
            title="Identity"
            description="The name on the kit, and the mark that ends up in every export."
          >
            <Field label="Brand name" error={errors.name?.message}>
              <Input placeholder="Glowlab" {...register("name")} />
            </Field>

            <Controller
              control={control}
              name="logoAssetId"
              render={({ field }) => (
                <LogoField
                  logo={logoId ? assetById.get(logoId) : undefined}
                  onChange={(next) => field.onChange(next)}
                />
              )}
            />
          </BrandSection>

          <BrandSection
            title="Colours"
            description="Captions, callouts and backgrounds are drawn from this palette."
          >
            <ColorList />
          </BrandSection>

          <BrandSection
            title="Type"
            description="The faces burned into on-screen text. Both render on every device."
          >
            <div className="flex flex-col gap-4">
              <Controller
                control={control}
                name="headingFont"
                render={({ field }) => (
                  <div className="flex flex-col gap-2">
                    <span className="text-label text-ink-700">Heading font</span>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <SelectTrigger aria-label="Heading font">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {FONT_OPTIONS.map((option) => (
                          <SelectItem key={option.value} value={option.value} hint={option.hint}>
                            {option.value}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <p className="text-body-sm text-ink-500">Hooks, titles and end cards.</p>
                  </div>
                )}
              />

              <Controller
                control={control}
                name="bodyFont"
                render={({ field }) => (
                  <div className="flex flex-col gap-2">
                    <span className="text-label text-ink-700">Body font</span>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <SelectTrigger aria-label="Body font">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {FONT_OPTIONS.map((option) => (
                          <SelectItem key={option.value} value={option.value} hint={option.hint}>
                            {option.value}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <p className="text-body-sm text-ink-500">Captions and everything smaller.</p>
                  </div>
                )}
              />
            </div>
          </BrandSection>

          <BrandSection
            title="Tone of voice"
            description="The rule every generated script is written against."
          >
            <Field
              label="How the brand sounds"
              hint="Plain instructions work best — what you say, and what you never say."
              error={errors.toneOfVoice?.message}
            >
              <Textarea
                autoGrow
                minRows={4}
                maxRows={10}
                placeholder="Plain and specific. No superlatives, no exclamation marks, no promises we can't measure."
                {...register("toneOfVoice")}
              />
            </Field>
          </BrandSection>
        </div>

        <BrandSection
          title="Saved products"
          description="What the videos are about. Name, image, one line and a link is enough."
        >
          <ProductList assetById={assetById} />
        </BrandSection>

        <div className="sticky bottom-0 flex flex-wrap items-center gap-3 rounded-lg border border-ink-200 bg-surface p-3 shadow-elev-2">
          <p className="text-body-sm text-ink-500">
            {isDirty ? "You have unsaved changes." : `Saved ${formatEdited(kit.updatedAt)}.`}
          </p>
          <div className="ml-auto flex items-center gap-2">
            {isDirty ? (
              <Button variant="ghost" onClick={() => form.reset(toFormValues(kit))}>
                Discard changes
              </Button>
            ) : null}
            <Tooltip
              content={isDirty ? undefined : "Nothing has changed since the last save."}
              disabledTrigger={!isDirty}
            >
              <Button type="submit" variant="primary" loading={save.isPending} disabled={!isDirty}>
                Save brand kit
              </Button>
            </Tooltip>
          </div>
        </div>
      </form>
    </FormProvider>
  );
}
