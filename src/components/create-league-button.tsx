"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";

export function CreateLeagueButton() {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [name, setName] = useState("");
  const [weeklyBuyin, setWeeklyBuyin] = useState("5");
  const [seasonLength, setSeasonLength] = useState("6");
  
  const router = useRouter();
  const supabase = createClient();

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not logged in");

      // Create league
      const { data: league, error: leagueError } = await supabase
        .from("leagues")
        .insert({
          name,
          weekly_buyin: parseFloat(weeklyBuyin),
          season_length_weeks: parseInt(seasonLength),
          created_by: user.id,
        })
        .select()
        .single();

      if (leagueError) throw leagueError;

      // Add creator as admin
      const { error: memberError } = await supabase
        .from("league_members")
        .insert({
          league_id: league.id,
          user_id: user.id,
          role: "admin",
        });

      if (memberError) throw memberError;

      // Create first season (starts now, ends in X weeks)
      const startsAt = new Date();
      const endsAt = new Date();
      endsAt.setDate(endsAt.getDate() + parseInt(seasonLength) * 7);

      const { error: seasonError } = await supabase
        .from("seasons")
        .insert({
          league_id: league.id,
          season_number: 1,
          starts_at: startsAt.toISOString(),
          ends_at: endsAt.toISOString(),
          status: "active",
        });

      if (seasonError) throw seasonError;

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
        className="btn btn-primary flex-1"
      >
        create league
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/60"
            onClick={() => setOpen(false)}
          />
          <div className="relative bg-[var(--card)] rounded-xl p-6 w-full max-w-md border border-[var(--card-border)]">
            <h2 className="text-xl font-bold mb-4">create a league</h2>
            
            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="block text-sm text-[var(--muted)] mb-1">
                  league name
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. the lads"
                  required
                  disabled={loading}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-[var(--muted)] mb-1">
                    weekly buy-in
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--muted)]">£</span>
                    <input
                      type="number"
                      value={weeklyBuyin}
                      onChange={(e) => setWeeklyBuyin(e.target.value)}
                      min="1"
                      step="0.50"
                      required
                      disabled={loading}
                      className="pl-7"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm text-[var(--muted)] mb-1">
                    season length
                  </label>
                  <select
                    value={seasonLength}
                    onChange={(e) => setSeasonLength(e.target.value)}
                    disabled={loading}
                  >
                    <option value="4">4 weeks</option>
                    <option value="6">6 weeks</option>
                    <option value="8">8 weeks</option>
                    <option value="12">12 weeks</option>
                  </select>
                </div>
              </div>

              {error && (
                <p className="text-[var(--danger)] text-sm">{error}</p>
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
                  disabled={loading || !name}
                >
                  {loading ? "creating..." : "create"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
