import { WifiOff } from "lucide-react";
import { useOnlineStatus } from "@/hooks/use-online-status";

export default function OfflineBanner() {
  const online = useOnlineStatus();
  if (online) return null;

  return (
    <div
      role="status"
      className="animate-in slide-in-from-top-full fade-in-0 duration-response ease-spring fixed inset-x-0 top-0 z-[100] flex items-center justify-center gap-2 bg-destructive px-4 py-1.5 text-center text-sm font-medium tracking-caption text-white"
    >
      <WifiOff className="size-4 shrink-0" />
      You're offline — changes won't be saved until the connection returns.
    </div>
  );
}
