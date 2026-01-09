"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";

export function JoinLeagueButton() {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [code, setCode] = useState("");
  const [error, setError] = useState("");

  const router = useRouter();
  const supabase = createClient();

  const handleJoin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data: league } = await supabase
      .from("leagues")
      .select("id")
      .eq("invite_code", code.toLowerCase().trim())
      .single();

    if (!league) {
      setError("Invalid invite code");
      setLoading(false);
      return;
    }

    const { data: existing } = await supabase
      .from("league_members")
      .select("id")
      .eq("league_id", league.id)
      .eq("user_id", user.id)
      .single();

    if (existing) {
      router.push(`/league/${league.id}`);
      return;
    }

    await supabase.from("league_members").insert({ league_id: league.id, user_id: user.id, role: "member" });
    router.push(`/league/${league.id}`);
    router.refresh();
  };

  return (
    <>
      <button onClick={() => setOpen(true)} className="btn btn-secondary flex-1">
        Join league
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
          <div className="absolute inset-0 bg-black/50" onClick={() => setOpen(false)} />
          <div className="relative bg-[var(--surface)] rounded-t-2xl sm:rounded-2xl p-6 w-full max-w-md safe-b">
            <h2 className="text-xl font-bold mb-6">Join a league</h2>
            
            <form onSubmit={handleJoin} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Invite code</label>
                <input
                  placeholder="e.g. abc123"
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  required
                  className="mono text-center text-xl tracking-widest"
                />
              </div>

              {error && (
                <div className="p-3 rounded-lg bg-red-50 text-[var(--danger)] text-sm">
                  {error}
                </div>
              )}

              <div className="flex gap-3 pt-4">
                <button type="button" onClick={() => setOpen(false)} className="btn btn-secondary flex-1">
                  Cancel
                </button>
                <button type="submit" disabled={loading || !code} className="btn btn-primary flex-1">
                  {loading ? "Joining..." : "Join"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
