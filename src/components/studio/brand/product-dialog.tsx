"use client";

import * as React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import type { Asset } from "@/lib/schemas";
import { IconImage } from "@/components/icons";
import { Icon } from "@/components/icon";
import { AssetPickerDialog } from "@/components/ui/asset-picker-dialog";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { productSchema, type ProductValues } from "./brand-schema";

/**
 * Add and edit share one dialog — the fields are identical, and two nearly
 * identical dialogs is how the "add" copy and the "edit" copy end up
 * disagreeing about what a product is.
 */
export interface ProductDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Null adds a new product; a value edits that one. */
  initial: ProductValues | null;
  assetById: ReadonlyMap<string, Asset>;
  onSubmit: (values: ProductValues) => void;
}

const BLANK: ProductValues = { id: "", name: "", description: "", url: "", imageAssetId: null };

export function ProductDialog({
  open,
  onOpenChange,
  initial,
  assetById,
  onSubmit,
}: ProductDialogProps) {
  const [picking, setPicking] = React.useState(false);
  const editing = initial !== null && initial.id !== "";

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors },
  } = useForm<ProductValues>({
    resolver: zodResolver(productSchema),
    defaultValues: initial ?? BLANK,
    mode: "onSubmit",
  });

  React.useEffect(() => {
    if (open) reset(initial ?? BLANK);
  }, [open, initial, reset]);

  const imageAssetId = watch("imageAssetId");
  const image = imageAssetId ? assetById.get(imageAssetId) : undefined;

  const submit = handleSubmit((values) => {
    onSubmit(values);
    onOpenChange(false);
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent size="md" aria-describedby="product-dialog-description">
        <form onSubmit={(event) => void submit(event)} noValidate>
          <DialogHeader>
            <DialogTitle>{editing ? "Edit product" : "Add a product"}</DialogTitle>
            <DialogDescription id="product-dialog-description">
              Saved products fill the product slot in templates, the bulk editor and any script
              Vireo writes for you.
            </DialogDescription>
          </DialogHeader>

          <div className="flex flex-col gap-2">
            <Field label="Product name" error={errors.name?.message}>
              <Input placeholder="Hydrating serum" {...register("name")} />
            </Field>

            <Field
              label="Description"
              hint="What it is and who it's for, in one line."
              error={errors.description?.message}
            >
              <Textarea
                autoGrow
                minRows={2}
                maxRows={4}
                placeholder="A lightweight hyaluronic serum for morning use. 30ml."
                {...register("description")}
              />
            </Field>

            <Field
              label="Product page"
              hint="Used for the link in captions and end cards."
              error={errors.url?.message}
            >
              <Input type="url" placeholder="https://yourbrand.com/products/serum" {...register("url")} />
            </Field>

            <Field label="Product image" hint="Shown in the library picker and dropped into scenes.">
              <div className="flex items-center gap-3">
                <span className="grid size-16 shrink-0 place-items-center overflow-hidden rounded-md border border-ink-200 bg-ink-50 text-ink-400">
                  {image ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={image.src} alt="" className="size-full object-cover" />
                  ) : (
                    <Icon glyph={IconImage} size={20} />
                  )}
                </span>
                <Button variant="secondary" size="sm" onClick={() => setPicking(true)}>
                  {image ? "Change image" : "Choose image"}
                </Button>
                {image ? (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setValue("imageAssetId", null, { shouldDirty: true })}
                  >
                    Clear
                  </Button>
                ) : null}
              </div>
            </Field>
          </div>

          <DialogFooter>
            <Button variant="ghost" type="button" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button variant="primary" type="submit">
              {editing ? "Save product" : "Add product"}
            </Button>
          </DialogFooter>
        </form>

        <AssetPickerDialog
          open={picking}
          onOpenChange={setPicking}
          kind="image"
          title="Choose a product image"
          description="Pick the still you want scenes and thumbnails to use for this product."
          onSelect={(asset) => setValue("imageAssetId", asset.id, { shouldDirty: true })}
        />
      </DialogContent>
    </Dialog>
  );
}
