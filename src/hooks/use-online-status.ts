import { useSyncExternalStore } from "react";

const subscribe = (onChange: () => void) => {
  window.addEventListener("online", onChange);
  window.addEventListener("offline", onChange);
  return () => {
    window.removeEventListener("online", onChange);
    window.removeEventListener("offline", onChange);
  };
};

// Reliable when it reports offline; can report a false "online" (wifi up, no
// internet) — the client.ts fetch interceptor covers that case via toasts.
export const useOnlineStatus = () =>
  useSyncExternalStore(
    subscribe,
    () => navigator.onLine,
    () => true
  );
