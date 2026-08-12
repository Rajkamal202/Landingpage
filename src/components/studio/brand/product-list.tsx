"use client";

import * as React from "react";
import { useFieldArray, useFormContext } from "react-hook-form";
import type { Asset } from "@/lib/schemas";
import { Icon } from "@/components/icon";
import { IconDelete, IconEdit, IconImage, IconPackage, IconPlus } from "@/components/icons";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { IconButton } from "@/components/ui/icon-button";
import type { BrandFormValues, ProductValues } from "./brand-schema";
import { ProductDialog } from "./product-dialog";

/**
 * SPEC §8.3 — the saved-product list: name, image, description and URL, with
 * add, edit and remove. Products are the other half of what a user supplies,
 * and every template's product slot resolves against this list.
 */
export function ProductList({ assetById }: { assetById: ReadonlyMap<string, Asset> }) {
  const { control } = useFormContext<BrandFormValues>();
  const { fields, append, update, remove } = useFieldArray({
    control,
    name: "products",
    keyName: "key",
  });

  const [editing, setEditing] = React.useState<{ index: number; values: ProductValues } | null>(
    null,
  );
  const [adding, setAdding] = React.useState(false);

  const addProduct = (values: ProductValues) => {
    append({ ...values, id: `product-${Date.now().toString(36)}` });
  };

  return (
    <div className="flex flex-col gap-4">
      {fields.length === 0 ? (
        <EmptyState
          size="sm"
          glyph={IconPackage}
          title="No products saved yet"
          description="Add the products you make videos about once, and every template, script and bulk row can reach for them."
          action={
            <Button variant="primary" size="sm" iconStart={IconPlus} onClick={() => setAdding(true)}>
              Add a product
            </Button>
          }
        />
      ) : (
        <>
          <ul className="flex flex-col gap-3">
            {fields.map((product, index) => {
              const image = product.imageAssetId ? assetById.get(product.imageAssetId) : undefined;
              return (
                <li
                  key={product.key}
                  className="flex items-start gap-3 rounded-md border border-ink-200 bg-ink-50 p-3"
                >
                  <span className="grid size-12 shrink-0 place-items-center overflow-hidden rounded-sm border border-ink-200 bg-surface text-ink-400">
                    {image ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={image.src} alt="" className="size-full object-cover" />
                    ) : (
                      <Icon glyph={IconImage} size={16} />
                    )}
                  </span>

                  <div className="flex min-w-0 flex-1 flex-col gap-1">
                    <p className="text-body-sm font-medium text-ink-950">{product.name}</p>
                    <p className="text-body-sm text-ink-500">{product.description}</p>
                    <p className="mono-sm truncate text-ink-500">{product.url}</p>
                  </div>

                  <div className="flex shrink-0 items-center gap-1">
                    <IconButton
                      label={`Edit ${product.name}`}
                      glyph={IconEdit}
                      size="sm"
                      onClick={() =>
                        setEditing({
                          index,
                          values: {
                            id: product.id,
                            name: product.name,
                            description: product.description,
                            url: product.url,
                            imageAssetId: product.imageAssetId,
                          },
                        })
                      }
                    />
                    <IconButton
                      label={`Remove ${product.name}`}
                      glyph={IconDelete}
                      size="sm"
                      variant="danger"
                      onClick={() => remove(index)}
                    />
                  </div>
                </li>
              );
            })}
          </ul>

          <Button
            variant="secondary"
            size="sm"
            iconStart={IconPlus}
            className="self-start"
            onClick={() => setAdding(true)}
          >
            Add a product
          </Button>
        </>
      )}

      <ProductDialog
        open={adding}
        onOpenChange={setAdding}
        initial={null}
        assetById={assetById}
        onSubmit={addProduct}
      />

      <ProductDialog
        open={editing !== null}
        onOpenChange={(open) => {
          if (!open) setEditing(null);
        }}
        initial={editing?.values ?? null}
        assetById={assetById}
        onSubmit={(values) => {
          if (editing) update(editing.index, values);
          setEditing(null);
        }}
      />
    </div>
  );
}
