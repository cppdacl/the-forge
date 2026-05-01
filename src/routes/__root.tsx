import {
  Outlet,
  Link,
  createRootRoute,
  HeadContent,
  Scripts,
} from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Toaster } from "sonner";
import { AuthProvider, useAuth } from "@/lib/auth-context";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { UserAvatar } from "@/components/user-avatar";
import {
  LogOut,
  Plus,
  Flame,
  LayoutDashboard,
  Compass,
  Sparkles,
  UserCircle,
  Settings,
} from "lucide-react";

import appCss from "../styles.css?url";

function NotFoundComponent() {
  return (
    <div className="flex min-h-[70vh] items-center justify-center px-4">
      <div className="max-w-md text-center">
        <div className="text-sm font-medium text-muted-foreground">404</div>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight">Page Not Found</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          The page you're looking for doesn't exist.
        </p>
        <div className="mt-6">
          <Link
            to="/"
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition hover:opacity-90"
          >
            Go Home
          </Link>
        </div>
      </div>
    </div>
  );
}

export const Route = createRootRoute({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "The Forge — Academic Thesis Repository" },
      {
        name: "description",
        content:
          "An open repository where De La Salle Lipa researchers share, archive, and discuss thesis work.",
      },
      { property: "og:title", content: "The Forge — Academic Thesis Repository" },
      {
        property: "og:description",
        content: "Share, archive, and discuss thesis work in an open academic repository.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [
      { rel: "stylesheet", href: appCss },
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" },
      {
        rel: "stylesheet",
        href: "https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap",
      },
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
});

function RootShell({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark" suppressHydrationWarning>
      <head suppressHydrationWarning>
        {import.meta.env.DEV && (
          <script
            src="/__replco/static/devtools/injected.js"
            suppressHydrationWarning
          />
        )}
        <HeadContent />
      </head>
      <body>
        <AuthProvider>
          {children}
          <Toaster theme="dark" position="top-right" richColors />
        </AuthProvider>
        <Scripts />
      </body>
    </html>
  );
}

function Header() {
  const { user, profile, loading, signOut } = useAuth();
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className={[
        "fixed top-0 inset-x-0 z-40 transition-all duration-300",
        scrolled
          ? "bg-background/70 backdrop-blur-xl border-b border-border/80 shadow-[0_1px_0_0_oklch(1_0_0_/_0.04)]"
          : "bg-transparent border-b border-transparent",
      ].join(" ")}
    >
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-6">
        <div className="flex items-center gap-8">
          <Link to="/" className="flex items-center gap-2 group">
            <div className="flex h-7 w-7 items-center justify-center rounded-md bg-gradient-to-br from-primary to-emerald-400 text-primary-foreground shadow-[0_0_18px_-4px_var(--primary)]">
              <Flame className="h-4 w-4" />
            </div>
            <span className="text-[15px] font-semibold tracking-tight">The Forge</span>
          </Link>
          <nav className="hidden md:flex items-center gap-1 text-sm">
            <NavLink to="/explore" icon={<Compass className="h-3.5 w-3.5" />}>Explore</NavLink>
            <NavLink to="/featured" icon={<Sparkles className="h-3.5 w-3.5" />}>Featured</NavLink>
            {!loading && user && (
              <>
                <NavLink to="/projects/new" icon={<Plus className="h-3.5 w-3.5" />}>Submit</NavLink>
                <NavLink to="/dashboard" icon={<LayoutDashboard className="h-3.5 w-3.5" />}>Dashboard</NavLink>
              </>
            )}
          </nav>
        </div>

        <div className="flex items-center gap-2">
          {loading ? (
            <div className="flex items-center gap-2">
              <Skeleton className="h-7 w-7 rounded-full" />
              <Skeleton className="hidden sm:block h-4 w-24 rounded-md" />
            </div>
          ) : user ? (
            <DropdownMenu modal={false}>
              <DropdownMenuTrigger asChild>
                <button className="flex items-center gap-2 rounded-full pl-1 pr-3 h-9 hover:bg-accent/60 transition-colors">
                  <UserAvatar profile={profile} size="sm" />
                  <span className="hidden sm:block text-sm font-medium max-w-[140px] truncate">
                    {profile?.display_name || user.email?.split("@")[0]}
                  </span>
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel className="flex items-center gap-2.5 py-2">
                  <UserAvatar profile={profile} size="md" />
                  <div className="min-w-0">
                    <div className="text-sm font-semibold truncate">
                      {profile?.display_name || user.email?.split("@")[0]}
                    </div>
                    <div className="text-[11px] text-muted-foreground truncate">
                      {user.email}
                    </div>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                {user && (
                  <DropdownMenuItem asChild>
                    <Link to="/profiles/$id" params={{ id: user.id }} className="cursor-pointer">
                      <UserCircle className="h-4 w-4" /> My Profile
                    </Link>
                  </DropdownMenuItem>
                )}
                <DropdownMenuItem asChild>
                  <Link to="/dashboard" className="cursor-pointer">
                    <LayoutDashboard className="h-4 w-4" /> Dashboard
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link to="/projects/new" className="cursor-pointer">
                    <Plus className="h-4 w-4" /> Submit Thesis
                  </Link>
                </DropdownMenuItem>
                {user && (
                  <DropdownMenuItem asChild>
                    <Link to="/profiles/$id/edit" params={{ id: user.id }} className="cursor-pointer">
                      <Settings className="h-4 w-4" /> Edit Profile
                    </Link>
                  </DropdownMenuItem>
                )}
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={signOut}
                  className="cursor-pointer text-destructive focus:text-destructive"
                >
                  <LogOut className="h-4 w-4" /> Sign Out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <Link to="/login">
              <Button size="sm" className="h-8">Sign In</Button>
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}

function NavLink({
  to,
  children,
  icon,
}: {
  to: string;
  children: React.ReactNode;
  icon?: React.ReactNode;
}) {
  return (
    <Link
      to={to}
      className="px-3 py-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-accent/60 transition-colors inline-flex items-center gap-1.5"
      activeProps={{
        className:
          "px-3 py-1.5 rounded-md text-foreground bg-accent/60 inline-flex items-center gap-1.5",
      }}
    >
      {icon}
      {children}
    </Link>
  );
}

function RootComponent() {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      <main className="flex-1">
        <Outlet />
      </main>
      <footer className="border-t border-border mt-20">
        <div className="mx-auto max-w-6xl px-6 py-6 text-xs text-muted-foreground flex flex-wrap items-center justify-between gap-3">
          <span suppressHydrationWarning>© {new Date().getFullYear()} The Forge</span>
          <span>De La Salle Lipa</span>
        </div>
      </footer>
    </div>
  );
}
