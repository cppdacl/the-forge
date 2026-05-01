import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { SUPABASE_URL, type Profile } from "@/lib/supabase";
import { cn } from "@/lib/utils";

export type AvatarProfile = Pick<
  Profile,
  "display_name" | "email" | "avatar_url" | "custom_avatar_path"
>;

export function getAvatarUrl(
  profile: Partial<AvatarProfile> | null | undefined
): string | null {
  if (!profile) return null;
  if (profile.custom_avatar_path) {
    return `${SUPABASE_URL}/storage/v1/object/public/avatars/${profile.custom_avatar_path}`;
  }
  return profile.avatar_url ?? null;
}

type Props = {
  profile?: Partial<AvatarProfile> | null;
  name?: string | null;
  email?: string | null;
  avatarUrl?: string | null;
  size?: "xs" | "sm" | "md" | "lg" | "xl";
  className?: string;
};

const sizeMap = {
  xs: "h-5 w-5 text-[9px]",
  sm: "h-7 w-7 text-[11px]",
  md: "h-9 w-9 text-xs",
  lg: "h-12 w-12 text-sm",
  xl: "h-20 w-20 text-xl",
};

export function UserAvatar({ profile, name, email, avatarUrl, size = "sm", className }: Props) {
  const display = profile?.display_name ?? name ?? profile?.email ?? email ?? "?";
  const url = getAvatarUrl(profile) ?? avatarUrl ?? null;
  const initials = display
    .split(/[\s@]+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((s) => s[0]?.toUpperCase() ?? "")
    .join("") || "?";

  return (
    <Avatar className={cn(sizeMap[size], "ring-1 ring-border shrink-0", className)}>
      {url && <AvatarImage src={url} alt={display} referrerPolicy="no-referrer" />}
      <AvatarFallback className="bg-primary/15 text-primary font-semibold">
        {initials}
      </AvatarFallback>
    </Avatar>
  );
}
