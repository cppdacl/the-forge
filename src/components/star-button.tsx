import { useEffect, useState } from "react";
import { Star } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/lib/auth-context";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

type Props = {
  projectId: string;
  size?: "sm" | "md";
  variant?: "default" | "compact";
};

export function StarButton({ projectId, size = "md", variant = "default" }: Props) {
  const { user } = useAuth();
  const [count, setCount] = useState(0);
  const [starred, setStarred] = useState(false);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let alive = true;
    (async () => {
      const { count: c } = await supabase
        .from("project_stars")
        .select("*", { count: "exact", head: true })
        .eq("project_id", projectId);
      if (!alive) return;
      setCount(c ?? 0);
      if (user) {
        const { data } = await supabase
          .from("project_stars")
          .select("project_id")
          .eq("project_id", projectId)
          .eq("user_id", user.id)
          .maybeSingle();
        if (alive) setStarred(!!data);
      } else {
        setStarred(false);
      }
      setLoading(false);
    })();
    return () => {
      alive = false;
    };
  }, [projectId, user?.id]);

  async function toggle(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    if (!user) {
      toast.error("Sign in to star projects");
      return;
    }
    setBusy(true);
    if (starred) {
      const { error } = await supabase
        .from("project_stars")
        .delete()
        .eq("project_id", projectId)
        .eq("user_id", user.id);
      if (!error) {
        setStarred(false);
        setCount((c) => Math.max(0, c - 1));
      } else toast.error(error.message);
    } else {
      const { error } = await supabase
        .from("project_stars")
        .insert({ project_id: projectId, user_id: user.id });
      if (!error) {
        setStarred(true);
        setCount((c) => c + 1);
      } else toast.error(error.message);
    }
    setBusy(false);
  }

  if (variant === "compact") {
    return (
      <button
        onClick={toggle}
        disabled={busy || loading}
        className={cn(
          "inline-flex items-center gap-1 text-xs transition-colors",
          starred ? "text-primary" : "text-muted-foreground hover:text-foreground",
        )}
      >
        <Star className={cn("h-3.5 w-3.5", starred && "fill-primary")} />
        {count}
      </button>
    );
  }

  return (
    <Button
      onClick={toggle}
      disabled={busy || loading}
      size={size === "sm" ? "sm" : "default"}
      variant={starred ? "default" : "outline"}
      className={cn(starred && "shadow-[0_0_0_1px_var(--primary)]")}
    >
      <Star className={cn("h-4 w-4", starred && "fill-current")} />
      {starred ? "Starred" : "Star"}
      <span className="ml-1 text-xs opacity-80">{count}</span>
    </Button>
  );
}
