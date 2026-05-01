import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { supabase, SUPABASE_URL, type Profile } from "@/lib/supabase";
import { useAuth } from "@/lib/auth-context";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { UserAvatar, getAvatarUrl } from "@/components/user-avatar";
import { toast } from "sonner";
import {
  ArrowLeft,
  Camera,
  Loader2,
  Save,
  Linkedin,
  Github,
  Mail,
  Phone,
  GraduationCap,
  Building2,
  User,
  FileText,
} from "lucide-react";

export const Route = createFileRoute("/profiles/$id_/edit")({
  head: () => ({
    meta: [{ title: "Edit Profile — The Forge" }],
  }),
  component: EditProfile,
});

function EditProfile() {
  const { id } = Route.useParams();
  const navigate = useNavigate();
  const { user, profile: authProfile, refreshProfile, loading: authLoading } = useAuth();
  const fileRef = useRef<HTMLInputElement>(null);

  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);

  const [form, setForm] = useState({
    display_name: "",
    bio: "",
    school: "",
    institution: "",
    linkedin_url: "",
    github_url: "",
    phone: "",
  });

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      navigate({ to: "/login" });
      return;
    }
    if (!id || id === "undefined" || user.id !== id) {
      navigate({ to: "/profiles/$id/edit", params: { id: user.id }, replace: true });
      return;
    }
    void load();
  }, [authLoading, user, id]);

  async function load() {
    setLoading(true);
    const { data } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", id)
      .maybeSingle();
    if (data) {
      const p = data as Profile;
      setProfile(p);
      setForm({
        display_name: p.display_name ?? "",
        bio: p.bio ?? "",
        school: p.school ?? "",
        institution: p.institution ?? "",
        linkedin_url: p.linkedin_url ?? "",
        github_url: p.github_url ?? "",
        phone: p.phone ?? "",
      });
    }
    setLoading(false);
  }

  async function handleAvatarChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    const maxMb = 5;
    if (file.size > maxMb * 1024 * 1024) {
      toast.error(`Image must be under ${maxMb}MB`);
      return;
    }
    if (!file.type.startsWith("image/")) {
      toast.error("Please select an image file");
      return;
    }

    setUploading(true);
    const ext = file.name.split(".").pop() ?? "jpg";
    const path = `${user.id}/${Date.now()}.${ext}`;

    if (profile?.custom_avatar_path && profile.custom_avatar_path !== path) {
      await supabase.storage.from("avatars").remove([profile.custom_avatar_path]);
    }

    const { error } = await supabase.storage
      .from("avatars")
      .upload(path, file, { upsert: true });

    if (error) {
      toast.error(`Upload failed: ${error.message}`);
      setUploading(false);
      return;
    }

    const { error: updateErr } = await supabase
      .from("profiles")
      .update({ custom_avatar_path: path })
      .eq("id", user.id);

    if (updateErr) {
      toast.error(updateErr.message);
    } else {
      const previewUrl = `${SUPABASE_URL}/storage/v1/object/public/avatars/${path}`;
      setAvatarPreview(previewUrl);
      setProfile((prev) => (prev ? { ...prev, custom_avatar_path: path } : prev));
      toast.success("Avatar updated");
      await refreshProfile();
    }
    setUploading(false);
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!user) return;
    setSaving(true);

    const { error } = await supabase
      .from("profiles")
      .update({
        display_name: form.display_name.trim() || null,
        bio: form.bio.trim() || null,
        school: form.school.trim() || null,
        institution: form.institution.trim() || null,
        linkedin_url: form.linkedin_url.trim() || null,
        github_url: form.github_url.trim() || null,
        phone: form.phone.trim() || null,
      })
      .eq("id", user.id);

    setSaving(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Profile saved");
    await refreshProfile();
    navigate({ to: "/profiles/$id", params: { id } });
  }

  function set(key: keyof typeof form) {
    return (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
      setForm((prev) => ({ ...prev, [key]: e.target.value }));
  }

  if (authLoading || loading) {
    return (
      <div className="mx-auto max-w-2xl px-6 pt-28 pb-16 space-y-6">
        <Skeleton className="h-6 w-32" />
        <div className="rounded-2xl border border-border bg-card p-6 space-y-5">
          <div className="flex items-center gap-4">
            <Skeleton className="h-20 w-20 rounded-full" />
            <Skeleton className="h-9 w-32 rounded-lg" />
          </div>
          {[0, 1, 2, 3, 4].map((i) => (
            <div key={i} className="space-y-1.5">
              <Skeleton className="h-3.5 w-24" />
              <Skeleton className="h-9 w-full rounded-lg" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (!profile) return null;

  const currentAvatarUrl =
    avatarPreview ?? getAvatarUrl(profile) ?? null;

  return (
    <div className="mx-auto max-w-2xl px-6 pt-28 pb-16">
      <Link
        to="/profiles/$id"
        params={{ id }}
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground mb-6 transition-colors"
      >
        <ArrowLeft className="h-3.5 w-3.5" /> Back to Profile
      </Link>

      <form onSubmit={handleSave}>
        <div
          className="rounded-2xl border border-border bg-card p-6 md:p-8 space-y-6"
          style={{ boxShadow: "var(--shadow-md)" }}
        >
          <div>
            <h1 className="text-xl font-semibold tracking-tight">Edit Profile</h1>
            <p className="text-sm text-muted-foreground mt-1">
              Your profile is public. Other researchers can find and follow your work.
            </p>
          </div>

          {/* Avatar upload */}
          <div>
            <Label className="text-xs font-medium uppercase tracking-wider text-muted-foreground mb-3 block">
              Profile Photo
            </Label>
            <div className="flex items-center gap-4">
              <div className="relative">
                {currentAvatarUrl ? (
                  <img
                    src={currentAvatarUrl}
                    alt="Avatar"
                    className="h-20 w-20 rounded-full object-cover ring-2 ring-border"
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <UserAvatar profile={profile} size="xl" />
                )}
                {uploading && (
                  <div className="absolute inset-0 flex items-center justify-center rounded-full bg-background/70">
                    <Loader2 className="h-5 w-5 animate-spin text-primary" />
                  </div>
                )}
              </div>
              <div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={uploading}
                  onClick={() => fileRef.current?.click()}
                >
                  <Camera className="h-4 w-4" />
                  {uploading ? "Uploading…" : "Change Photo"}
                </Button>
                <p className="text-[11px] text-muted-foreground mt-1.5">
                  JPG, PNG or WebP · Max 5MB
                </p>
              </div>
              <input
                ref={fileRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleAvatarChange}
              />
            </div>
          </div>

          <div className="h-px bg-border" />

          {/* Identity */}
          <div className="space-y-4">
            <h2 className="text-sm font-semibold flex items-center gap-2 text-muted-foreground uppercase tracking-wider text-xs">
              <User className="h-3.5 w-3.5" /> Identity
            </h2>
            <div className="space-y-1.5">
              <Label htmlFor="display_name">Display Name</Label>
              <Input
                id="display_name"
                value={form.display_name}
                onChange={set("display_name")}
                placeholder="Your full name"
                maxLength={80}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="bio">
                Bio <span className="text-muted-foreground text-xs">({form.bio.length}/500)</span>
              </Label>
              <Textarea
                id="bio"
                value={form.bio}
                onChange={set("bio")}
                placeholder="Tell the community a little about yourself and your research interests…"
                rows={3}
                maxLength={500}
                className="resize-none"
              />
            </div>
          </div>

          <div className="h-px bg-border" />

          {/* Academic */}
          <div className="space-y-4">
            <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
              <FileText className="h-3.5 w-3.5" /> Academic Affiliation
            </h2>
            <div className="grid sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="school" className="flex items-center gap-1.5">
                  <GraduationCap className="h-3.5 w-3.5 text-muted-foreground" /> School
                </Label>
                <Input
                  id="school"
                  value={form.school}
                  onChange={set("school")}
                  placeholder="e.g. De La Salle Lipa"
                  maxLength={200}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="institution" className="flex items-center gap-1.5">
                  <Building2 className="h-3.5 w-3.5 text-muted-foreground" /> Department / Institute
                </Label>
                <Input
                  id="institution"
                  value={form.institution}
                  onChange={set("institution")}
                  placeholder="e.g. College of Engineering"
                  maxLength={200}
                />
              </div>
            </div>
          </div>

          <div className="h-px bg-border" />

          {/* Social links */}
          <div className="space-y-4">
            <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
              <Linkedin className="h-3.5 w-3.5" /> Social &amp; Contact
            </h2>
            <div className="space-y-3">
              <div className="space-y-1.5">
                <Label htmlFor="linkedin" className="flex items-center gap-1.5">
                  <Linkedin className="h-3.5 w-3.5 text-muted-foreground" /> LinkedIn
                </Label>
                <Input
                  id="linkedin"
                  value={form.linkedin_url}
                  onChange={set("linkedin_url")}
                  placeholder="https://linkedin.com/in/your-profile"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="github" className="flex items-center gap-1.5">
                  <Github className="h-3.5 w-3.5 text-muted-foreground" /> GitHub
                </Label>
                <Input
                  id="github"
                  value={form.github_url}
                  onChange={set("github_url")}
                  placeholder="https://github.com/username or just username"
                />
              </div>
              <div className="grid sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label htmlFor="phone" className="flex items-center gap-1.5">
                    <Phone className="h-3.5 w-3.5 text-muted-foreground" /> Phone
                  </Label>
                  <Input
                    id="phone"
                    value={form.phone}
                    onChange={set("phone")}
                    placeholder="+63 9xx xxx xxxx"
                    maxLength={30}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="flex items-center gap-1.5">
                    <Mail className="h-3.5 w-3.5 text-muted-foreground" /> Email
                  </Label>
                  <Input
                    value={authProfile?.email ?? ""}
                    disabled
                    className="opacity-60"
                    title="Email is set from your Google account"
                  />
                  <p className="text-[11px] text-muted-foreground">Tied to your Google account</p>
                </div>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between pt-2">
            <Link to="/profiles/$id" params={{ id }}>
              <Button type="button" variant="ghost">
                Cancel
              </Button>
            </Link>
            <Button type="submit" disabled={saving}>
              {saving ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Save className="h-4 w-4" />
              )}
              {saving ? "Saving…" : "Save Profile"}
            </Button>
          </div>
        </div>
      </form>
    </div>
  );
}
