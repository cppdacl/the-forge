import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { supabase, type Profile } from "@/lib/supabase";
import { useAuth } from "@/lib/auth-context";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Upload, X, Loader2, FileText } from "lucide-react";
import { z } from "zod";

export const Route = createFileRoute("/projects/new")({
  head: () => ({
    meta: [
      { title: "Submit thesis — Forge" },
      { name: "description", content: "Upload a new thesis project to Forge." },
    ],
  }),
  component: NewProject,
});

const schema = z.object({
  title: z.string().trim().min(3, "Title must be at least 3 characters").max(200),
  abstract: z.string().trim().min(20, "Abstract must be at least 20 characters").max(5000),
});

function NewProject() {
  const { user, profile, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [title, setTitle] = useState("");
  const [abstract, setAbstract] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [authors, setAuthors] = useState<Profile[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!authLoading && !user) {
      void navigate({ to: "/login" });
    }
  }, [user, authLoading, navigate]);

  useEffect(() => {
    if (profile && authors.length === 0) {
      setAuthors([profile]);
    }
  }, [profile]); // eslint-disable-line react-hooks/exhaustive-deps

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!user) return;

    const parsed = schema.safeParse({ title, abstract });
    if (!parsed.success) {
      toast.error(parsed.error.issues[0].message);
      return;
    }
    if (!file) {
      toast.error("Please attach a PDF file");
      return;
    }
    if (file.type !== "application/pdf") {
      toast.error("Only PDF files are accepted");
      return;
    }
    if (file.size > 25 * 1024 * 1024) {
      toast.error("File must be under 25 MB");
      return;
    }

    setSubmitting(true);
    try {
      const ext = "pdf";
      const path = `${user.id}/${crypto.randomUUID()}.${ext}`;
      const { error: upErr } = await supabase.storage
        .from("theses")
        .upload(path, file, { contentType: "application/pdf", upsert: false });
      if (upErr) throw upErr;

      const { data: project, error: pErr } = await supabase
        .from("projects")
        .insert({
          title: parsed.data.title,
          abstract: parsed.data.abstract,
          file_path: path,
          file_name: file.name,
          uploader_id: user.id,
        })
        .select()
        .single();
      if (pErr) throw pErr;

      const ids = Array.from(new Set([user.id, ...authors.map((a) => a.id)]));
      const rows = ids.map((uid) => ({ project_id: project.id, user_id: uid }));
      const { error: aErr } = await supabase.from("project_authors").insert(rows);
      if (aErr) throw aErr;

      toast.success("Thesis submitted");
      void navigate({ to: "/projects/$id", params: { id: project.id } });
    } catch (err: any) {
      console.error(err);
      toast.error(err.message ?? "Failed to submit");
    } finally {
      setSubmitting(false);
    }
  }

  if (authLoading || !user) {
    return (
      <div className="mx-auto max-w-3xl px-6 py-20 text-center">
        <Loader2 className="h-5 w-5 animate-spin mx-auto text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl px-6 pt-28 pb-16">
      <h1 className="text-3xl font-semibold tracking-tight mb-1.5">Submit a Thesis</h1>
      <p className="text-muted-foreground text-[15px] mb-8">
        Upload your PDF, write an abstract, tag your co-authors.
      </p>

      <form
        onSubmit={onSubmit}
        className="space-y-6 rounded-2xl border border-border bg-card p-6 md:p-7"
        style={{ boxShadow: "var(--shadow-md)" }}
      >
        <div className="space-y-1.5">
          <Label htmlFor="title" className="text-sm font-medium">
            Title
          </Label>
          <Input
            id="title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="A thesis on something quite important"
            maxLength={200}
            required
          />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="abstract" className="text-sm font-medium">
            Abstract
          </Label>
          <Textarea
            id="abstract"
            value={abstract}
            onChange={(e) => setAbstract(e.target.value)}
            placeholder="A short summary of the work, its methods, and its contribution…"
            rows={6}
            maxLength={5000}
            required
            className="resize-none"
          />
          <div className="text-[11px] text-muted-foreground text-right">
            {abstract.length} / 5000
          </div>
        </div>

        <div className="space-y-1.5">
          <Label className="text-sm font-medium">PDF file</Label>
          <input
            ref={fileRef}
            type="file"
            accept="application/pdf"
            className="hidden"
            onChange={(e) => setFile(e.target.files?.[0] ?? null)}
          />
          {file ? (
            <div className="flex items-center justify-between gap-3 rounded-lg border border-border bg-accent/30 p-3.5">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary">
                  <FileText className="h-4 w-4" />
                </div>
                <div className="min-w-0">
                  <div className="text-sm font-medium truncate">{file.name}</div>
                  <div className="text-xs text-muted-foreground">
                    {(file.size / 1024 / 1024).toFixed(2)} MB
                  </div>
                </div>
              </div>
              <Button
                type="button"
                size="sm"
                variant="ghost"
                onClick={() => {
                  setFile(null);
                  if (fileRef.current) fileRef.current.value = "";
                }}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              className="w-full rounded-lg border-2 border-dashed border-border hover:border-primary/40 hover:bg-accent/30 transition-colors p-8 text-center"
            >
              <Upload className="h-5 w-5 mx-auto mb-2 text-muted-foreground" />
              <div className="text-sm font-medium">Click to attach PDF</div>
              <div className="text-xs text-muted-foreground mt-1">Up to 25 MB</div>
            </button>
          )}
        </div>

        <div className="space-y-1.5">
          <Label className="text-sm font-medium">Authors</Label>
          <AuthorPicker authors={authors} setAuthors={setAuthors} currentUserId={user.id} />
        </div>

        <div className="flex items-center justify-end gap-2 pt-4 border-t border-border">
          <Link to="/explore">
            <Button type="button" variant="ghost">
              Cancel
            </Button>
          </Link>
          <Button type="submit" disabled={submitting}>
            {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
            {submitting ? "Submitting…" : "Submit thesis"}
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
    <div>
      <div className="flex flex-wrap gap-1.5 mb-2">
        {authors.map((a) => (
          <span
            key={a.id}
            className="inline-flex items-center gap-1.5 rounded-full border border-border bg-accent/40 px-2.5 py-1 text-xs font-medium"
          >
            <span className="h-1.5 w-1.5 rounded-full bg-primary" />
            {a.display_name || a.email}
            {a.id !== currentUserId && (
              <button
                type="button"
                onClick={() => remove(a.id)}
                className="text-muted-foreground hover:text-destructive ml-0.5"
              >
                <X className="h-3 w-3" />
              </button>
            )}
          </span>
        ))}
      </div>
      <div className="relative">
        <Input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search co-authors by name or email"
          onFocus={() => results.length && setOpen(true)}
        />
        {open && results.length > 0 && (
          <div className="absolute top-full left-0 right-0 mt-1 z-10 rounded-lg border border-border bg-popover shadow-lg overflow-hidden">
            {results.map((r) => {
              const already = !!authors.find((a) => a.id === r.id);
              return (
                <button
                  key={r.id}
                  type="button"
                  onClick={() => !already && add(r)}
                  disabled={already}
                  className="w-full text-left px-3 py-2 hover:bg-accent disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-between text-sm"
                >
                  <span>{r.display_name || r.email}</span>
                  {already && (
                    <span className="text-[10px] text-muted-foreground">Added</span>
                  )}
                </button>
              );
            })}
          </div>
        )}
        {q && open && results.length === 0 && (
          <div className="absolute top-full left-0 right-0 mt-1 z-10 rounded-lg border border-border bg-popover px-3 py-2 text-xs text-muted-foreground">
            No users match. They must sign up first to be tagged.
          </div>
        )}
      </div>
      <p className="mt-2 text-xs text-muted-foreground">
        You're added by default. Tagged users must already have an account.
      </p>
    </div>
  );
}
