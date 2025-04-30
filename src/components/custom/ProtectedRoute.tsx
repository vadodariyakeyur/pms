import { supabase } from "@/lib/supabase/client";
import { useEffect, useState, PropsWithChildren } from "react";
import { useNavigate } from "react-router-dom";

export function ProtectedRoute({ children }: PropsWithChildren) {
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const checkSession = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session) {
        navigate("/auth/login");
      } else {
        setLoading(false);
      }
    };

    checkSession();
  }, [navigate]);

  if (loading)
    return (
      <div className="flex items-center justify-center min-h-screen">
        Loading...
      </div>
    );

  return <>{children}</>;
}
