"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";

interface Member {
  id: string;
  user_id: string;
  role: string;
  profiles: { display_name: string };
}

export function MembersList({ members, leagueId, currentUserId }: { members: Member[]; leagueId: string; currentUserId: string }) {
  const [loading, setLoading] = useState<string | null>(null);
  const router = useRouter();
  const supabase = createClient();

  const adminCount = members.filter((m) => m.role === "admin").length;

  const promote = async (id: string) => {
    setLoading(id);
    await supabase.from("league_members").update({ role: "admin" }).eq("id", id);
    router.refresh();
    setLoading(null);
  };

  const demote = async (id: string) => {
    setLoading(id);
    await supabase.from("league_members").update({ role: "member" }).eq("id", id);
    router.refresh();
    setLoading(null);
  };

  const kick = async (id: string, name: string) => {
    if (!confirm(`Remove ${name}?`)) return;
    setLoading(id);
    await supabase.from("league_members").delete().eq("id", id);
    router.refresh();
    setLoading(null);
  };

  return (
    <ul className="border-t border-[var(--border)]">
      {members.map((m) => {
        const isMe = m.user_id === currentUserId;
        const isAdmin = m.role === "admin";
        return (
          <li key={m.id} className="flex items-center justify-between py-2 border-b border-[var(--border)] text-sm">
            <div>
              <span>{m.profiles?.display_name}</span>
              {isMe && <span className="text-[var(--muted)]"> (you)</span>}
              {isAdmin && <span className="text-[var(--muted)]"> · admin</span>}
            </div>
            {!isMe && (
              <div className="flex gap-3 text-xs">
                {isAdmin && adminCount > 1 && (
                  <button onClick={() => demote(m.id)} disabled={loading === m.id} className="text-[var(--muted)]">
                    Demote
                  </button>
                )}
                {!isAdmin && (
                  <button onClick={() => promote(m.id)} disabled={loading === m.id} className="text-[var(--muted)]">
                    Promote
                  </button>
                )}
                <button onClick={() => kick(m.id, m.profiles?.display_name)} disabled={loading === m.id} className="text-[var(--red)]">
                  Remove
                </button>
              </div>
            )}
          </li>
        );
      })}
    </ul>
  );
}
