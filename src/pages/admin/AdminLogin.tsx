import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { useAuth } from "@/contexts/AuthContext";
import { useBranding } from "@/hooks/useBranding";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable/index";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2, Lock, UserPlus, Shield } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

const AdminLogin = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [isSignUp, setIsSignUp] = useState(false);
  const [exiting, setExiting] = useState(false);
  const { signIn } = useAuth();
  const { branding } = useBranding();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password.trim()) {
      toast.error("Please fill in all fields.");
      return;
    }
    setLoading(true);

    try {
      if (isSignUp) {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: { emailRedirectTo: window.location.origin },
        });

        if (error) {
          toast.error(error.message);
          return;
        }

        toast.success("Account created! Signing you in...");
        const { error: signInError } = await signIn(email, password);
        if (signInError) {
          toast.error(signInError);
          return;
        }

        setExiting(true);
        setTimeout(() => navigate("/admin"), 600);
        return;
      }

      const { error } = await signIn(email, password);
      if (error) {
        toast.error(error);
        return;
      }

      toast.success("Welcome back!");
      setExiting(true);
      setTimeout(() => navigate("/admin"), 600);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      if (/failed to fetch|networkerror|network request failed/i.test(message)) {
        toast.error("Network error. Please check internet, firewall/ad-blocker, and Supabase config.");
      } else {
        toast.error(message || "Sign-in failed. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#1d2327] flex items-center justify-center p-4 relative overflow-hidden">
      {branding.favicon && (
        <Helmet>
          <link rel="icon" href={branding.favicon} type="image/png" />
          <meta name="robots" content="noindex,nofollow" />
          <meta name="googlebot" content="noindex,nofollow" />
        </Helmet>
      )}

      {!branding.favicon && (
        <Helmet>
          <meta name="robots" content="noindex,nofollow" />
          <meta name="googlebot" content="noindex,nofollow" />
        </Helmet>
      )}

      {/* Ambient glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-[#2271b1]/10 rounded-full blur-[120px] pointer-events-none" />

      <div
        className={cn(
          "w-full max-w-sm relative z-10 transition-all duration-600",
          exiting
            ? "opacity-0 scale-95 translate-y-4"
            : "animate-scale-in"
        )}
      >
        <div className="bg-[#23272b] rounded-2xl border border-[#3a3f44] shadow-2xl p-8 space-y-6">
          <div className="text-center">
            {branding.header_logo ? (
              <img
                src={branding.header_logo}
                alt={branding.site_title || "Admin"}
                className="h-12 max-w-[200px] object-contain mx-auto mb-4 brightness-0 invert"
              />
            ) : (
              <div className="w-14 h-14 bg-[#2271b1] rounded-xl flex items-center justify-center mx-auto mb-4">
                <Shield className="w-7 h-7 text-white" />
              </div>
            )}
            <h1 className="text-xl font-bold text-white">
              {isSignUp ? "Create Account" : "Admin Login"}
            </h1>
            <p className="text-sm text-gray-400 mt-1">
              {isSignUp ? "Create a new admin account" : "Sign in to access your dashboard"}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="text-sm font-medium text-gray-300 mb-1.5 block">Email</label>
              <Input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@verifiedbm.shop"
                autoComplete="email"
                className="bg-[#1d2327] border-[#3a3f44] text-white placeholder:text-gray-500 focus:border-[#2271b1] focus:ring-[#2271b1]/20"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-300 mb-1.5 block">Password</label>
              <Input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                autoComplete={isSignUp ? "new-password" : "current-password"}
                className="bg-[#1d2327] border-[#3a3f44] text-white placeholder:text-gray-500 focus:border-[#2271b1] focus:ring-[#2271b1]/20"
              />
            </div>
            <Button
              type="submit"
              className="w-full gap-2 bg-[#2271b1] hover:bg-[#135e96] text-white h-11 text-sm font-semibold transition-all duration-200 hover:shadow-lg hover:shadow-[#2271b1]/25"
              disabled={loading}
            >
              {loading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : isSignUp ? (
                <UserPlus className="w-4 h-4" />
              ) : (
                <Lock className="w-4 h-4" />
              )}
              {isSignUp ? "Sign Up" : "Sign In"}
            </Button>
          </form>

          {/* Divider */}
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t border-[#3a3f44]" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-[#23272b] px-2 text-gray-500">Or continue with</span>
            </div>
          </div>

          {/* Social Login */}
          <div className="grid grid-cols-3 gap-3">
            <Button
              type="button"
              variant="outline"
              className="gap-2 bg-transparent border-[#3a3f44] text-gray-300 hover:bg-[#2c3338] hover:text-white hover:border-[#4a4f54]"
              disabled={loading}
              onClick={async () => {
                setLoading(true);
                const { error } = await lovable.auth.signInWithOAuth("google", {
                  redirect_uri: window.location.origin,
                });
                if (error) {
                  toast.error("Google sign-in failed.");
                  setLoading(false);
                }
              }}
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4" />
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
              </svg>
              Google
            </Button>
            <Button
              type="button"
              variant="outline"
              className="gap-2 bg-transparent border-[#3a3f44] text-gray-300 hover:bg-[#2c3338] hover:text-white hover:border-[#4a4f54]"
              disabled={loading}
              onClick={async () => {
                setLoading(true);
                const { error } = await lovable.auth.signInWithOAuth("apple", {
                  redirect_uri: window.location.origin,
                });
                if (error) {
                  toast.error("Apple sign-in failed.");
                  setLoading(false);
                }
              }}
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                <path d="M17.05 20.28c-.98.95-2.05.88-3.08.4-1.09-.5-2.08-.48-3.24 0-1.44.62-2.2.44-3.06-.4C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z" />
              </svg>
              Apple
            </Button>
            <Button
              type="button"
              variant="outline"
              className="gap-2 bg-transparent border-[#3a3f44] text-gray-300 hover:bg-[#2c3338] hover:text-white hover:border-[#4a4f54]"
              disabled={loading}
              onClick={async () => {
                setLoading(true);
                const { error } = await lovable.auth.signInWithOAuth("facebook", {
                  redirect_uri: window.location.origin,
                });
                if (error) {
                  toast.error("Facebook sign-in failed.");
                  setLoading(false);
                }
              }}
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                <path d="M13.5 22v-8h2.7l.4-3h-3.1V9.1c0-.9.3-1.5 1.6-1.5h1.7V5c-.3 0-1.4-.1-2.6-.1-2.6 0-4.3 1.6-4.3 4.5V11H7v3h2.9v8h3.6z" />
              </svg>
              Facebook
            </Button>
          </div>

          <div className="text-center">
            <button
              type="button"
              onClick={() => setIsSignUp(!isSignUp)}
              className="text-sm text-[#2271b1] hover:text-[#4a9fd4] transition-colors"
            >
              {isSignUp ? "Already have an account? Sign In" : "Need an account? Sign Up"}
            </button>
          </div>
        </div>

        <p className="text-center text-[11px] text-gray-600 mt-4">
          Protected by Verified BM Shop · Enterprise Security
        </p>
      </div>
    </div>
  );
};

export default AdminLogin;
