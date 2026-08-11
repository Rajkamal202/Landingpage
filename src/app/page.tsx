import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { IconGenerate } from "@/components/icons";

export default function Page() {
  return (
    <main className="mx-auto flex max-w-marketing flex-col gap-6 px-6 py-32">
      <h1 className="text-display-lg text-ink-950">Primitive smoke test</h1>
      <div className="flex items-center gap-3">
        <Button variant="primary" iconStart={IconGenerate}>Generate</Button>
        <Button variant="secondary">Secondary</Button>
        <Button variant="ghost">Ghost</Button>
        <Badge tone="brand">Popular</Badge>
      </div>
    </main>
  );
}
