import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase, type Project } from "@/lib/supabase";
import { useAuth } from "@/lib/auth-context";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";
import {
  FileText,
  Plus,
  Trash2,
  Pencil,
  Loader2,
  Calendar,
  Star,
  ExternalLink,
} from "lucide-react";
import { UserAvatar } from "@/components/user-avatar";

export const Route = createFileRoute("/dashboard")({
  head: () => ({
    meta: [
      { title: "Dashboard — The Forge" },
      { name: "description", content: "Manage your thesis submissions on The Forge." },
    ],
  }),
  component: Dashboard,
});

type Mine = Project & { starCount: number };

function Dashboard() {
  const { user, profile, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [items, setItems] = useState<Mine[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && !user) navigate({ to: "/login" });
  }, [user, authLoading, navigate]);

  useEffect(() => {
    if (user) void load();
  }, [user]);

  async function load() {
    if (!user) return;
    setLoading(true);
    const { data: rows } = await supabase
      .from("projects")
      .select("*")
      .eq("uploader_id", user.id)
      .order("created_at", { ascending: false });
    const list = (rows ?? []) as Project[];
    if (list.length === 0) {
      setItems([]);
      setLoading(false);
      return;
    }
    const { data: stars } = await supabase
      .from("project_stars")
      .select("project_id")
      .in("project_id", list.map((r) => r.id));
    const counts: Record<string, number> = {};
    (stars ?? []).forEach((s: any) => {
      counts[s.project_id] = (counts[s.project_id] ?? 0) + 1;
    });
    setItems(list.map((r) => ({ ...r, starCount: counts[r.id] ?? 0 })));
    setLoading(false);
  }

  async function remove(p: Project) {
    const { error } = await supabase.from("projects").delete().eq("id", p.id);
    if (error) {
      toast.error(error.message);
      return;
    }
    if (p.file_path) {
      await supabase.storage.from("theses").remove([p.file_path]);
    }
    toast.success("Project deleted");
    setItems((prev) => prev.filter((x) => x.id !== p.id));
  }

  if (authLoading || !user) {
    return (
      <div className="mx-auto max-w-3xl px-6 py-32 text-center">
        <Loader2 className="h-5 w-5 animate-spin mx-auto text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl px-6 pt-28 pb-16">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6 mb-10">
        <div className="flex items-center gap-4">
          <UserAvatar profile={profile} size="lg" />
          <div>
            <h1 className="text-3xl font-semibold tracking-tight">
              {profile?.display_name || user.email?.split("@")[0]}
            </h1>
            <p className="text-muted-foreground text-sm mt-0.5">{user.email}</p>
          </div>
        </div>
        <Link to="/projects/new">
          <Button>
            <Plus className="h-4 w-4" /> New Thesis
          </Button>
        </Link>
      </div>

      <div className="flex items-baseline justify-between mb-4">
        <h2 className="text-lg font-semibold">Your Theses</h2>
        <span className="text-xs text-muted-foreground">
          {items.length} {items.length === 1 ? "Project" : "Projects"}
        </span>
      </div>

      {loading ? (
        <div className="space-y-2">
          {[0, 1].map((i) => (
            <div key={i} className="h-24 rounded-xl border border-border bg-card animate-pulse" />
          ))}
        </div>
      ) : items.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border bg-card/40 p-16 text-center">
          <FileText className="h-6 w-6 mx-auto mb-3 text-muted-foreground" />
          <h3 className="font-semibold text-base mb-1">No Submissions Yet</h3>
          <p className="text-sm text-muted-foreground mb-5">
            Upload your first thesis to get started.
          </p>
          <Link to="/projects/new">
            <Button>
              <Plus className="h-4 w-4" /> Submit Thesis
            </Button>
          </Link>
        </div>
      ) : (
        <div className="space-y-2">
          {items.map((p) => (
            <div
              key={p.id}
              className="rounded-xl border border-border bg-card p-5 flex items-center gap-4 hover:border-primary/30 transition-colors"
              style={{ boxShadow: "var(--shadow-sm)" }}
            >
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/15 text-primary">
                <FileText className="h-5 w-5" />
              </div>
              <div className="flex-1 min-w-0">
                <Link
                  to="/projects/$id"
                  params={{ id: p.id }}
                  className="font-semibold text-[15px] hover:text-primary transition-colors line-clamp-1"
                >
                  {p.title}
                </Link>
                <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                  <span className="inline-flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    {new Date(p.created_at).toLocaleDateString()}
                  </span>
                  <span className="inline-flex items-center gap-1">
                    <Star className="h-3 w-3" />
                    {p.starCount}
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-1">
                <Link to="/projects/$id" params={{ id: p.id }}>
                  <Button size="sm" variant="ghost" title="View">
                    <ExternalLink className="h-4 w-4" />
                  </Button>
                </Link>
                <Link to="/projects/$id/edit" params={{ id: p.id }}>
                  <Button size="sm" variant="ghost" title="Edit">
                    <Pencil className="h-4 w-4" />
                  </Button>
                </Link>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button size="sm" variant="ghost" className="text-destructive hover:text-destructive" title="Delete">
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Delete this thesis?</AlertDialogTitle>
                      <AlertDialogDescription>
                        This will permanently delete "{p.title}", its PDF, comments, and stars. This cannot be undone.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction
                        onClick={() => remove(p)}
                        className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                      >
                        Delete
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
