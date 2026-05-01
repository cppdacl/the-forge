import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase, type Project, type Profile } from "@/lib/supabase";
import { FileText, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { UserAvatar } from "@/components/user-avatar";
import { ProfileHoverCard } from "@/components/user-hover-card";
import { StarButton } from "@/components/star-button";

export const Route = createFileRoute("/explore")({
  head: () => ({
    meta: [
      { title: "Explore — The Forge" },
      { name: "description", content: "Browse all thesis projects in The Forge repository." },
    ],
  }),
  component: Explore,
});

type ProjectWithMeta = Project & {
  authors: Profile[];
  uploader: Profile | null;
  starCount: number;
};

function Explore() {
  const [projects, setProjects] = useState<ProjectWithMeta[]>([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");

  useEffect(() => {
    void load();
  }, []);

  async function load() {
    setLoading(true);
    const { data: rows } = await supabase
      .from("projects")
      .select("*")
      .order("created_at", { ascending: false });

    if (!rows) {
      setProjects([]);
      setLoading(false);
      return;
    }

    const ids = rows.map((r: Project) => r.id);
    let authorsMap: Record<string, Profile[]> = {};
    let uploaderMap: Record<string, Profile> = {};
    let starMap: Record<string, number> = {};

    if (ids.length) {
      const [{ data: links }, { data: ups }, { data: stars }] = await Promise.all([
        supabase
          .from("project_authors")
          .select("project_id, profiles:user_id(*)")
          .in("project_id", ids),
        supabase
          .from("profiles")
          .select("*")
          .in("id", Array.from(new Set(rows.map((r: Project) => r.uploader_id)))),
        supabase.from("project_stars").select("project_id").in("project_id", ids),
      ]);

      authorsMap = (links ?? []).reduce((acc: Record<string, Profile[]>, l: any) => {
        if (!acc[l.project_id]) acc[l.project_id] = [];
        if (l.profiles) acc[l.project_id].push(l.profiles);
        return acc;
      }, {});
      uploaderMap = (ups ?? []).reduce((acc: Record<string, Profile>, p: Profile) => {
        acc[p.id] = p;
        return acc;
      }, {});
      starMap = (stars ?? []).reduce((acc: Record<string, number>, s: any) => {
        acc[s.project_id] = (acc[s.project_id] ?? 0) + 1;
        return acc;
      }, {});
    }

    setProjects(
      rows.map((r: Project) => ({
        ...r,
        authors: authorsMap[r.id] ?? [],
        uploader: uploaderMap[r.uploader_id] ?? null,
        starCount: starMap[r.id] ?? 0,
      })),
    );
    setLoading(false);
  }

  const filtered = projects.filter((p) => {
    if (!q.trim()) return true;
    const needle = q.toLowerCase();
    return (
      p.title.toLowerCase().includes(needle) ||
      p.abstract.toLowerCase().includes(needle) ||
      p.authors.some((a) => (a.display_name ?? "").toLowerCase().includes(needle))
    );
  });

  return (
    <div className="mx-auto max-w-5xl px-6 pt-28 pb-16">
      <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6 mb-10">
        <div>
          <h1 className="text-3xl md:text-4xl font-semibold tracking-tight">Archive</h1>
          <div className="text-muted-foreground mt-1.5 text-[15px]">
            {loading ? (
              <Skeleton className="h-4 w-32 mt-2" />
            ) : (
              <>{projects.length} {projects.length === 1 ? "Thesis" : "Theses"} Published.</>
            )}
          </div>
        </div>
        <div className="relative md:w-80">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search by title, abstract, or author"
            className="pl-9 h-9"
          />
        </div>
      </div>

      {loading ? (
        <div className="grid sm:grid-cols-2 gap-3">
          {[0, 1, 2, 3].map((i) => (
            <ProjectCardSkeleton key={i} />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <EmptyState hasAny={projects.length > 0} />
      ) : (
        <div className="grid sm:grid-cols-2 gap-3">
          {filtered.map((p) => (
            <ProjectCard key={p.id} p={p} />
          ))}
        </div>
      )}
    </div>
  );
}

function ProjectCardSkeleton() {
  return (
    <div className="rounded-xl border border-border bg-card p-5 flex flex-col">
      <div className="flex items-start gap-3 mb-3">
        <Skeleton className="h-8 w-8 rounded-lg shrink-0" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-4 w-1/2" />
        </div>
      </div>
      <Skeleton className="h-3.5 w-full mb-1.5" />
      <Skeleton className="h-3.5 w-5/6 mb-1.5" />
      <Skeleton className="h-3.5 w-4/6 mb-4" />
      <div className="pt-3 border-t border-border/60 flex items-center justify-between">
        <div className="flex -space-x-1.5">
          <Skeleton className="h-5 w-5 rounded-full" />
          <Skeleton className="h-5 w-5 rounded-full" />
        </div>
        <Skeleton className="h-3.5 w-20" />
      </div>
    </div>
  );
}

export function ProjectCard({ p }: { p: ProjectWithMeta }) {
  const allAuthors = p.authors.length ? p.authors : p.uploader ? [p.uploader] : [];
  return (
    <div
      className="group rounded-xl border border-border bg-card p-5 hover:border-primary/40 hover:bg-accent/20 transition-all flex flex-col"
      style={{ boxShadow: "var(--shadow-sm)" }}
    >
      <Link to="/projects/$id" params={{ id: p.id }} className="flex-1 min-w-0">
        <div className="flex items-start gap-3 mb-3">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/15 text-primary">
            <FileText className="h-4 w-4" />
          </div>
          <div className="min-w-0 flex-1">
            <h3 className="font-semibold text-[15px] leading-snug group-hover:text-primary transition-colors line-clamp-2">
              {p.title}
            </h3>
          </div>
        </div>
        <p className="text-sm text-muted-foreground line-clamp-3 mb-3 leading-relaxed">
          {p.abstract}
        </p>
      </Link>

      {allAuthors.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mb-3">
          {allAuthors.slice(0, 4).map((a) => (
            <ProfileHoverCard key={a.id} profile={a} side="top">
              <Link
                to="/profiles/$id"
                params={{ id: a.id }}
                onClick={(e) => e.stopPropagation()}
              >
                <div className="flex items-center gap-1 rounded-full border border-border/80 bg-accent/30 pl-0.5 pr-2 py-0.5 hover:border-primary/40 hover:bg-accent/60 transition-colors">
                  <UserAvatar profile={a} size="xs" />
                  <span className="text-[11px] font-medium leading-none">
                    {a.display_name?.split(" ")[0] || a.email?.split("@")[0] || "?"}
                  </span>
                </div>
              </Link>
            </ProfileHoverCard>
          ))}
          {allAuthors.length > 4 && (
            <div className="flex items-center px-2 py-0.5 rounded-full border border-border/60 bg-accent/20 text-[11px] text-muted-foreground">
              +{allAuthors.length - 4}
            </div>
          )}
        </div>
      )}

      <div className="flex items-center justify-between gap-3 pt-3 border-t border-border/60">
        <StarButton projectId={p.id} variant="compact" />
        <span className="text-[11px] text-muted-foreground">
          {new Date(p.created_at).toLocaleDateString(undefined, {
            month: "short",
            day: "numeric",
            year: "numeric",
          })}
        </span>
      </div>
    </div>
  );
}

function EmptyState({ hasAny }: { hasAny: boolean }) {
  return (
    <div className="rounded-xl border border-dashed border-border bg-card/40 p-16 text-center">
      <div className="mx-auto mb-4 flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
        <FileText className="h-5 w-5" />
      </div>
      <h3 className="font-semibold text-base mb-1">
        {hasAny ? "No Matches" : "Nothing Here Yet"}
      </h3>
      <p className="text-sm text-muted-foreground">
        {hasAny
          ? "Try a different search term."
          : "No theses uploaded yet. Be the first to submit."}
      </p>
    </div>
  );
}
