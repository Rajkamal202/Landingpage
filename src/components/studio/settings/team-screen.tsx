"use client";

import * as React from "react";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { z } from "zod";
import { inviteTeamMember, listTeam, removeTeamMember } from "@/lib/api/billing";
import { ApiError } from "@/lib/api/client";
import { queryKeys } from "@/lib/api/keys";
import type { TeamMember } from "@/lib/schemas";
import { IconDelete, IconTeam } from "@/components/icons";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { Field } from "@/components/ui/field";
import { IconButton } from "@/components/ui/icon-button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "@/components/ui/toast";
import { Tooltip } from "@/components/ui/tooltip";
import { ConfirmDialog } from "../confirm-dialog";
import { LocalOnlyNote, SettingsCard, SettingsSection } from "./settings-section";

type Role = TeamMember["role"];

const ROLE_LABEL: Record<Role, string> = {
  owner: "Owner",
  editor: "Editor",
  viewer: "Viewer",
};

const ROLE_HINT: Record<Role, string> = {
  owner: "Billing and members",
  editor: "Create, edit and export",
  viewer: "Watch and comment",
};

/** Ownership transfers are a different, deliberate flow — not a select. */
const ASSIGNABLE_ROLES = ["editor", "viewer"] as const;

const inviteSchema = z.object({
  email: z.email("Enter a full email address, like teammate@company.com."),
  role: z.enum(ASSIGNABLE_ROLES),
});

type InviteValues = z.infer<typeof inviteSchema>;

