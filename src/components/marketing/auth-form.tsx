"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { cn } from "@/lib/cn";
import { Logo } from "@/components/brand/logomark";
import { IconHidden, IconVisible } from "@/components/icons";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { IconButton } from "@/components/ui/icon-button";
import { Input } from "@/components/ui/input";

/**
 * SPEC §2 and §7.2 — "Real authentication is out of scope (mock a session; login
 * form navigates to the app)."
 *
 * Mock does not mean unvalidated. The form is real react-hook-form with a zod
 * schema as the single source of truth for both the rules and the types, the
 * messages follow SPEC §12 (what is wrong, and what to do about it), and the
 * message row is reserved by `Field` so nothing on the page moves when
 * validation fires. What is mocked is only what happens after submit: the
 * session is written to `sessionStorage` and the router goes to `/app`.
 */

const EMAIL = z.email("Enter a full email address, like you@company.com.");
const PASSWORD = z
  .string()
  .min(8, "Use at least eight characters. A short phrase is easier to remember than a word.");

const loginSchema = z.object({ name: z.string(), email: EMAIL, password: PASSWORD });
const signupSchema = z.object({
  name: z.string().trim().min(2, "Tell us what to call you — a first name is plenty."),
  email: EMAIL,
  password: PASSWORD,
});

/**
 * Both schemas produce and accept the same shape, so the form is one component
 * with one value type. The type is inferred from the schema rather than hand
 * written, per SPEC §3: "Zod schemas are the single source of truth for types."
 */
export type AuthValues = z.infer<typeof signupSchema>;

export type AuthMode = "login" | "signup";

const COPY: Record<AuthMode, { title: string; sub: string; submit: string; swap: React.ReactNode }> =
  {
    login: {
      title: "Log in",
      sub: "Pick up where you left off. Your tabs, library and unfinished cuts are all still there.",
      submit: "Log in",
      swap: (
        <>
          New here?{" "}
          <Link href="/signup" className="font-medium text-brand-600 hover:text-brand-700">
            Create an account
          </Link>
        </>
      ),
    },
    signup: {
      title: "Create your account",
      sub: "Add a logo and a product image and you can clone your first video in the next few minutes.",
      submit: "Create account",
      swap: (
        <>
          Already have an account?{" "}
          <Link href="/login" className="font-medium text-brand-600 hover:text-brand-700">
            Log in
          </Link>
        </>
      ),
    },
  };

export function AuthForm({ mode }: { mode: AuthMode }) {
  const router = useRouter();
  const [revealed, setRevealed] = React.useState(false);
  const copy = COPY[mode];

  // Annotating this as `z.ZodType<AuthValues>` would erase the schema's INPUT
  // type to `unknown`, which zodResolver cannot reconcile with the form values.
  // Both branches already share a shape, so the inferred union is precise.
  const schema = mode === "signup" ? signupSchema : loginSchema;
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<AuthValues>({
    resolver: zodResolver(schema),
    defaultValues: { name: "", email: "", password: "" },
    mode: "onSubmit",
  });

  const onSubmit = handleSubmit((values) => {
    try {
      window.sessionStorage.setItem(
        "vireo:session",
        JSON.stringify({ name: values.name || "Sam Okafor", email: values.email }),
      );
    } catch {
      // Private browsing refuses storage; the mock session is not worth failing over.
    }
    router.push("/app");
  });

  return (
    <main id="main" className="flex min-h-dvh flex-col items-center justify-center px-6 py-20">
      <div className="flex w-full max-w-sheet flex-col gap-8">
        <div className="flex flex-col gap-4">
          <Link href="/" aria-label="Vireo home" className="self-start text-ink-950">
            <Logo size={24} />
          </Link>
          <h1 className="text-display-md text-ink-950">{copy.title}</h1>
          <p className="text-body-md text-ink-500">{copy.sub}</p>
        </div>

        <form
          onSubmit={(event) => void onSubmit(event)}
          noValidate
          className={cn(
            "flex flex-col gap-2 rounded-xl border border-ink-200 bg-surface p-6 shadow-elev-1",
          )}
        >
          {mode === "signup" ? (
            <Field label="Your name" error={errors.name?.message}>
              <Input autoComplete="name" placeholder="Sam Okafor" {...register("name")} />
            </Field>
          ) : null}

          <Field label="Email" error={errors.email?.message}>
            <Input
              type="email"
              autoComplete="email"
              placeholder="you@company.com"
              {...register("email")}
            />
          </Field>

          <Field
            label="Password"
            error={errors.password?.message}
            hint={mode === "signup" ? "At least eight characters." : undefined}
          >
            <Input
              type={revealed ? "text" : "password"}
              autoComplete={mode === "signup" ? "new-password" : "current-password"}
              placeholder="••••••••"
              suffix={
                <IconButton
                  label={revealed ? "Hide password" : "Show password"}
                  glyph={revealed ? IconHidden : IconVisible}
                  size="sm"
                  onClick={() => setRevealed((value) => !value)}
                />
              }
              {...register("password")}
            />
          </Field>

          <Button type="submit" size="lg" block loading={isSubmitting} className="mt-4">
            {copy.submit}
          </Button>
        </form>

        <p className="text-body-sm text-center text-ink-500">{copy.swap}</p>
        <p className="text-body-sm text-center text-ink-500">
          Nothing here reaches a server. This build signs you in locally so you can look around
          the studio.
        </p>
      </div>
    </main>
  );
}
