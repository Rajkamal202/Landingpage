import type { Metadata } from "next";
import { BrandScreen } from "@/components/studio/brand/brand-screen";

export const metadata: Metadata = { title: "Brand kit" };

/** SPEC §8.3. */
export default function Page() {
  return <BrandScreen />;
}
