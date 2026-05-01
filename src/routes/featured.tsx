import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase, type Project, type Profile } from "@/lib/supabase";
import { Sparkles, Trophy } from "lucide-react";
import { ProjectCard } from "./explore";

export const Route = createFileRoute("/featured")({
  head: () => ({
    meta: [
      { title: "Featured — The Forge" },
      {
        name: "description",
        content: "The most-starred thesis projects in The Forge — community favorites.",
      },
    ],
  }),
  component: Featured,
});

type ProjectWithMeta = Project & {
  authors: Profile[];
  uploader: Profile | null;
  starCount: number;
};

function Featured() {
  const [projects, setProjects] = useState<ProjectWithMeta[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    void load();
  }, []);

  async function load() {
    setLoading(true);
    const { data: rows } = await supabase.from("projects").select("*");
    if (!rows || rows.length === 0) {
      setProjects([]);
      setLoading(false);
      return;
    }
    const ids = rows.map((r: Project) => r.id);

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

    const authorsMap: Record<string, Profile[]> = {};
    (links ?? []).forEach((l: any) => {
      if (!authorsMap[l.project_id]) authorsMap[l.project_id] = [];
      if (l.profiles) authorsMap[l.project_id].push(l.profiles);
    });
    const uploaderMap: Record<string, Profile> = {};
    (ups ?? []).forEach((p: Profile) => (uploaderMap[p.id] = p));
    const starMap: Record<string, number> = {};
    (stars ?? []).forEach((s: any) => {
      starMap[s.project_id] = (starMap[s.project_id] ?? 0) + 1;
    });

    const enriched = rows
      .map((r: Project) => ({
        ...r,
        authors: authorsMap[r.id] ?? [],
        uploader: uploaderMap[r.uploader_id] ?? null,
        starCount: starMap[r.id] ?? 0,
      }))
      .sort((a: ProjectWithMeta, b: ProjectWithMeta) => {
        if (b.starCount !== a.starCount) return b.starCount - a.starCount;
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      });

    setProjects(enriched);
    setLoading(false);
  }

  const top = projects[0];
  const rest = projects.slice(1);

  return (
    <div className="mx-auto max-w-5xl px-6 pt-28 pb-16">
      <div className="mb-10">
        <div className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-xs text-primary mb-4">
          <Sparkles className="h-3 w-3" />
          Community Favorites
        </div>
        <h1 className="text-3xl md:text-4xl font-semibold tracking-tight">Featured</h1>
        <p className="text-muted-foreground mt-1.5 text-[15px]">
          The Most-Starred Theses in The Forge.
        </p>
      </div>

      {loading ? (
        <div className="grid sm:grid-cols-2 gap-3">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="h-44 rounded-xl border border-border bg-card animate-pulse" />
          ))}
        </div>
      ) : projects.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border bg-card/40 p-16 text-center">
          <Trophy className="h-6 w-6 mx-auto mb-3 text-muted-foreground" />
          <h3 className="font-semibold text-base mb-1">No Featured Theses Yet</h3>
          <p className="text-sm text-muted-foreground">
            Star projects you love — top-starred work appears here.
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {top && top.starCount > 0 && (
            <div
              className="relative overflow-hidden rounded-2xl border border-primary/40 bg-gradient-to-br from-primary/10 via-card to-card p-6 md:p-8"
              style={{ boxShadow: "var(--shadow-lg)" }}
            >
              <div
                aria-hidden
                className="absolute -top-20 -right-20 h-64 w-64 rounded-full opacity-40 blur-3xl"
                style={{ background: "var(--primary)" }}
              />
              <div className="relative">
                <div className="inline-flex items-center gap-1.5 rounded-full bg-primary/20 text-primary px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wider mb-3">
                  <Trophy className="h-3 w-3" /> #1 — {top.starCount} ★
                </div>
                <ProjectCard p={top} />
              </div>
            </div>
          )}
          <div className="grid sm:grid-cols-2 gap-3">
            {(top && top.starCount > 0 ? rest : projects).map((p) => (
              <ProjectCard key={p.id} p={p} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
