import { Link } from "@tanstack/react-router";
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "@/components/ui/hover-card";
import { UserAvatar } from "@/components/user-avatar";
import type { Profile } from "@/lib/supabase";
import { Building2, GraduationCap, ExternalLink } from "lucide-react";

type Props = {
  profile: Partial<Profile> & { id: string } | null | undefined;
  children: React.ReactNode;
  side?: "top" | "bottom" | "left" | "right";
};

export function ProfileHoverCard({ profile, children, side = "bottom" }: Props) {
  if (!profile) return <>{children}</>;

  const name = profile.display_name || profile.email?.split("@")[0] || "Unknown";
  const bio = profile.bio;
  const hasSchool = profile.school || profile.institution;

  return (
    <HoverCard openDelay={350} closeDelay={100}>
      <HoverCardTrigger asChild>
        <span>{children}</span>
      </HoverCardTrigger>
      <HoverCardContent
        side={side}
        align="start"
        className="w-72 p-0 overflow-hidden"
      >
        <div className="bg-gradient-to-br from-primary/10 via-primary/5 to-transparent p-4 pb-3 border-b border-border/60">
          <div className="flex items-start gap-3">
            <UserAvatar profile={profile} size="lg" />
            <div className="min-w-0 flex-1">
              <div className="font-semibold text-sm truncate">{name}</div>
              {profile.email && (
                <div className="text-[11px] text-muted-foreground truncate mt-0.5">
                  {profile.email}
                </div>
              )}
              {hasSchool && (
                <div className="flex items-center gap-1 mt-1.5 text-[11px] text-muted-foreground">
                  {profile.school ? (
                    <>
                      <GraduationCap className="h-3 w-3 shrink-0" />
                      <span className="truncate">{profile.school}</span>
                    </>
                  ) : (
                    <>
                      <Building2 className="h-3 w-3 shrink-0" />
                      <span className="truncate">{profile.institution}</span>
                    </>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {bio && (
          <div className="px-4 py-2.5 border-b border-border/60">
            <p className="text-[12px] text-muted-foreground leading-relaxed line-clamp-2">
              {bio}
            </p>
          </div>
        )}

        <div className="px-4 py-2.5">
          <Link
            to="/profiles/$id"
            params={{ id: profile.id }}
            className="inline-flex items-center gap-1.5 text-[12px] text-primary hover:text-primary/80 transition-colors font-medium"
          >
            View profile <ExternalLink className="h-3 w-3" />
          </Link>
        </div>
      </HoverCardContent>
    </HoverCard>
  );
}
