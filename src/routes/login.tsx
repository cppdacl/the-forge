import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { useAuth } from "@/lib/auth-context";
import { Button } from "@/components/ui/button";
import { BookOpen } from "lucide-react";

export const Route = createFileRoute("/login")({
  head: () => ({
    meta: [
      { title: "Sign in — Forge" },
      { name: "description", content: "Sign in to Forge to submit and discuss thesis work." },
    ],
  }),
  component: Login,
});

function Login() {
  const { user, signInWithGoogle, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (user) navigate({ to: "/explore" });
  }, [user, navigate]);

  return (
    <div className="mx-auto max-w-md px-6 pt-32 pb-20">
      <div
        className="rounded-2xl border border-border bg-card p-8"
        style={{ boxShadow: "var(--shadow-lg)" }}
      >
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-primary to-emerald-400 text-primary-foreground mb-6 shadow-[0_0_24px_-4px_var(--primary)]">
          <BookOpen className="h-5 w-5" />
        </div>
        <h1 className="text-2xl font-semibold tracking-tight mb-1.5">Sign In to The Forge</h1>
        <p className="text-sm text-muted-foreground mb-7 leading-relaxed">
          Browsing is open. Submitting and commenting requires an account.
        </p>
        <Button onClick={signInWithGoogle} disabled={loading} className="w-full" size="lg">
          <GoogleIcon className="mr-2 h-4 w-4" />
          Continue with Google
        </Button>
        <p className="mt-6 text-center text-xs text-muted-foreground">
          <Link to="/explore" className="hover:text-foreground transition-colors">
            ← Browse Without an Account
          </Link>
        </p>
      </div>
    </div>
  );
}

function GoogleIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24">
      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
      <path d="M5.84 14.1c-.22-.66-.35-1.36-.35-2.1s.13-1.44.35-2.1V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.61z" fill="#FBBC05"/>
      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
    </svg>
  );
}
