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
      setError("Invalid code");
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
      <button onClick={() => setOpen(true)} className="flex-1 py-2.5 border border-[var(--border)] rounded text-sm">
        Join
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-5">
          <div className="absolute inset-0 bg-black/80" onClick={() => setOpen(false)} />
          <div className="relative bg-[var(--surface)] border border-[var(--border)] rounded-lg p-5 w-full max-w-xs">
            <h2 className="font-medium mb-4">Join league</h2>
            <form onSubmit={handleJoin} className="space-y-3">
              <input
                placeholder="Invite code"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                required
                className="mono"
              />
              {error && <p className="text-sm text-[var(--red)]">{error}</p>}
              <div className="flex gap-2 pt-2">
                <button type="button" onClick={() => setOpen(false)} className="flex-1 py-2 border border-[var(--border)] rounded text-sm">
                  Cancel
                </button>
                <button type="submit" disabled={loading || !code} className="flex-1 py-2 bg-[var(--white)] text-[var(--bg)] rounded text-sm font-medium">
                  {loading ? "..." : "Join"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
