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

export function MembersList({ members, leagueId, currentUserId }: { 
  members: Member[]; 
  leagueId: string; 
  currentUserId: string 
}) {
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
    if (!confirm(`Remove ${name} from the league?`)) return;
    setLoading(id);
    await supabase.from("league_members").delete().eq("id", id);
    router.refresh();
    setLoading(null);
  };

  return (
    <div className="space-y-1">
      {members.map((m) => {
        const isMe = m.user_id === currentUserId;
        const isAdmin = m.role === "admin";
        return (
          <div key={m.id} className="list-item">
            <div className="flex items-center gap-2">
              <span className="font-medium">{m.profiles?.display_name}</span>
              {isMe && <span className="badge badge-gray">You</span>}
              {isAdmin && <span className="badge badge-green">Admin</span>}
            </div>
            {!isMe && (
              <div className="flex gap-2">
                {isAdmin && adminCount > 1 && (
                  <button 
                    onClick={() => demote(m.id)} 
                    disabled={loading === m.id} 
                    className="text-sm text-[var(--text-secondary)]"
                  >
                    Demote
                  </button>
                )}
                {!isAdmin && (
                  <button 
                    onClick={() => promote(m.id)} 
                    disabled={loading === m.id} 
                    className="text-sm text-[var(--accent)]"
                  >
                    Promote
                  </button>
                )}
                <button 
                  onClick={() => kick(m.id, m.profiles?.display_name)} 
                  disabled={loading === m.id} 
                  className="text-sm text-[var(--danger)]"
                >
                  Remove
                </button>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
