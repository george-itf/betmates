"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";

export function JoinLeagueButton() {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [code, setCode] = useState("");
  
  const router = useRouter();
  const supabase = createClient();

  const handleJoin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not logged in");

      // Find league by invite code
      const { data: league, error: findError } = await supabase
        .from("leagues")
        .select("id, name")
        .eq("invite_code", code.toLowerCase().trim())
        .single();

      if (findError || !league) {
        throw new Error("Invalid invite code");
      }

      // Check if already a member
      const { data: existing } = await supabase
        .from("league_members")
        .select("id")
        .eq("league_id", league.id)
        .eq("user_id", user.id)
        .single();

      if (existing) {
        throw new Error("You're already in this league");
      }

      // Join league
      const { error: joinError } = await supabase
        .from("league_members")
        .insert({
          league_id: league.id,
          user_id: user.id,
          role: "member",
        });

      if (joinError) throw joinError;

      setOpen(false);
      router.push(`/league/${league.id}`);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="btn flex-1"
      >
        join league
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/60"
            onClick={() => setOpen(false)}
          />
          <div className="relative bg-[var(--card)] rounded-xl p-6 w-full max-w-md border border-[var(--card-border)]">
            <h2 className="text-xl font-bold mb-4">join a league</h2>
            
            <form onSubmit={handleJoin} className="space-y-4">
              <div>
                <label className="block text-sm text-[var(--muted)] mb-1">
                  invite code
                </label>
                <input
                  type="text"
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  placeholder="e.g. a1b2c3d4"
                  required
                  disabled={loading}
                  className="text-center uppercase tracking-widest"
                  maxLength={8}
                />
              </div>

              <p className="text-sm text-[var(--muted)] text-center">
                ask your mate for the code
              </p>

              {error && (
                <p className="text-[var(--danger)] text-sm text-center">{error}</p>
              )}

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="btn flex-1"
                  disabled={loading}
                >
                  cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary flex-1"
                  disabled={loading || code.length < 4}
                >
                  {loading ? "joining..." : "join"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
