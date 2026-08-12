import { MarketingChrome } from "@/components/marketing/shell";
import { MarketingFooter } from "@/components/marketing/footer";
import { MarketingProviders } from "./providers";

export default function MarketingLayout({ children }: { children: React.ReactNode }) {
  return (
    <MarketingProviders>
      <MarketingChrome footer={<MarketingFooter />}>{children}</MarketingChrome>
    </MarketingProviders>
  );
}
