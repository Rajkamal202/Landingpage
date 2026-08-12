"use client";

import * as React from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { listAssets } from "@/lib/api/assets";
import { queryKeys } from "@/lib/api/keys";
import { createProject } from "@/lib/api/projects";
import { getTemplate, listIndustries, listTemplates, type TemplateFilter } from "@/lib/api/templates";
import { useSearchParamEnum, useSearchParamState } from "@/lib/hooks/use-search-param-state";
import type { AspectRatio, Template, TemplateCategory } from "@/lib/schemas";
import { TEMPLATE_CATEGORY_LABEL } from "@/lib/schemas";
import { IconSearch, IconTemplate } from "@/components/icons";
import { Button, ButtonLink } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { Input } from "@/components/ui/input";
import { toast } from "@/components/ui/toast";
import { AppPage } from "../app-page";
import { ANY, FilterSelect } from "../filter-select";
import { useOpenProject } from "../use-open-project";
import { DURATION_BUCKETS, DURATION_LABEL, inDurationBucket, type DurationBucket } from "./labels";
import { TemplateCard, TemplateCardSkeleton } from "./template-card";
import { TemplateDetailSheet } from "./template-detail-sheet";

/**
 * SPEC §8.3 — the template browser. Category, aspect, duration and industry
 * all live in search params, so a filtered shelf ("every fast 9:16 listicle
 * for skincare") is a link somebody can send a colleague (SPEC §10).
 */
const CATEGORY_VALUES = [
  "product-demo",
  "ugc-testimonial",
  "listicle",
  "before-after",
  "unboxing",
  "founder-story",
] as const satisfies readonly TemplateCategory[];

const CATEGORY_OPTIONS = CATEGORY_VALUES.map((value) => ({
  value,
  label: TEMPLATE_CATEGORY_LABEL[value],
}));

const ASPECT_VALUES = ["9:16", "4:5", "1:1", "16:9"] as const satisfies readonly AspectRatio[];

const ASPECT_OPTIONS = [
  { value: "9:16", label: "9:16 vertical" },
  { value: "4:5", label: "4:5 portrait" },
  { value: "1:1", label: "1:1 square" },
  { value: "16:9", label: "16:9 wide" },
] as const;

const DURATION_OPTIONS = DURATION_BUCKETS.map((value) => ({
  value,
  label: DURATION_LABEL[value],
}));

const GRID = "grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5";

