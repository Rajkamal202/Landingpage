import type { Account, Plan, TeamMember, TokenBalance, UsageEntry } from "@/lib/schemas";
import { ACCOUNT, PLANS, TEAM, TOKEN_BALANCE, USAGE } from "@/lib/fixtures/billing";
import { ApiError, clone, delay, maybeFail } from "./client";

let balance: TokenBalance = clone(TOKEN_BALANCE);
let team: TeamMember[] = clone([...TEAM]);

export async function listPlans(): Promise<Plan[]> {
  await delay(60, 160);
  return clone([...PLANS]);
}

export async function getTokenBalance(): Promise<TokenBalance> {
  await delay(80, 200);
  return clone(balance);
}

export async function getUsage(): Promise<UsageEntry[]> {
  await delay(120, 260);
  return clone([...USAGE]);
}

/** Called optimistically on submit so the meter moves with the user's action. */
export async function spendTokens(amount: number): Promise<TokenBalance> {
  await delay(60, 140);
  const used = Math.min(balance.total, balance.used + amount);
  balance = { ...balance, used, remaining: Math.max(0, balance.total - used) };
  return clone(balance);
}

export async function topUpTokens(amount: number): Promise<TokenBalance> {
  await delay(300, 620);
  maybeFail("Adding tokens");
  balance = {
    ...balance,
    total: balance.total + amount,
    remaining: balance.remaining + amount,
  };
  return clone(balance);
}

export async function getAccount(): Promise<Account> {
  await delay(80, 180);
  return clone(ACCOUNT);
}

export async function listTeam(): Promise<TeamMember[]> {
  await delay(120, 260);
  return clone(team);
}

export async function inviteTeamMember(email: string, role: TeamMember["role"]): Promise<TeamMember> {
  await delay(280, 520);
  maybeFail("Sending the invite");
  if (team.some((member) => member.email === email)) {
    throw new ApiError(`${email} is already on this team`, {
      code: "duplicate",
      fix: "Change their role from the members list instead of inviting them again.",
    });
  }
  const member: TeamMember = {
    id: `member-${Math.random().toString(36).slice(2, 8)}`,
    name: email.split("@")[0] ?? email,
    email,
    role,
    status: "invited",
  };
  team = [...team, member];
  return clone(member);
}

export async function removeTeamMember(id: string): Promise<void> {
  await delay(160, 320);
  team = team.filter((member) => member.id !== id);
}

/** SPEC §2: no payment processing. Checkout resolves and the UI shows a dialog. */
export async function startCheckout(planId: Plan["id"], period: "monthly" | "yearly") {
  await delay(400, 800);
  maybeFail("Opening checkout");
  return { planId, period, checkoutId: `checkout-${Math.random().toString(36).slice(2, 9)}` };
}
