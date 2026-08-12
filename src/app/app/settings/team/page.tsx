import type { Metadata } from "next";
import { TeamScreen } from "@/components/studio/settings/team-screen";

export const metadata: Metadata = { title: "Team" };

export default function Page() {
  return <TeamScreen />;
}
