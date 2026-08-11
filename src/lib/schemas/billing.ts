import { z } from "zod";
import { zGenerationMode } from "./generation";
import { zId, zTimestamp } from "./common";

export const zPlanId = z.enum(["starter", "pro", "enterprise"]);
export type PlanId = z.infer<typeof zPlanId>;

export const zBillingPeriod = z.enum(["monthly", "yearly"]);
export type BillingPeriod = z.infer<typeof zBillingPeriod>;

export const zPlan = z.object({
  id: zPlanId,
  name: z.string(),
  description: z.string(),
  /** Struck-through list price, in whole dollars. Null for Enterprise. */
  listPriceMonthly: z.number().int().nullable(),
  priceMonthly: z.number().int().nullable(),
  priceYearlyPerMonth: z.number().int().nullable(),
  priceYearlyTotal: z.number().int().nullable(),
  tokensPerMonth: z.number().int().nullable(),
  features: z.array(z.string()),
  popular: z.boolean(),
});
export type Plan = z.infer<typeof zPlan>;

export const zTokenBalance = z.object({
  total: z.number().int().nonnegative(),
  used: z.number().int().nonnegative(),
  remaining: z.number().int().nonnegative(),
  cycleEndsAt: zTimestamp,
  planId: zPlanId,
});
export type TokenBalance = z.infer<typeof zTokenBalance>;

export const zUsageEntry = z.object({
  mode: zGenerationMode,
  tokens: z.number().int().nonnegative(),
  count: z.number().int().nonnegative(),
});
export type UsageEntry = z.infer<typeof zUsageEntry>;

export const zTeamMember = z.object({
  id: zId,
  name: z.string(),
  email: z.string(),
  role: z.enum(["owner", "editor", "viewer"]),
  status: z.enum(["active", "invited"]),
});
export type TeamMember = z.infer<typeof zTeamMember>;

export const zAccount = z.object({
  id: zId,
  name: z.string(),
  email: z.string(),
  company: z.string(),
  planId: zPlanId,
});
export type Account = z.infer<typeof zAccount>;
