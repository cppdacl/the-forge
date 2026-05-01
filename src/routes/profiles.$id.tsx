import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase, type Profile, type Project } from "@/lib/supabase";
import { useAuth } from "@/lib/auth-context";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { UserAvatar } from "@/components/user-avatar";
import { StarButton } from "@/components/star-button";
import {
  Linkedin,
  Github,
  Mail,
  Phone,
  GraduationCap,
  Building2,
  FileText,
  Calendar,
  Settings,
  Globe,
  Star,
  BookOpen,
} from "lucide-react";

export const Route = createFileRoute("/profiles/$id")({
  head: () => ({
    meta: [
      { title: "Profile — The Forge" },
      { name: "description", content: "Researcher profile on The Forge." },
    ],
  }),
  component: ProfilePage,
});

type ProjectWithMeta = Project & { starCount: number; authorCount: number };

function ProfilePage() {
  const { id } = Route.useParams();
  const { user } = useAuth();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [projects, setProjects] = useState<ProjectWithMeta[]>([]);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  const isOwn = user?.id === id;

  useEffect(() => {
    void load();
  }, [id]);

  async function load() {
    setLoading(true);
    const { data: prof } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", id)
      .maybeSingle();
    if (!prof) {
      setNotFound(true);
      setLoading(false);
      return;
    }
    setProfile(prof as Profile);

    const [{ data: authorLinks }, { data: uploaderProjs }] = await Promise.all([
      supabase.from("project_authors").select("project_id").eq("user_id", id),
      supabase.from("projects").select("*").eq("uploader_id", id),
    ]);

    const authoredIds = (authorLinks ?? []).map((l: any) => l.project_id as string);
    const uploaderIds = (uploaderProjs ?? []).map((p: any) => p.id as string);
    const allIds = Array.from(new Set([...authoredIds, ...uploaderIds]));

    if (!allIds.length) {
      setProjects([]);
      setLoading(false);
      return;
    }

    const [{ data: allProjs }, { data: stars }, { data: authorCounts }] = await Promise.all([
      supabase.from("projects").select("*").in("id", allIds).order("created_at", { ascending: false }),
      supabase.from("project_stars").select("project_id").in("project_id", allIds),
      supabase.from("project_authors").select("project_id").in("project_id", allIds),
    ]);

    const starMap: Record<string, number> = {};
    (stars ?? []).forEach((s: any) => {
      starMap[s.project_id] = (starMap[s.project_id] ?? 0) + 1;
    });
    const countMap: Record<string, number> = {};
    (authorCounts ?? []).forEach((a: any) => {
      countMap[a.project_id] = (countMap[a.project_id] ?? 0) + 1;
    });

    setProjects(
      (allProjs ?? []).map((p: Project) => ({
        ...p,
        starCount: starMap[p.id] ?? 0,
        authorCount: countMap[p.id] ?? 0,
      })),
    );
    setLoading(false);
  }

  if (loading) return <ProfileSkeleton />;

  if (notFound || !profile) {
    return (
      <div className="mx-auto max-w-2xl px-6 pt-32 text-center">
        <h1 className="text-2xl font-semibold">Profile Not Found</h1>
        <Link to="/explore" className="text-primary hover:underline mt-4 inline-block text-sm">
          Back to Archive
        </Link>
      </div>
    );
  }

  const name = profile.display_name || profile.email?.split("@")[0] || "Unknown";
  const totalStars = projects.reduce((sum, p) => sum + p.starCount, 0);
  const joinYear = new Date(profile.created_at).getFullYear();

  return (
    <div className="mx-auto max-w-4xl px-6 pt-28 pb-16">
      {/* Profile header card */}
      <div
        className="rounded-2xl border border-border bg-card overflow-hidden mb-6"
        style={{ boxShadow: "var(--shadow-md)" }}
      >
        {/* Banner */}
        <div className="h-28 bg-gradient-to-r from-primary/20 via-emerald-500/10 to-primary/5 relative">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(120,200,120,0.15),rgba(255,255,255,0))]" />
        </div>

        <div className="px-6 pb-6 -mt-12 relative">
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
            <div className="flex items-end gap-4">
              <div className="ring-4 ring-background rounded-full shrink-0">
                <UserAvatar profile={profile} size="xl" />
              </div>
              <div className="min-w-0 pb-1 pt-12 sm:pt-14">
                <h1 className="text-2xl font-semibold tracking-tight leading-tight truncate">{name}</h1>
                {profile.email && (
                  <p className="text-sm text-muted-foreground mt-0.5 truncate">{profile.email}</p>
                )}
              </div>
            </div>
            {isOwn && (
              <div className="shrink-0 pt-14 sm:pt-14">
                <Link to="/profiles/$id/edit" params={{ id: id }}>
                  <Button variant="outline" size="sm">
                    <Settings className="h-4 w-4" /> Edit Profile
                  </Button>
                </Link>
              </div>
            )}
          </div>

          {/* School / Institution */}
          {(profile.school || profile.institution) && (
            <div className="flex flex-wrap items-center gap-3 mt-4">
              {profile.school && (
                <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                  <GraduationCap className="h-4 w-4 text-primary/70" />
                  {profile.school}
                </div>
              )}
              {profile.institution && (
                <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                  <Building2 className="h-4 w-4 text-primary/70" />
                  {profile.institution}
                </div>
              )}
            </div>
          )}

          {/* Bio */}
          {profile.bio && (
            <p className="mt-4 text-sm text-foreground/80 leading-relaxed max-w-2xl">
              {profile.bio}
            </p>
          )}

          {/* Stats */}
          <div className="flex flex-wrap gap-5 mt-5">
            <div className="flex items-center gap-1.5 text-sm">
              <BookOpen className="h-4 w-4 text-primary/70" />
              <span className="font-semibold">{projects.length}</span>
              <span className="text-muted-foreground">{projects.length === 1 ? "Project" : "Projects"}</span>
            </div>
            <div className="flex items-center gap-1.5 text-sm">
              <Star className="h-4 w-4 text-primary/70" />
              <span className="font-semibold">{totalStars}</span>
              <span className="text-muted-foreground">Stars received</span>
            </div>
            <div className="flex items-center gap-1.5 text-sm">
              <Calendar className="h-4 w-4 text-primary/70" />
              <span className="text-muted-foreground">Joined {joinYear}</span>
            </div>
          </div>

          {/* Social links */}
          {(profile.linkedin_url || profile.github_url || profile.email || profile.phone) && (
            <div className="flex flex-wrap gap-2 mt-4 pt-4 border-t border-border/60">
              {profile.linkedin_url && (
                <a
                  href={profile.linkedin_url.startsWith("http") ? profile.linkedin_url : `https://${profile.linkedin_url}`}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <Button variant="outline" size="sm" className="h-8 gap-1.5 text-xs">
                    <Linkedin className="h-3.5 w-3.5" /> LinkedIn
                  </Button>
                </a>
              )}
              {profile.github_url && (
                <a
                  href={profile.github_url.startsWith("http") ? profile.github_url : `https://github.com/${profile.github_url}`}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <Button variant="outline" size="sm" className="h-8 gap-1.5 text-xs">
                    <Github className="h-3.5 w-3.5" /> GitHub
                  </Button>
                </a>
              )}
              {profile.email && (
                <a href={`mailto:${profile.email}`}>
                  <Button variant="outline" size="sm" className="h-8 gap-1.5 text-xs">
                    <Mail className="h-3.5 w-3.5" /> Email
                  </Button>
                </a>
              )}
              {profile.phone && (
                <a href={`tel:${profile.phone}`}>
                  <Button variant="outline" size="sm" className="h-8 gap-1.5 text-xs">
                    <Phone className="h-3.5 w-3.5" /> {profile.phone}
                  </Button>
                </a>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Projects */}
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-lg font-semibold">
          {isOwn ? "My Theses" : `${name}'s Theses`}
        </h2>
        <span className="text-xs text-muted-foreground">
          {projects.length} {projects.length === 1 ? "project" : "projects"}
        </span>
      </div>

      {projects.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border bg-card/40 p-14 text-center">
          <Globe className="h-6 w-6 mx-auto mb-3 text-muted-foreground" />
          <h3 className="font-semibold mb-1">No Published Theses Yet</h3>
          {isOwn && (
            <p className="text-sm text-muted-foreground mb-4">
              Share your research with the community.
            </p>
          )}
          {isOwn && (
            <Link to="/projects/new">
              <Button size="sm">Submit Thesis</Button>
            </Link>
          )}
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 gap-3">
          {projects.map((p) => (
            <Link
              key={p.id}
              to="/projects/$id"
              params={{ id: p.id }}
              className="group rounded-xl border border-border bg-card p-5 hover:border-primary/40 hover:bg-accent/20 transition-all flex flex-col gap-3"
              style={{ boxShadow: "var(--shadow-sm)" }}
            >
              <div className="flex items-start gap-3">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/15 text-primary">
                  <FileText className="h-4 w-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-[15px] leading-snug group-hover:text-primary transition-colors line-clamp-2">
                    {p.title}
                  </h3>
                  <p className="text-sm text-muted-foreground line-clamp-2 mt-1 leading-relaxed">
                    {p.abstract}
                  </p>
                </div>
              </div>
              <div className="flex items-center justify-between pt-2 border-t border-border/60 text-xs text-muted-foreground">
                <StarButton projectId={p.id} variant="compact" />
                <span className="flex items-center gap-1">
                  <Calendar className="h-3 w-3" />
                  {new Date(p.created_at).toLocaleDateString(undefined, {
                    month: "short",
                    year: "numeric",
                  })}
                </span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

function ProfileSkeleton() {
  return (
    <div className="mx-auto max-w-4xl px-6 pt-28 pb-16">
      <div className="rounded-2xl border border-border bg-card overflow-hidden mb-6">
        <div className="h-28 bg-gradient-to-r from-primary/10 via-emerald-500/5 to-primary/5" />
        <div className="px-6 pb-6 -mt-12">
          <div className="flex items-end gap-4 mb-4">
            <Skeleton className="h-20 w-20 rounded-full ring-4 ring-background" />
            <div className="pb-1 space-y-2">
              <Skeleton className="h-6 w-40" />
              <Skeleton className="h-4 w-28" />
            </div>
          </div>
          <Skeleton className="h-4 w-52 mb-3" />
          <Skeleton className="h-4 w-full mb-1.5" />
          <Skeleton className="h-4 w-4/5 mb-5" />
          <div className="flex gap-4">
            <Skeleton className="h-4 w-20" />
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-4 w-16" />
          </div>
        </div>
      </div>
      <Skeleton className="h-5 w-32 mb-4" />
      <div className="grid sm:grid-cols-2 gap-3">
        {[0, 1].map((i) => (
          <div key={i} className="rounded-xl border border-border bg-card p-5">
            <div className="flex gap-3 mb-3">
              <Skeleton className="h-8 w-8 rounded-lg shrink-0" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-3.5 w-full" />
                <Skeleton className="h-3.5 w-5/6" />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
