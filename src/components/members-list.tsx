"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";

interface Member {
  id: string;
  user_id: string;
  role: string;
  joined_at: string;
  profiles: {
    display_name: string;
    avatar_url: string | null;
  };
}

interface MembersListProps {
  members: Member[];
  leagueId: string;
  currentUserId: string;
}

export function MembersList({ members, leagueId, currentUserId }: MembersListProps) {
  const [loading, setLoading] = useState<string | null>(null);
  const router = useRouter();
  const supabase = createClient();

  const handlePromote = async (memberId: string, userId: string) => {
    setLoading(userId);
    try {
      await supabase
        .from("league_members")
        .update({ role: "admin" })
        .eq("id", memberId);
      router.refresh();
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(null);
    }
  };

  const handleDemote = async (memberId: string, userId: string) => {
    setLoading(userId);
    try {
      await supabase
        .from("league_members")
        .update({ role: "member" })
        .eq("id", memberId);
      router.refresh();
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(null);
    }
  };

  const handleKick = async (memberId: string, userId: string, displayName: string) => {
    if (!confirm(`Remove ${displayName} from the league?`)) return;
    
    setLoading(userId);
    try {
      await supabase
        .from("league_members")
        .delete()
        .eq("id", memberId);
      router.refresh();
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(null);
    }
  };

  const adminCount = members.filter((m) => m.role === "admin").length;

  return (
    <div className="space-y-2">
      {members.map((member) => {
        const isCurrentUser = member.user_id === currentUserId;
        const isAdmin = member.role === "admin";
        const isLoading = loading === member.user_id;
        const canDemote = isAdmin && adminCount > 1 && !isCurrentUser;
        const canKick = !isCurrentUser;

        return (
          <div
            key={member.id}
            className="card flex items-center gap-3"
          >
            {/* Avatar */}
            <div className="w-10 h-10 rounded-full bg-[var(--background)] flex items-center justify-center text-sm font-medium flex-shrink-0">
              {member.profiles?.avatar_url ? (
                <img
                  src={member.profiles.avatar_url}
                  alt=""
                  className="w-full h-full rounded-full object-cover"
                />
              ) : (
                member.profiles?.display_name?.[0]?.toUpperCase() || "?"
              )}
            </div>

            {/* Info */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <p className="font-medium truncate">
                  {member.profiles?.display_name}
                  {isCurrentUser && (
                    <span className="text-[var(--muted)] font-normal"> (you)</span>
                  )}
                </p>
                {isAdmin && (
                  <span className="text-xs px-1.5 py-0.5 rounded bg-[var(--accent)]/20 text-[var(--accent)]">
                    admin
                  </span>
                )}
              </div>
              <p className="text-xs text-[var(--muted)]">
                joined {new Date(member.joined_at).toLocaleDateString("en-GB", {
                  day: "numeric",
                  month: "short",
                  year: "numeric",
                })}
              </p>
            </div>

            {/* Actions */}
            {!isCurrentUser && (
              <div className="flex items-center gap-2">
                {isAdmin ? (
                  canDemote && (
                    <button
                      onClick={() => handleDemote(member.id, member.user_id)}
                      disabled={isLoading}
                      className="text-xs text-[var(--muted)] hover:text-[var(--foreground)]"
                    >
                      {isLoading ? "..." : "demote"}
                    </button>
                  )
                ) : (
                  <button
                    onClick={() => handlePromote(member.id, member.user_id)}
                    disabled={isLoading}
                    className="text-xs text-[var(--accent)]"
                  >
                    {isLoading ? "..." : "promote"}
                  </button>
                )}
                {canKick && (
                  <button
                    onClick={() => handleKick(member.id, member.user_id, member.profiles?.display_name)}
                    disabled={isLoading}
                    className="text-xs text-[var(--danger)]"
                  >
                    kick
                  </button>
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
