import { MarketingProviders } from "./providers";

export default function MarketingLayout({ children }: { children: React.ReactNode }) {
  return <MarketingProviders>{children}</MarketingProviders>;
}
