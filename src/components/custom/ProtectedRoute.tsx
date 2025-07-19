import router from "@/app/router";
import { supabase } from "@/lib/supabase/client";
import { Loader2 } from "lucide-react";
import { useEffect, useState, PropsWithChildren } from "react";

export function ProtectedRoute({ children }: PropsWithChildren) {
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkSession = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session) {
        router.navigate("/auth/login");
      } else {
        setLoading(false);
      }
    };

    checkSession();
  }, []);

  if (loading)
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="animate-spin"/>
      </div>
    );

  return <>{children}</>;
}
