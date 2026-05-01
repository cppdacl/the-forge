import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { supabase, type Project, type Profile } from "@/lib/supabase";
import { useAuth } from "@/lib/auth-context";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import {
  Loader2,
  ArrowLeft,
  FileText,
  Upload,
  X,
  RefreshCw,
  CheckCircle2,
  Save,
} from "lucide-react";
import { z } from "zod";

export const Route = createFileRoute("/projects/$id_/edit")({
  head: () => ({
    meta: [{ title: "Edit Thesis — The Forge" }],
  }),
  component: EditProject,
});

const schema = z.object({
  title: z.string().trim().min(3, "Title must be at least 3 characters").max(200),
  abstract: z.string().trim().min(20, "Abstract must be at least 20 characters").max(5000),
});

function EditProject() {
  const { id } = Route.useParams();
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();

  const [project, setProject] = useState<Project | null>(null);
  const [authors, setAuthors] = useState<Profile[]>([]);
  const [title, setTitle] = useState("");
  const [abstract, setAbstract] = useState("");
  const [currentFileUrl, setCurrentFileUrl] = useState<string | null>(null);
  const [newFile, setNewFile] = useState<File | null>(null);
  const [removeFile, setRemoveFile] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!authLoading && !user) navigate({ to: "/login" });
  }, [user, authLoading, navigate]);

  useEffect(() => {
    if (!user) return;
    void load();
  }, [id, user]); // eslint-disable-line

  async function load() {
    setLoading(true);
    const { data } = await supabase
      .from("projects")
      .select("*")
      .eq("id", id)
      .maybeSingle();

    if (!data) {
      toast.error("Project not found");
      navigate({ to: "/dashboard" });
      return;
    }
    if (data.uploader_id !== user!.id) {
      toast.error("You don't have permission to edit this project");
      navigate({ to: "/projects/$id", params: { id } });
      return;
    }

    setProject(data as Project);
    setTitle(data.title);
    setAbstract(data.abstract);

    // Load current PDF signed URL
    if (data.file_path) {
      const { data: signed } = await supabase.storage
        .from("theses")
        .createSignedUrl(data.file_path, 60 * 60);
      setCurrentFileUrl(signed?.signedUrl ?? null);
    }

    // Load authors
    const { data: links } = await supabase
      .from("project_authors")
      .select("user_id, profiles:user_id(*)")
      .eq("project_id", id);
    const authorsList: Profile[] = (links ?? [])
      .map((l: any) => l.profiles)
      .filter(Boolean);
    setAuthors(authorsList);

    setLoading(false);
  }

  async function onSave(e: React.FormEvent) {
    e.preventDefault();
    if (!project || !user) return;

    const parsed = schema.safeParse({ title, abstract });
    if (!parsed.success) {
      toast.error(parsed.error.issues[0].message);
      return;
    }
    if (newFile && newFile.type !== "application/pdf") {
      toast.error("Only PDF files are accepted");
      return;
    }
    if (newFile && newFile.size > 25 * 1024 * 1024) {
      toast.error("File must be under 25 MB");
      return;
    }

    setSaving(true);
    try {
      let filePath = project.file_path;
      let fileName = project.file_name;

      // Handle PDF replacement
      if (newFile) {
        const path = `${user.id}/${crypto.randomUUID()}.pdf`;
        const { error: upErr } = await supabase.storage
          .from("theses")
          .upload(path, newFile, { contentType: "application/pdf", upsert: false });
        if (upErr) throw upErr;

        // Delete old file if existed
        if (project.file_path) {
          await supabase.storage.from("theses").remove([project.file_path]);
        }
        filePath = path;
        fileName = newFile.name;
      } else if (removeFile) {
        // Remove PDF without replacing
        if (project.file_path) {
          await supabase.storage.from("theses").remove([project.file_path]);
        }
        filePath = null;
        fileName = null;
      }

      // Update project record
      const { error: pErr } = await supabase
        .from("projects")
        .update({
          title: parsed.data.title,
          abstract: parsed.data.abstract,
          file_path: filePath,
          file_name: fileName,
        })
        .eq("id", id);
      if (pErr) throw pErr;

      // Sync authors: delete all then re-insert
      await supabase.from("project_authors").delete().eq("project_id", id);
      const ids = Array.from(new Set([user.id, ...authors.map((a) => a.id)]));
      const rows = ids.map((uid) => ({ project_id: id, user_id: uid }));
      const { error: aErr } = await supabase.from("project_authors").insert(rows);
      if (aErr) throw aErr;

      toast.success("Changes saved successfully");
      navigate({ to: "/projects/$id", params: { id } });
    } catch (err: any) {
      console.error(err);
      toast.error(err.message ?? "Failed to save changes");
    } finally {
      setSaving(false);
    }
  }

  if (loading || authLoading || !project) {
    return (
      <div className="mx-auto max-w-2xl px-6 py-32 text-center">
        <Loader2 className="h-5 w-5 animate-spin mx-auto text-muted-foreground" />
      </div>
    );
  }

  const hasExistingPdf = !!project.file_path && !removeFile && !newFile;
  const willReplace = !!newFile;

  return (
    <div className="mx-auto max-w-3xl px-6 pt-24 pb-16">
      {/* Header */}
      <div className="mb-8">
        <Link
          to="/projects/$id"
          params={{ id }}
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground mb-4 transition-colors"
        >
          <ArrowLeft className="h-3.5 w-3.5" /> Back to Project
        </Link>
        <h1 className="text-3xl font-semibold tracking-tight">Edit Thesis</h1>
        <p className="text-muted-foreground text-[15px] mt-1.5">
          Update any details below. Existing values are pre-loaded for your convenience.
        </p>
      </div>

      <form onSubmit={onSave} className="space-y-5">
        {/* Title */}
        <div
          className="rounded-2xl border border-border bg-card p-5 md:p-6 space-y-3"
          style={{ boxShadow: "var(--shadow-sm)" }}
        >
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Title
            </span>
          </div>
          <Label htmlFor="title" className="sr-only">Title</Label>
          <Input
            id="title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            maxLength={200}
            required
            className="text-base font-medium"
            placeholder="Thesis title"
          />
          <div className="text-[11px] text-muted-foreground text-right">
            {title.length} / 200
          </div>
        </div>

        {/* Abstract */}
        <div
          className="rounded-2xl border border-border bg-card p-5 md:p-6 space-y-3"
          style={{ boxShadow: "var(--shadow-sm)" }}
        >
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Abstract
            </span>
          </div>
          <Label htmlFor="abstract" className="sr-only">Abstract</Label>
          <Textarea
            id="abstract"
            value={abstract}
            onChange={(e) => setAbstract(e.target.value)}
            rows={8}
            maxLength={5000}
            required
            className="resize-none text-[15px] leading-relaxed"
            placeholder="A short summary of the work, its methods, and its contribution…"
          />
          <div className="text-[11px] text-muted-foreground text-right">
            {abstract.length} / 5000
          </div>
        </div>

        {/* PDF */}
        <div
          className="rounded-2xl border border-border bg-card p-5 md:p-6 space-y-3"
          style={{ boxShadow: "var(--shadow-sm)" }}
        >
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              PDF File
            </span>
          </div>

          <input
            ref={fileRef}
            type="file"
            accept="application/pdf"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0] ?? null;
              setNewFile(f);
              setRemoveFile(false);
            }}
          />

          {/* New file selected */}
          {willReplace && (
            <div className="flex items-center justify-between gap-3 rounded-xl border border-primary/30 bg-primary/5 p-3.5">
              <div className="flex items-center gap-3 min-w-0">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/15 text-primary">
                  <FileText className="h-4.5 w-4.5" />
                </div>
                <div className="min-w-0">
                  <div className="text-sm font-medium truncate">{newFile!.name}</div>
                  <div className="text-xs text-muted-foreground">
                    {(newFile!.size / 1024 / 1024).toFixed(2)} MB · Will replace current file
                  </div>
                </div>
              </div>
              <Button
                type="button"
                size="sm"
                variant="ghost"
                onClick={() => {
                  setNewFile(null);
                  if (fileRef.current) fileRef.current.value = "";
                }}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          )}

          {/* Existing file (no change) */}
          {hasExistingPdf && (
            <div className="flex items-center justify-between gap-3 rounded-xl border border-border bg-accent/20 p-3.5">
              <div className="flex items-center gap-3 min-w-0">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground">
                  <FileText className="h-4 w-4" />
                </div>
                <div className="min-w-0">
                  <div className="text-sm font-medium truncate">
                    {project.file_name || "thesis.pdf"}
                  </div>
                  <div className="text-xs text-muted-foreground">Current file · no changes</div>
                </div>
              </div>
              <div className="flex items-center gap-1 shrink-0">
                {currentFileUrl && (
                  <a href={currentFileUrl} target="_blank" rel="noopener noreferrer">
                    <Button type="button" size="sm" variant="ghost" className="text-xs">
                      Preview
                    </Button>
                  </a>
                )}
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={() => fileRef.current?.click()}
                  className="gap-1.5 text-xs"
                >
                  <RefreshCw className="h-3.5 w-3.5" /> Replace
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant="ghost"
                  className="text-destructive hover:text-destructive"
                  onClick={() => setRemoveFile(true)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}

          {/* File removed */}
          {removeFile && !newFile && (
            <div className="flex items-center justify-between gap-3 rounded-xl border border-destructive/30 bg-destructive/5 p-3.5">
              <div className="flex items-center gap-3 min-w-0">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-destructive/10 text-destructive">
                  <X className="h-4 w-4" />
                </div>
                <div className="min-w-0">
                  <div className="text-sm font-medium truncate">
                    {project.file_name || "thesis.pdf"}
                  </div>
                  <div className="text-xs text-destructive/70">Will be removed on save</div>
                </div>
              </div>
              <Button
                type="button"
                size="sm"
                variant="ghost"
                onClick={() => setRemoveFile(false)}
              >
                Undo
              </Button>
            </div>
          )}

          {/* No file at all */}
          {!project.file_path && !newFile && (
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              className="w-full rounded-xl border-2 border-dashed border-border hover:border-primary/40 hover:bg-accent/30 transition-colors p-8 text-center"
            >
              <Upload className="h-5 w-5 mx-auto mb-2 text-muted-foreground" />
              <div className="text-sm font-medium">Click to attach PDF</div>
              <div className="text-xs text-muted-foreground mt-1">Up to 25 MB</div>
            </button>
          )}

          {willReplace && (
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              className="w-full rounded-xl border-2 border-dashed border-border hover:border-primary/40 hover:bg-accent/20 transition-colors py-4 text-center text-sm text-muted-foreground hover:text-foreground"
            >
              <Upload className="h-4 w-4 mx-auto mb-1" />
              Choose a different file
            </button>
          )}
        </div>

        {/* Authors */}
        <div
          className="rounded-2xl border border-border bg-card p-5 md:p-6 space-y-3"
          style={{ boxShadow: "var(--shadow-sm)" }}
        >
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Authors
            </span>
          </div>
          <AuthorPicker
            authors={authors}
            setAuthors={setAuthors}
            currentUserId={user!.id}
          />
        </div>

        {/* Actions */}
        <div className="flex items-center justify-between pt-2">
          <Link to="/projects/$id" params={{ id }}>
            <Button type="button" variant="ghost">
              Cancel
            </Button>
          </Link>
          <Button type="submit" disabled={saving} className="gap-2 min-w-[140px]">
            {saving ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Saving…
              </>
            ) : (
              <>
                <Save className="h-4 w-4" />
                Save Changes
              </>
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}

function AuthorPicker({
  authors,
  setAuthors,
  currentUserId,
}: {
  authors: Profile[];
  setAuthors: (a: Profile[]) => void;
  currentUserId: string;
}) {
  const [q, setQ] = useState("");
  const [results, setResults] = useState<Profile[]>([]);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!q.trim()) {
      setResults([]);
      setOpen(false);
      return;
    }
    const t = setTimeout(async () => {
      const { data } = await supabase
        .from("profiles")
        .select("*")
        .or(`display_name.ilike.%${q}%,email.ilike.%${q}%`)
        .limit(8);
      setResults((data ?? []) as Profile[]);
      setOpen(true);
    }, 200);
    return () => clearTimeout(t);
  }, [q]);

  function add(p: Profile) {
    if (!authors.find((a) => a.id === p.id)) {
      setAuthors([...authors, p]);
    }
    setQ("");
    setResults([]);
    setOpen(false);
  }

  function remove(id: string) {
    if (id === currentUserId) return;
    setAuthors(authors.filter((a) => a.id !== id));
  }

  return (
    <div className="space-y-3">
      {/* Current authors list */}
      <div className="flex flex-wrap gap-2">
        {authors.map((a) => {
          const isMe = a.id === currentUserId;
          return (
            <span
              key={a.id}
              className="inline-flex items-center gap-1.5 rounded-full border border-border bg-accent/40 px-3 py-1 text-sm font-medium"
            >
              {isMe && <CheckCircle2 className="h-3 w-3 text-primary shrink-0" />}
              <span className="max-w-[160px] truncate">{a.display_name || a.email}</span>
              {!isMe && (
                <button
                  type="button"
                  onClick={() => remove(a.id)}
                  className="text-muted-foreground hover:text-destructive ml-0.5 transition-colors"
                  title="Remove author"
                >
                  <X className="h-3 w-3" />
                </button>
              )}
            </span>
          );
        })}
      </div>

      {/* Search input */}
      <div className="relative">
        <Input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search and add co-authors by name or email…"
          onFocus={() => results.length && setOpen(true)}
          onBlur={() => setTimeout(() => setOpen(false), 150)}
        />
        {open && results.length > 0 && (
          <div className="absolute top-full left-0 right-0 mt-1 z-10 rounded-xl border border-border bg-popover shadow-lg overflow-hidden">
            {results.map((r) => {
              const already = !!authors.find((a) => a.id === r.id);
              return (
                <button
                  key={r.id}
                  type="button"
                  onMouseDown={() => !already && add(r)}
                  disabled={already}
                  className="w-full text-left px-3.5 py-2.5 hover:bg-accent disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-between text-sm transition-colors"
                >
                  <span>{r.display_name || r.email}</span>
                  {already ? (
                    <span className="text-[10px] text-muted-foreground">Added</span>
                  ) : (
                    <span className="text-[10px] text-primary">+ Add</span>
                  )}
                </button>
              );
            })}
          </div>
        )}
        {q && open && results.length === 0 && (
          <div className="absolute top-full left-0 right-0 mt-1 z-10 rounded-xl border border-border bg-popover px-3.5 py-2.5 text-xs text-muted-foreground">
            No users match. They must sign up first.
          </div>
        )}
      </div>
      <p className="text-xs text-muted-foreground">
        You're always listed as an author and cannot be removed.
      </p>
    </div>
  );
}
