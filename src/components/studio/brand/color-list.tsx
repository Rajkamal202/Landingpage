"use client";

import { Controller, useFieldArray, useFormContext } from "react-hook-form";
import { IconDelete, IconPlus } from "@/components/icons";
import { Button } from "@/components/ui/button";
import { ColorSwatch } from "@/components/ui/color-swatch";
import { IconButton } from "@/components/ui/icon-button";
import { Input } from "@/components/ui/input";
import type { BrandFormValues } from "./brand-schema";

/**
 * The brand palette. Each row is a colour well plus the name the user will
 * recognise it by — "Signature" reads better in a caption picker than
 * "#3D6FF0" does, which is the whole reason the name is a field.
 */
export function ColorList() {
  const {
    control,
    register,
    formState: { errors },
  } = useFormContext<BrandFormValues>();

  const { fields, append, remove } = useFieldArray({
    control,
    name: "colors",
    keyName: "key",
  });

  const addColor = () => {
    const last = fields[fields.length - 1];
    append({
      id: `brand-color-${Date.now().toString(36)}`,
      name: `Colour ${fields.length + 1}`,
      // token-lint-disable-next-line no-raw-hex — a new swatch has to open on
      // some value before the user picks one, and a brand colour is user
      // content rather than styling (DECISIONS D16). Copying the previous
      // swatch keeps the palette coherent when there is one to copy.
      hex: last?.hex ?? "#FFFFFF",
    });
  };

  const listError = errors.colors?.root?.message ?? errors.colors?.message;

  return (
    <div className="flex flex-col gap-3">
      <ul className="flex flex-col gap-3">
        {fields.map((field, index) => {
          const nameError = errors.colors?.[index]?.name?.message;
          const hexError = errors.colors?.[index]?.hex?.message;
          return (
            <li key={field.key} className="flex flex-col gap-1">
              <div className="flex items-center gap-2">
                <Controller
                  control={control}
                  name={`colors.${index}.hex`}
                  render={({ field: swatch }) => (
                    <ColorSwatch
                      value={swatch.value}
                      onValueChange={swatch.onChange}
                      label={`Colour ${index + 1} value`}
                      size="sm"
                    />
                  )}
                />
                <Input
                  size="sm"
                  aria-label={`Colour ${index + 1} name`}
                  invalid={Boolean(nameError)}
                  containerClassName="min-w-0 flex-1"
                  {...register(`colors.${index}.name`)}
                />
                <IconButton
                  label={`Remove colour ${index + 1}`}
                  glyph={IconDelete}
                  size="sm"
                  variant="danger"
                  onClick={() => remove(index)}
                />
              </div>
              {nameError ?? hexError ? (
                <p role="alert" className="text-body-sm text-danger">
                  {nameError ?? hexError}
                </p>
              ) : null}
            </li>
          );
        })}
      </ul>

      {listError ? (
        <p role="alert" className="text-body-sm text-danger">
          {listError}
        </p>
      ) : null}

      <Button
        variant="secondary"
        size="sm"
        iconStart={IconPlus}
        className="self-start"
        onClick={addColor}
      >
        Add a colour
      </Button>
    </div>
  );
}
