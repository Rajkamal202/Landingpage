"use client";

import * as React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { z } from "zod";
import { getAccount } from "@/lib/api/billing";
import { queryKeys } from "@/lib/api/keys";
import type { Account } from "@/lib/schemas";
import { IconHidden, IconUser, IconVisible } from "@/components/icons";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { Field } from "@/components/ui/field";
import { IconButton } from "@/components/ui/icon-button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "@/components/ui/toast";
import { LocalOnlyNote, SettingsCard, SettingsSection } from "./settings-section";

/**
 * SPEC §7.2 — account details. Mock does not mean unvalidated: the rules are a
 * zod schema, the messages name the cause and the fix (SPEC §12), and `Field`
 * reserves the message row so nothing moves when validation fires.
 *
 * What is mocked is only the persistence. `src/lib/api/billing.ts` reads an
 * account but has no way to write one, so a save updates the cached account —
 * every screen reading it changes immediately — and the card says plainly that
 * it goes no further than this device.
 */
const profileSchema = z.object({
  name: z.string().trim().min(2, "Tell us what to call you — a first name is plenty."),
  email: z.email("Enter a full email address, like you@company.com."),
  company: z
    .string()
    .trim()
    .min(1, "Name the company or brand this account belongs to. It appears on invoices."),
});

type ProfileValues = z.infer<typeof profileSchema>;

const passwordSchema = z
  .object({
    current: z.string().min(1, "Enter the password you use now so we know it's you."),
    next: z
      .string()
      .min(8, "Use at least eight characters. A short phrase is easier to remember than a word."),
    confirm: z.string(),
  })
  .refine((values) => values.next === values.confirm, {
    path: ["confirm"],
    message: "These two don't match. Retype the new password to confirm it.",
  });

type PasswordValues = z.infer<typeof passwordSchema>;

export function AccountScreen() {
  const account = useQuery({ queryKey: queryKeys.billing.account, queryFn: getAccount });

  return (
    <SettingsSection
      title="Account"
      description="Who you are on this workspace, and how you sign in."
    >
      {account.isPending ? (
        <>
          <Skeleton className="h-panel w-full rounded-lg" />
          <Skeleton className="h-panel w-full rounded-lg" />
        </>
      ) : account.isError || account.data === undefined ? (
        <EmptyState
          glyph={IconUser}
          title="Your account didn't load"
          description="The request came back empty-handed. Nothing was changed — reload to see your details."
          action={
            <Button variant="primary" onClick={() => void account.refetch()}>
              Reload account
            </Button>
          }
        />
      ) : (
        <>
          <ProfileCard account={account.data} />
          <PasswordCard />
        </>
      )}
    </SettingsSection>
  );
}

function ProfileCard({ account }: { account: Account }) {
  const queryClient = useQueryClient();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isDirty },
  } = useForm<ProfileValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: { name: account.name, email: account.email, company: account.company },
    mode: "onSubmit",
  });

  const submit = handleSubmit((values) => {
    const next: Account = { ...account, ...values };
    queryClient.setQueryData<Account>(queryKeys.billing.account, next);
    reset(values);
    toast.success("Account updated", {
      description: `You're ${next.name} at ${next.company} from now on.`,
    });
  });

  return (
    <SettingsCard title="Your details" description="Shown on invoices and beside your comments.">
      <form onSubmit={(event) => void submit(event)} noValidate className="flex flex-col gap-2">
        <Field label="Full name" error={errors.name?.message}>
          <Input autoComplete="name" placeholder="Sam Okafor" {...register("name")} />
        </Field>

        <Field
          label="Email"
          hint="Invitations, render notices and receipts all go here."
          error={errors.email?.message}
        >
          <Input
            type="email"
            autoComplete="email"
            placeholder="you@company.com"
            {...register("email")}
          />
        </Field>

        <Field label="Company" error={errors.company?.message}>
          <Input autoComplete="organization" placeholder="Glowlab" {...register("company")} />
        </Field>

        <div className="mt-2 flex items-center gap-3">
          <Button type="submit" variant="primary" disabled={!isDirty}>
            Save details
          </Button>
          {isDirty ? (
            <Button
              variant="ghost"
              onClick={() =>
                reset({ name: account.name, email: account.email, company: account.company })
              }
            >
              Discard changes
            </Button>
          ) : null}
        </div>
      </form>

      <LocalOnlyNote>
        This build has no server behind it. Your details stay on this device for the session.
      </LocalOnlyNote>
    </SettingsCard>
  );
}

function PasswordCard() {
  const [revealed, setRevealed] = React.useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<PasswordValues>({
    resolver: zodResolver(passwordSchema),
    defaultValues: { current: "", next: "", confirm: "" },
    mode: "onSubmit",
  });

  const submit = handleSubmit(() => {
    reset({ current: "", next: "", confirm: "" });
    toast.success("Password updated", {
      description: "Use the new one the next time you log in.",
    });
  });

  return (
    <SettingsCard title="Password" description="Change it whenever you like — no waiting period.">
      <form onSubmit={(event) => void submit(event)} noValidate className="flex flex-col gap-2">
        <Field label="Current password" error={errors.current?.message}>
          <Input
            type="password"
            autoComplete="current-password"
            placeholder="••••••••"
            {...register("current")}
          />
        </Field>

        <Field
          label="New password"
          hint="At least eight characters."
          error={errors.next?.message}
        >
          <Input
            type={revealed ? "text" : "password"}
            autoComplete="new-password"
            placeholder="••••••••"
            suffix={
              <IconButton
                label={revealed ? "Hide password" : "Show password"}
                glyph={revealed ? IconHidden : IconVisible}
                size="sm"
                onClick={() => setRevealed((value) => !value)}
              />
            }
            {...register("next")}
          />
        </Field>

        <Field label="Confirm new password" error={errors.confirm?.message}>
          <Input
            type={revealed ? "text" : "password"}
            autoComplete="new-password"
            placeholder="••••••••"
            {...register("confirm")}
          />
        </Field>

        <Button type="submit" variant="primary" className="mt-2 self-start">
          Update password
        </Button>
      </form>

      <LocalOnlyNote>
        Sign-in is mocked in this build, so nothing here is sent anywhere or stored.
      </LocalOnlyNote>
    </SettingsCard>
  );
}
