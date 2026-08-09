import { RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNewVersion } from "@/hooks/use-new-version";
import { useOnlineStatus } from "@/hooks/use-online-status";

export default function UpdateBanner() {
  const stale = useNewVersion();
  const online = useOnlineStatus();

  // Offline shows its own top banner, and reloading offline gets you nowhere.
  if (!stale || !online) return null;

  return (
    <div
      role="status"
      className="animate-in slide-in-from-top-full fade-in-0 duration-response ease-spring fixed inset-x-0 top-0 z-[100] flex items-center justify-center gap-3 bg-primary px-4 py-1.5 text-center text-sm font-medium tracking-caption text-primary-foreground"
    >
      <RefreshCw className="size-4 shrink-0" />
      A new version is available.
      <Button
        size="sm"
        variant="secondary"
        onClick={() => window.location.reload()}
      >
        Refresh
      </Button>
    </div>
  );
}