export function TeamScreen() {
  const queryClient = useQueryClient();
  const [removing, setRemoving] = React.useState<TeamMember | null>(null);

  const team = useQuery({ queryKey: queryKeys.billing.team, queryFn: listTeam });

  const patch = (update: (list: TeamMember[]) => TeamMember[]) => {
    const previous = queryClient.getQueryData<TeamMember[]>(queryKeys.billing.team);
    queryClient.setQueryData<TeamMember[]>(queryKeys.billing.team, (old) =>
      update(old ?? []),
    );
    return previous;
  };

  const {
    register,
    handleSubmit,
    control,
    reset,
    setError,
    formState: { errors },
  } = useForm<InviteValues>({
    resolver: zodResolver(inviteSchema),
    defaultValues: { email: "", role: "editor" },
    mode: "onSubmit",
  });

  const invite = useMutation({
    mutationFn: (values: InviteValues) => inviteTeamMember(values.email, values.role),
    onSuccess: (member) => {
      patch((list) => [...list, member]);
      reset({ email: "", role: "editor" });
      toast.success("Invite sent", {
        description: `${member.email} can join as ${ROLE_LABEL[member.role].toLowerCase()} from their inbox.`,
      });
    },
    onError: (error) => {
      // The API already words this one exactly right — who it is, and what to
      // do instead of inviting them again (SPEC §12).
      if (error instanceof ApiError) {
        setError("email", { message: `${error.message}. ${error.fix}` });
        return;
      }
      toast.error("That invite didn't send", {
        description: "Nobody was added. Check the address and try again.",
      });
    },
  });

  const remove = useMutation({
    mutationFn: (member: TeamMember) => removeTeamMember(member.id),
    onMutate: (member) => ({ previous: patch((list) => list.filter((m) => m.id !== member.id)) }),
    onError: (_error, member, context) => {
      if (context?.previous) {
        queryClient.setQueryData(queryKeys.billing.team, context.previous);
      }
      toast.error(`Couldn't remove ${member.name}`, {
        description: "They still have access. Try again in a moment.",
      });
    },
    onSuccess: (_data, member) => {
      toast.success("Member removed", {
        description: `${member.name} no longer has access to this workspace.`,
      });
    },
    // Deliberately no invalidation on settle. The optimistic list already
    // matches what the API layer holds, and a refetch here would also discard
    // the role changes below, which have nowhere to persist to yet.
  });

  const changeRole = (member: TeamMember, role: Role) => {
    patch((list) => list.map((m) => (m.id === member.id ? { ...m, role } : m)));
    toast.success("Role updated", {
      description: `${member.name} is ${ROLE_LABEL[role].toLowerCase()} — ${ROLE_HINT[role].toLowerCase()}.`,
    });
  };

  const members = team.data ?? [];

  // The empty state's action has to land somewhere real, so it sends focus to
  // the invite field rather than merely scrolling the page.
  const emailRef = React.useRef<HTMLInputElement | null>(null);
  const emailField = register("email");

  return (
    <SettingsSection
      title="Team"
      description="Who can open this workspace, and what each of them is allowed to do."
    >
      <SettingsCard
        title="Members"
        description={`${members.length} ${members.length === 1 ? "person has" : "people have"} access.`}
      >
        {team.isPending ? (
          <div className="flex flex-col gap-3">
            {[0, 1, 2, 3].map((row) => (
              <Skeleton key={row} className="h-12 w-full rounded-md" />
            ))}
          </div>
        ) : team.isError ? (
          <EmptyState
            glyph={IconTeam}
            title="The member list didn't load"
            description="The request came back empty-handed. Nobody's access changed — reload to see the team."
            action={
              <Button variant="primary" onClick={() => void team.refetch()}>
                Reload members
              </Button>
            }
          />
        ) : members.length === 0 ? (
          <EmptyState
            size="sm"
            glyph={IconTeam}
            title="You're the only one here"
            description="Invite the people who write, edit or approve the work and they'll see every project in this workspace."
            action={
              <Button variant="primary" size="sm" onClick={() => emailRef.current?.focus()}>
                Invite a teammate
              </Button>
            }
          />
        ) : (
          <ul className="flex flex-col gap-2">
            {members.map((member) => {
              const isOwner = member.role === "owner";
              return (
                <li
                  key={member.id}
                  className="flex flex-wrap items-center gap-3 rounded-md border border-ink-200 bg-ink-50 p-3"
                >
                  <Avatar name={member.name} />

                  <div className="flex min-w-0 flex-1 flex-col">
                    <span className="text-body-sm truncate font-medium text-ink-950">
                      {member.name}
                    </span>
                    <span className="text-body-sm truncate text-ink-500">{member.email}</span>
                  </div>

                  {member.status === "invited" ? <Badge tone="warning">Invite pending</Badge> : null}

                  {isOwner ? (
                    <Badge tone="neutral">{ROLE_LABEL.owner}</Badge>
                  ) : (
                    <Select
                      value={member.role}
                      onValueChange={(next) => changeRole(member, next as Role)}
                    >
                      <SelectTrigger size="sm" aria-label={`Role for ${member.name}`} className="w-32">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {ASSIGNABLE_ROLES.map((role) => (
                          <SelectItem key={role} value={role} hint={ROLE_HINT[role]}>
                            {ROLE_LABEL[role]}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}

                  <Tooltip
                    content={isOwner ? "The owner can't be removed from their own workspace." : undefined}
                    disabledTrigger={isOwner}
                  >
                    <IconButton
                      label={`Remove ${member.name}`}
                      glyph={IconDelete}
                      size="sm"
                      variant="danger"
                      disabled={isOwner}
                      onClick={() => setRemoving(member)}
                    />
                  </Tooltip>
                </li>
              );
            })}
          </ul>
        )}

        <LocalOnlyNote>
          Roles are applied in this session. This build has no server to persist them to.
        </LocalOnlyNote>
      </SettingsCard>

      <SettingsCard
        title="Invite someone"
        description="They get access to every project in this workspace."
      >
        <form
          onSubmit={(event) => void handleSubmit((values) => invite.mutate(values))(event)}
          noValidate
          className="flex flex-col gap-3 sm:flex-row sm:items-start"
        >
          <Field label="Email address" error={errors.email?.message} className="min-w-0 flex-1">
            <Input
              type="email"
              autoComplete="off"
              placeholder="teammate@company.com"
              {...emailField}
              ref={(node) => {
                emailField.ref(node);
                emailRef.current = node;
              }}
            />
          </Field>

          <Controller
            control={control}
            name="role"
            render={({ field }) => (
              <div className="flex flex-col gap-2">
                <span className="text-label text-ink-700">Role</span>
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger aria-label="Role for the new member" className="w-40">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {ASSIGNABLE_ROLES.map((role) => (
                      <SelectItem key={role} value={role} hint={ROLE_HINT[role]}>
                        {ROLE_LABEL[role]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          />

          <Button
            type="submit"
            variant="primary"
            loading={invite.isPending}
            className="sm:mt-6 sm:shrink-0"
          >
            Send invite
          </Button>
        </form>
      </SettingsCard>

      <ConfirmDialog
        open={removing !== null}
        onOpenChange={(open) => {
          if (!open) setRemoving(null);
        }}
        title={`Remove ${removing?.name ?? "this member"}?`}
        description="They lose access to every project here immediately. Anything they made stays in the workspace."
        confirmLabel="Remove member"
        pending={remove.isPending}
        onConfirm={() => {
          if (removing) remove.mutate(removing);
          setRemoving(null);
        }}
      />
    </SettingsSection>
  );
}
