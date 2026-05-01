import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { supabase, type Project, type Profile, type Comment } from "@/lib/supabase";
import { useAuth } from "@/lib/auth-context";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
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
  ArrowLeft,
  FileText,
  Download,
  Calendar,
  MessageSquare,
  Loader2,
  Send,
  Pencil,
  Trash2,
  ExternalLink,
  AtSign,
} from "lucide-react";
import { UserAvatar } from "@/components/user-avatar";
import { ProfileHoverCard } from "@/components/user-hover-card";
import { StarButton } from "@/components/star-button";

export const Route = createFileRoute("/projects/$id")({
  head: ({ params }) => ({
    meta: [
      { title: `Project ${params.id} — The Forge` },
      { name: "description", content: "View thesis project details and discussion." },
    ],
  }),
  component: ProjectDetail,
});

type CommentWithAuthor = Comment & { author: Profile | null; isAuthor: boolean };

function renderBody(text: string) {
  const parts = text.split(/(\[@[^\]]+\])/g);
  return (
    <>
      {parts.map((part, i) => {
        const match = part.match(/^\[@([^\]]+)\]$/);
        if (match) {
          return (
            <span
              key={i}
              className="inline-flex items-center gap-0.5 rounded border border-primary/40 bg-primary/10 px-1.5 py-0 text-[12px] text-primary font-medium leading-5 mx-0.5"
            >
              @{match[1]}
            </span>
          );
        }
        return <span key={i}>{part}</span>;
      })}
    </>
  );
}

function ProjectDetailSkeleton() {
  return (
    <div className="mx-auto max-w-7xl px-6 pt-24 pb-16">
      <Skeleton className="h-4 w-28 mb-6" />
      <div className="grid lg:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)] gap-6">
        <div className="space-y-6">
          <div className="rounded-2xl border border-border bg-card p-6 md:p-7">
            <div className="flex items-start gap-4 mb-5">
              <Skeleton className="h-10 w-10 rounded-lg shrink-0" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-3 w-32" />
                <Skeleton className="h-7 w-5/6" />
                <Skeleton className="h-6 w-3/4" />
              </div>
            </div>
            <div className="flex flex-wrap gap-2 mb-5">
              <Skeleton className="h-6 w-24 rounded-full" />
              <Skeleton className="h-6 w-28 rounded-full" />
            </div>
            <Skeleton className="h-3 w-20 mb-2" />
            <Skeleton className="h-4 w-full mb-1.5" />
            <Skeleton className="h-4 w-full mb-1.5" />
            <Skeleton className="h-4 w-5/6 mb-1.5" />
            <Skeleton className="h-4 w-4/6" />
          </div>
          <div className="rounded-2xl border border-border bg-card p-6 md:p-7">
            <Skeleton className="h-4 w-32 mb-4" />
            {[0, 1].map((i) => (
              <div key={i} className="rounded-xl border border-border bg-background/40 p-4 mb-2.5">
                <div className="flex items-center gap-2 mb-2">
                  <Skeleton className="h-5 w-5 rounded-full" />
                  <Skeleton className="h-3.5 w-28" />
                </div>
                <Skeleton className="h-3.5 w-full ml-7 mb-1" />
                <Skeleton className="h-3.5 w-5/6 ml-7" />
              </div>
            ))}
          </div>
        </div>
        <Skeleton className="rounded-2xl h-[80vh]" />
      </div>
    </div>
  );
}