export function TemplatesScreen() {
  const queryClient = useQueryClient();
  const openProject = useOpenProject();

  const industries = React.useMemo(() => listIndustries(), []);

  const [category, setCategory] = useSearchParamEnum<TemplateCategory | typeof ANY>(
    "category",
    [ANY, ...CATEGORY_VALUES],
    ANY,
  );
  const [aspect, setAspect] = useSearchParamEnum<AspectRatio | typeof ANY>(
    "aspect",
    [ANY, ...ASPECT_VALUES],
    ANY,
  );
  const [duration, setDuration] = useSearchParamEnum<DurationBucket | typeof ANY>(
    "duration",
    [ANY, ...DURATION_BUCKETS],
    ANY,
  );
  const [industryParam, setIndustry] = useSearchParamState<string>("industry", {
    defaultValue: ANY,
    serialize: (value) => (value === ANY ? null : value),
  });
  const [query, setQuery] = useSearchParamState<string>("q", {
    defaultValue: "",
    serialize: (value) => (value.trim() ? value : null),
  });
  const [openId, setOpenId] = useSearchParamState<string>("template", {
    defaultValue: "",
    mode: "push",
    serialize: (value) => value || null,
  });

  // A hand-edited or stale `?industry=` must not leave the select showing an
  // empty trigger, so an unknown value reads as no filter at all.
  const industry = industries.includes(industryParam) ? industryParam : ANY;

  const filter = React.useMemo<TemplateFilter>(
    () => ({
      ...(category === ANY ? {} : { category }),
      ...(aspect === ANY ? {} : { aspect }),
      ...(industry === ANY ? {} : { industry }),
      ...(query.trim() ? { query: query.trim() } : {}),
    }),
    [category, aspect, industry, query],
  );

  const templates = useQuery({
    queryKey: [...queryKeys.templates.list, filter] as const,
    queryFn: () => listTemplates(filter),
  });

  const assets = useQuery({ queryKey: queryKeys.assets.list(), queryFn: () => listAssets() });

  const assetById = React.useMemo(
    () => new Map((assets.data ?? []).map((asset) => [asset.id, asset])),
    [assets.data],
  );

  // Duration is bucketed here because `TemplateFilter` has no range parameter;
  // everything else is filtered by the API.
  const items = React.useMemo(() => {
    const list = templates.data ?? [];
    return duration === ANY ? list : list.filter((item) => inDurationBucket(item, duration));
  }, [templates.data, duration]);

  const filtered =
    category !== ANY ||
    aspect !== ANY ||
    duration !== ANY ||
    industry !== ANY ||
    query.trim().length > 0;

  const clearFilters = () => {
    setCategory(ANY);
    setAspect(ANY);
    setDuration(ANY);
    setIndustry(ANY);
    setQuery("");
  };

  const inList = items.find((template) => template.id === openId);
  // A deep link can name a template the current filters exclude, so the sheet
  // falls back to fetching it rather than opening empty.
  const fallback = useQuery({
    queryKey: queryKeys.templates.detail(openId),
    queryFn: () => getTemplate(openId),
    enabled: openId !== "" && inList === undefined,
  });
  const selected = inList ?? (openId ? fallback.data : undefined);

  const use = useMutation({
    mutationFn: (template: Template) => createProject({ name: template.name, kind: "video" }),
    onSuccess: (project, template) => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.projects.all });
      toast.success("Template used", {
        description: `${template.name} is open in the timeline, ready for your product and script.`,
      });
      // `?template=` is left in place deliberately: coming back lands on the
      // browser with this template still open, which is what URL-as-state is
      // for (SPEC §10).
      openProject(project);
    },
    onError: (_error, template) => {
      toast.error("Couldn't start that project", {
        description: `${template.name} wasn't applied and nothing was saved. Try again in a moment.`,
      });
    },
  });

  return (
    <AppPage
      title="Templates"
      description="Formats that already work, broken down so you can see the structure before you commit."
      actions={
        <ButtonLink href="/app/import" variant="secondary">
          Clone a video instead
        </ButtonLink>
      }
      toolbar={
        <div className="flex flex-wrap items-center gap-3">
          <Input
            iconStart={IconSearch}
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search templates"
            aria-label="Search templates"
            containerClassName="min-w-0 flex-1 sm:max-w-panel"
          />
          <FilterSelect
            label="Filter by category"
            anyLabel="All categories"
            value={category}
            onValueChange={setCategory}
            options={CATEGORY_OPTIONS}
            className="w-32"
          />
          <FilterSelect
            label="Filter by aspect"
            anyLabel="Any aspect"
            value={aspect}
            onValueChange={setAspect}
            options={ASPECT_OPTIONS}
            className="w-32"
          />
          <FilterSelect
            label="Filter by duration"
            anyLabel="Any length"
            value={duration}
            onValueChange={setDuration}
            options={DURATION_OPTIONS}
            className="w-32"
          />
          <FilterSelect
            label="Filter by industry"
            anyLabel="Every industry"
            value={industry}
            onValueChange={setIndustry}
            options={industries.map((name) => ({ value: name, label: name }))}
            className="w-32"
          />
        </div>
      }
    >
      {templates.isPending ? (
        <ul className={GRID}>
          {Array.from({ length: 10 }, (_, index) => (
            <li key={index}>
              <TemplateCardSkeleton />
            </li>
          ))}
        </ul>
      ) : templates.isError ? (
        <EmptyState
          glyph={IconTemplate}
          title="Templates didn't load"
          description="The request came back empty-handed. Reload to see the full set again."
          action={
            <Button variant="primary" onClick={() => void templates.refetch()}>
              Reload templates
            </Button>
          }
        />
      ) : items.length === 0 && filtered ? (
        <EmptyState
          glyph={IconSearch}
          title="Nothing matches those filters"
          description="No template is that category, aspect and length at once. Loosen one and try again."
          action={
            <Button variant="secondary" onClick={clearFilters}>
              Clear filters
            </Button>
          }
        />
      ) : items.length === 0 ? (
        <EmptyState
          size="lg"
          glyph={IconTemplate}
          title="No templates yet"
          description="Templates arrive with every release. Until then, paste a link to something that already works and Vireo will rebuild it as an editable project."
          action={<ButtonLink href="/app/import">Clone a video</ButtonLink>}
        />
      ) : (
        <ul className={GRID}>
          {items.map((template) => (
            <li key={template.id}>
              <TemplateCard
                template={template}
                preview={assetById.get(template.previewAssetId)}
                onOpen={() => setOpenId(template.id)}
              />
            </li>
          ))}
        </ul>
      )}

      <TemplateDetailSheet
        template={selected}
        preview={selected ? assetById.get(selected.previewAssetId) : undefined}
        open={openId !== ""}
        onOpenChange={(next) => {
          if (!next) setOpenId("");
        }}
        onUse={(template) => use.mutate(template)}
        using={use.isPending}
      />
    </AppPage>
  );
}
