import type { Account, Plan, TeamMember, TokenBalance, UsageEntry } from "@/lib/schemas";
import { FIXTURE_NOW } from "./seed";

/**
 * SPEC §6.5. Note the deliberate correction called out in the spec: Pro states
 * a real concurrency limit ("3 video clones at a time") rather than repeating
 * the reference product's confusing matrix.
 */
export const PLANS: readonly Plan[] = [
  {
    id: "starter",
    name: "Starter",
    description: "For creators getting started with short-form video.",
    listPriceMonthly: 36,
    priceMonthly: 36,
    priceYearlyPerMonth: 29,
    priceYearlyTotal: 348,
    tokensPerMonth: 4050,
    features: [
      "All AI generative media models",
      "1 video clone at a time",
      "1 slideshow clone at a time",
      "No Vireo watermark",
      "25GB storage",
    ],
    popular: false,
  },
  {
    id: "pro",
    name: "Pro",
    description: "For teams shipping content every week.",
    listPriceMonthly: 99,
    priceMonthly: 99,
    priceYearlyPerMonth: 79,
    priceYearlyTotal: 948,
    tokensPerMonth: 11_880,
    features: [
      "Everything in Starter",
      "3 video clones at a time",
      "3 slideshow clones at a time",
      "200GB storage",
      "3GB max file size",
      "Priority rendering",
    ],
    popular: true,
  },
  {
    id: "enterprise",
    name: "Enterprise",
    description: "White-glove onboarding, custom template building, and features we build for you.",
    listPriceMonthly: null,
    priceMonthly: null,
    priceYearlyPerMonth: null,
    priceYearlyTotal: null,
    tokensPerMonth: null,
    features: [
      "Custom token allocation",
      "Custom template building",
      "Dedicated support",
      "White-glove onboarding",
      "Embedded engineering support",
      "SLA",
    ],
    popular: false,
  },
];

export const TOKEN_BALANCE: TokenBalance = {
  total: 11_880,
  used: 8_642,
  remaining: 3_238,
  cycleEndsAt: new Date(FIXTURE_NOW + 11 * 86_400_000).toISOString(),
  planId: "pro",
};

export const USAGE: readonly UsageEntry[] = [
  { mode: "video", tokens: 3_960, count: 33 },
  { mode: "talking-head", tokens: 2_520, count: 14 },
  { mode: "image", tokens: 990, count: 33 },
  { mode: "replace-motion", tokens: 720, count: 6 },
  { mode: "audio", tokens: 300, count: 12 },
  { mode: "upscale", tokens: 152, count: 5 },
];

export const ACCOUNT: Account = {
  id: "account-1",
  name: "Sam Okafor",
  email: "sam@glowlab.example",
  company: "Glowlab",
  planId: "pro",
};

export const TEAM: readonly TeamMember[] = [
  { id: "member-1", name: "Sam Okafor", email: "sam@glowlab.example", role: "owner", status: "active" },
  { id: "member-2", name: "Ravi Menon", email: "ravi@glowlab.example", role: "editor", status: "active" },
  { id: "member-3", name: "Tess Bianchi", email: "tess@glowlab.example", role: "editor", status: "active" },
  { id: "member-4", name: "Jules Ferreira", email: "jules@glowlab.example", role: "viewer", status: "active" },
  { id: "member-5", name: "Anya Petrova", email: "anya@glowlab.example", role: "editor", status: "invited" },
];