function ProjectDetail() {
  const { id } = Route.useParams();
  const navigate = useNavigate();
  const { user, profile } = useAuth();
  const [project, setProject] = useState<Project | null>(null);
  const [authors, setAuthors] = useState<Profile[]>([]);
  const [uploader, setUploader] = useState<Profile | null>(null);
  const [comments, setComments] = useState<CommentWithAuthor[]>([]);
  const [body, setBody] = useState("");
  const [mentions, setMentions] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [posting, setPosting] = useState(false);
  const [fileUrl, setFileUrl] = useState<string | null>(null);
  const [notFound, setNotFound] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const isOwner = !!user && !!project && user.id === project.uploader_id;

  useEffect(() => {
    void load();
  }, [id]);

  async function load() {
    setLoading(true);
    const { data: p } = await supabase
      .from("projects")
      .select("*")
      .eq("id", id)
      .maybeSingle();
    if (!p) {
      setNotFound(true);
      setLoading(false);
      return;
    }
    setProject(p as Project);

    const [{ data: links }, { data: up }] = await Promise.all([
      supabase
        .from("project_authors")
        .select("user_id, profiles:user_id(*)")
        .eq("project_id", id),
      supabase.from("profiles").select("*").eq("id", p.uploader_id).maybeSingle(),
    ]);
    const authorsList: Profile[] = (links ?? [])
      .map((l: any) => l.profiles)
      .filter(Boolean);
    setAuthors(authorsList);
    setUploader(up as Profile | null);

    if (p.file_path) {
      const { data: signed } = await supabase.storage
        .from("theses")
        .createSignedUrl(p.file_path, 60 * 60);
      setFileUrl(signed?.signedUrl ?? null);
    }

    await loadComments(authorsList);
    setLoading(false);
  }

  async function loadComments(authorsList: Profile[]) {
    const { data: cs } = await supabase
      .from("comments")
      .select("*")
      .eq("project_id", id)
      .order("created_at", { ascending: true });
    if (!cs) {
      setComments([]);
      return;
    }
    const userIds = Array.from(new Set(cs.map((c: Comment) => c.user_id)));
    const { data: profs } = userIds.length
      ? await supabase.from("profiles").select("*").in("id", userIds)
      : { data: [] as Profile[] };
    const profMap: Record<string, Profile> = {};
    (profs ?? []).forEach((p: Profile) => (profMap[p.id] = p));
    const authorIds = new Set(authorsList.map((a) => a.id));
    setComments(
      cs.map((c: Comment) => ({
        ...c,
        author: profMap[c.user_id] ?? null,
        isAuthor: authorIds.has(c.user_id),
      })),
    );
  }

  function tagUser(commentAuthor: Profile | null) {
    if (!commentAuthor || !user) return;
    const tag = commentAuthor.display_name?.trim() || commentAuthor.email?.split("@")[0] || "user";
    const token = `[@${tag}]`;
    setBody((prev) => {
      const base = prev.trimEnd();
      return base ? `${base} ${token} ` : `${token} `;
    });
    setMentions((prev) => {
      if (prev.find((m) => m.id === commentAuthor.id)) return prev;
      return [...prev, commentAuthor];
    });
    setTimeout(() => {
      textareaRef.current?.focus();
    }, 0);
  }

  function removeMention(m: Profile) {
    setMentions((prev) => prev.filter((x) => x.id !== m.id));
    const tag = m.display_name?.trim() || m.email?.split("@")[0] || "user";
    const token = `[@${tag}]`;
    setBody((prev) => prev.replace(token + " ", "").replace(token, ""));
  }

  async function postComment(e: React.FormEvent) {
    e.preventDefault();
    if (!user) return;
    if (!body.trim() || body.trim().length < 2) {
      toast.error("Comment is too short");
      return;
    }
    if (body.length > 2000) {
      toast.error("Comment too long (2000 chars max)");
      return;
    }
    setPosting(true);
    const { error } = await supabase.from("comments").insert({
      project_id: id,
      user_id: user.id,
      body: body.trim(),
    });
    setPosting(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    setBody("");
    setMentions([]);
    toast.success("Comment posted");
    await loadComments(authors);
  }

  async function onDelete() {
    if (!project) return;
    const { error } = await supabase.from("projects").delete().eq("id", project.id);
    if (error) {
      toast.error(error.message);
      return;
    }
    if (project.file_path) {
      await supabase.storage.from("theses").remove([project.file_path]);
    }
    toast.success("Project deleted");
    navigate({ to: "/dashboard" });
  }

  if (loading) return <ProjectDetailSkeleton />;

  if (notFound || !project) {
    return (
      <div className="mx-auto max-w-2xl px-6 pt-32 text-center">
        <h1 className="text-2xl font-semibold tracking-tight">Project Not Found</h1>
        <Link to="/explore" className="text-primary hover:underline mt-4 inline-block text-sm">
          Back to Archive
        </Link>
      </div>
    );
  }

  const allAuthors = authors.length ? authors : uploader ? [uploader] : [];

  return (
    <div className="mx-auto max-w-7xl px-6 pt-24 pb-16">
      <Link
        to="/explore"
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground mb-6 transition-colors"
      >
        <ArrowLeft className="h-3.5 w-3.5" /> Back to Archive
      </Link>

      <div className="grid lg:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)] gap-6">
        {/* LEFT: info + discussion */}
        <div className="min-w-0 space-y-6">
          <article
            className="rounded-2xl border border-border bg-card p-6 md:p-7"
            style={{ boxShadow: "var(--shadow-md)" }}
          >
            <div className="flex items-start gap-4 mb-4">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/15 text-primary">
                <FileText className="h-5 w-5" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-xs text-muted-foreground mb-1.5">
                  Thesis ·{" "}
                  {new Date(project.created_at).toLocaleDateString(undefined, {
                    month: "long",
                    day: "numeric",
                    year: "numeric",
                  })}
                </div>
                <h1 className="text-2xl md:text-[28px] font-semibold tracking-tight leading-tight">
                  {project.title}
                </h1>
              </div>
            </div>

            {/* Horizontal author chips */}
            {allAuthors.length > 0 && (
              <div className="flex flex-wrap items-center gap-1.5 mb-5">
                {allAuthors.map((a) => (
                  <ProfileHoverCard key={a.id} profile={a} side="bottom">
                    <Link to="/profiles/$id" params={{ id: a.id }}>
                      <div className="flex items-center gap-1.5 rounded-full border border-border bg-accent/30 pl-1 pr-2.5 py-0.5 hover:border-primary/40 hover:bg-accent/60 transition-colors cursor-pointer">
                        <UserAvatar profile={a} size="xs" />
                        <span className="text-xs font-medium leading-none">
                          {a.display_name || a.email?.split("@")[0] || "Unknown"}
                        </span>
                      </div>
                    </Link>
                  </ProfileHoverCard>
                ))}
              </div>
            )}

            <div>
              <h2 className="text-xs font-medium uppercase tracking-wider text-muted-foreground mb-2">
                Abstract
              </h2>
              <p className="text-[15px] leading-relaxed whitespace-pre-wrap text-foreground/90">
                {project.abstract}
              </p>
            </div>

            <div className="mt-7 pt-5 border-t border-border flex flex-wrap items-center gap-2">
              <StarButton projectId={project.id} />
              {fileUrl && (
                <a href={fileUrl} target="_blank" rel="noopener noreferrer">
                  <Button variant="outline">
                    <Download className="h-4 w-4" /> Download
                  </Button>
                </a>
              )}
              {isOwner && (
                <>
                  <Link to="/projects/$id/edit" params={{ id: project.id }}>
                    <Button variant="outline">
                      <Pencil className="h-4 w-4" /> Edit
                    </Button>
                  </Link>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="ghost" className="text-destructive hover:text-destructive">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Delete this thesis?</AlertDialogTitle>
                        <AlertDialogDescription>
                          This permanently deletes the project, PDF, comments, and stars. This cannot be undone.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={onDelete}
                          className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        >
                          Delete
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </>
              )}
              <span className="ml-auto flex items-center gap-1.5 text-xs text-muted-foreground">
                <Calendar className="h-3 w-3" />
                {new Date(project.created_at).toLocaleDateString()}
              </span>
            </div>
          </article>

          {/* Discussion */}
          <section
            className="rounded-2xl border border-border bg-card p-6 md:p-7"
            style={{ boxShadow: "var(--shadow-sm)" }}
          >
            <div className="flex items-center gap-2 mb-5">
              <MessageSquare className="h-4 w-4 text-muted-foreground" />
              <h2 className="text-sm font-semibold">
                Discussion{" "}
                <span className="text-muted-foreground font-normal">· {comments.length}</span>
              </h2>
              {user && (
                <span className="ml-auto text-[11px] text-muted-foreground flex items-center gap-1">
                  <AtSign className="h-3 w-3" /> Click a name to mention
                </span>
              )}
            </div>

            <div className="space-y-2.5 mb-5">
              {comments.length === 0 ? (
                <div className="rounded-xl border border-dashed border-border bg-card/40 p-8 text-center text-sm text-muted-foreground">
                  No comments yet.{" "}
                  {user ? "Start the discussion." : "Sign in to discuss."}
                </div>
              ) : (
                comments.map((c) => (
                  <div
                    key={c.id}
                    className="rounded-xl border border-border bg-background/40 p-4"
                  >
                    <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                      <ProfileHoverCard profile={c.author} side="top">
                        <Link
                          to="/profiles/$id"
                          params={{ id: c.author?.id ?? "" }}
                          onClick={(e) => { if (!c.author?.id) e.preventDefault(); }}
                        >
                          <UserAvatar profile={c.author} size="xs" />
                        </Link>
                      </ProfileHoverCard>
                      <ProfileHoverCard profile={c.author} side="top">
                        <button
                          className="text-sm font-semibold hover:text-primary transition-colors"
                          onClick={() => tagUser(c.author)}
                          title={user ? `Tag @${c.author?.display_name || c.author?.email}` : undefined}
                        >
                          {c.author?.display_name || c.author?.email || "Unknown User"}
                        </button>
                      </ProfileHoverCard>
                      {c.isAuthor && (
                        <span className="inline-flex items-center rounded-full bg-primary/20 text-primary px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide">
                          Author
                        </span>
                      )}
                      <span className="text-xs text-muted-foreground ml-auto">
                        {new Date(c.created_at).toLocaleDateString(undefined, {
                          month: "short",
                          day: "numeric",
                          hour: "numeric",
                          minute: "2-digit",
                        })}
                      </span>
                    </div>
                    <p className="text-sm whitespace-pre-wrap leading-relaxed text-foreground/90 pl-7">
                      {renderBody(c.body)}
                    </p>
                  </div>
                ))
              )}
            </div>

            {user ? (
              <form
                onSubmit={postComment}
                className="rounded-xl border border-border bg-background/40 p-4"
              >
                <div className="flex items-center gap-2 mb-3 text-xs text-muted-foreground">
                  <UserAvatar profile={profile} size="xs" />
                  Commenting as{" "}
                  <span className="text-foreground font-medium">
                    {profile?.display_name || user.email}
                  </span>
                </div>

                {mentions.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mb-2">
                    {mentions.map((m) => (
                      <div
                        key={m.id}
                        className="flex items-center gap-1 rounded-md border border-primary/40 bg-primary/10 pl-1 pr-1.5 py-0.5 text-[11px] text-primary"
                      >
                        <UserAvatar profile={m} size="xs" />
                        <span className="font-medium">
                          @{m.display_name?.trim() || m.email?.split("@")[0]}
                        </span>
                        <button
                          type="button"
                          onClick={() => removeMention(m)}
                          className="ml-0.5 leading-none hover:text-primary/60 transition-colors"
                          aria-label="Remove mention"
                        >
                          ×
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                <Textarea
                  ref={textareaRef}
                  value={body}
                  onChange={(e) => setBody(e.target.value)}
                  placeholder="Add to the discussion…"
                  rows={3}
                  maxLength={2000}
                  required
                  className="resize-none"
                />
                <div className="flex items-center justify-between mt-3">
                  <span className="text-[11px] text-muted-foreground">
                    {body.length} / 2000
                  </span>
                  <Button type="submit" disabled={posting} size="sm">
                    {posting ? (
                      <Loader2 className="h-3 w-3 animate-spin" />
                    ) : (
                      <Send className="h-3 w-3" />
                    )}
                    Post
                  </Button>
                </div>
              </form>
            ) : (
              <div className="rounded-xl border border-border bg-background/40 p-6 text-center">
                <p className="text-sm mb-3">Sign in to join the discussion.</p>
                <Link to="/login">
                  <Button size="sm">Sign In</Button>
                </Link>
              </div>
            )}
          </section>
        </div>

        {/* RIGHT: PDF preview */}
        <aside className="min-w-0">
          <div
            className="lg:sticky lg:top-20 rounded-2xl border border-border bg-card overflow-hidden"
            style={{ boxShadow: "var(--shadow-md)" }}
          >
            <div className="flex items-center justify-between px-4 py-2.5 border-b border-border bg-background/40">
              <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
                <FileText className="h-3.5 w-3.5" />
                {project.file_name || "Document"}
              </div>
              {fileUrl && (
                <a
                  href={fileUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-muted-foreground hover:text-foreground inline-flex items-center gap-1"
                >
                  Open <ExternalLink className="h-3 w-3" />
                </a>
              )}
            </div>
            {fileUrl ? (
              <iframe
                src={fileUrl}
                title={project.title}
                className="w-full h-[80vh] bg-background"
              />
            ) : (
              <div className="h-[80vh] flex items-center justify-center text-sm text-muted-foreground">
                No PDF attached.
              </div>
            )}
          </div>
        </aside>
      </div>
    </div>
  );
}
