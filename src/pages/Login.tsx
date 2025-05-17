// src/pages/Login.tsx
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Loader2, Terminal } from "lucide-react";
import { supabase } from "@/lib/supabase/client";
import router from "@/app/router";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      if (!email || !password) {
        throw new Error("Please enter both email and password.");
      }

      const { error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (signInError) {
        throw new Error(signInError.message || "Invalid login credentials.");
      }

      router.navigate("/dashboard");
    } catch (err: any) {
      setError(
        err.message || "An unexpected error occurred. Please try again."
      );
      console.error("Login Error:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-800 p-4">
      <div className="w-full max-w-md">
        <Card className="w-full bg-black/40 backdrop-blur-lg border border-white/20 shadow-xl rounded-2xl text-white">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl font-bold">PMS Inc.</CardTitle>
            <CardDescription className="text-gray-300">
              Enter credentials for Parcel Management System
            </CardDescription>
          </CardHeader>
          <form onSubmit={handleLogin}>
            <CardContent className="space-y-4">
              {error && (
                <Alert
                  variant="destructive"
                  className="bg-red-900/30 border-red-500/50 text-red-200 rounded-lg"
                >
                  <Terminal className="h-4 w-4 text-red-300" />
                  <AlertTitle className="text-white">Login Failed</AlertTitle>
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <div className="space-y-1.5">
                <Label htmlFor="email" className="text-gray-200">
                  Email
                </Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  placeholder="you@example.com"
                  className="bg-black/50 border border-white/30 text-white placeholder:text-gray-500 rounded-md focus:ring-1 focus:ring-white/50 focus:border-white/50"
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="password" className="text-gray-200">
                  Password
                </Label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  placeholder="••••••••"
                  className="bg-black/50 border border-white/30 text-white placeholder:text-gray-500 rounded-md focus:ring-1 focus:ring-white/50 focus:border-white/50"
                />
              </div>
            </CardContent>

            <CardFooter className="flex flex-col space-y-4 pt-6">
              {/* Added top padding */}
              <Button
                type="submit"
                className="w-full bg-white/90 hover:bg-white !text-black font-semibold rounded-md transition-colors duration-200 disabled:opacity-50"
                disabled={loading}
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin text-black" />
                    Logging in...
                  </>
                ) : (
                  "Login"
                )}
              </Button>
            </CardFooter>
          </form>
        </Card>
        <p className="mt-6 text-center text-xs text-gray-400/80">
          &copy; {new Date().getFullYear()} PMS Inc. All rights reserved.
        </p>
      </div>
    </div>
  );
}
