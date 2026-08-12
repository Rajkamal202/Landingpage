"use client";

import * as React from "react";
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

export interface RenameDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: string;
  label: string;
  initialValue: string;
  onRename: (name: string) => void;
}

/**
 * One rename affordance for projects and assets. The validation message names
 * the cause and the fix, and the field reserves its message line so the dialog
 * does not resize when the message appears.
 */
export function RenameDialog({
  open,
  onOpenChange,
  title,
  description,
  label,
  initialValue,
  onRename,
}: RenameDialogProps) {
  const [value, setValue] = React.useState(initialValue);
  const [error, setError] = React.useState<string | undefined>(undefined);

  React.useEffect(() => {
    if (open) {
      setValue(initialValue);
      setError(undefined);
    }
  }, [open, initialValue]);

  const submit = (event: React.FormEvent) => {
    event.preventDefault();
    const next = value.trim();
    if (next.length === 0) {
      setError("A name can't be blank. Type something you'll recognise in the tab strip.");
      return;
    }
    if (next.length > 80) {
      setError(`That's ${next.length} characters. Keep it under 80 so it fits in a tab.`);
      return;
    }
    onRename(next);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent size="sm" aria-describedby="rename-description">
        <form onSubmit={submit}>
          <DialogHeader>
            <DialogTitle>{title}</DialogTitle>
            <DialogDescription id="rename-description">{description}</DialogDescription>
          </DialogHeader>

          <Field label={label} error={error}>
            <Input
              value={value}
              autoFocus
              onChange={(event) => {
                setValue(event.target.value);
                if (error) setError(undefined);
              }}
            />
          </Field>

          <DialogFooter>
            <Button variant="ghost" type="button" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button variant="primary" type="submit">
              Save name
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
