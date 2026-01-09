"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";

export function CreateLeagueButton() {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [name, setName] = useState("");
  const [buyin, setBuyin] = useState("5");
  const [weeks, setWeeks] = useState("6");

  const router = useRouter();
  const supabase = createClient();

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data: league } = await supabase
      .from("leagues")
      .insert({ name, weekly_buyin: parseFloat(buyin), season_length_weeks: parseInt(weeks), created_by: user.id })
      .select()
      .single();

    if (league) {
      await supabase.from("league_members").insert({ league_id: league.id, user_id: user.id, role: "admin" });
      
      const ends = new Date();
      ends.setDate(ends.getDate() + parseInt(weeks) * 7);
      await supabase.from("seasons").insert({
        league_id: league.id,
        season_number: 1,
        starts_at: new Date().toISOString(),
        ends_at: ends.toISOString(),
        status: "active",
      });

      router.push(`/league/${league.id}`);
    }
    setLoading(false);
  };

  return (
    <>
      <button onClick={() => setOpen(true)} className="flex-1 py-2.5 bg-[var(--white)] text-[var(--bg)] rounded text-sm font-medium">
        Create
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-5">
          <div className="absolute inset-0 bg-black/80" onClick={() => setOpen(false)} />
          <div className="relative bg-[var(--surface)] border border-[var(--border)] rounded-lg p-5 w-full max-w-xs">
            <h2 className="font-medium mb-4">New league</h2>
            <form onSubmit={handleCreate} className="space-y-3">
              <input
                placeholder="Name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-[var(--muted)] block mb-1">Buy-in (£)</label>
                  <input type="number" value={buyin} onChange={(e) => setBuyin(e.target.value)} min="1" />
                </div>
                <div>
                  <label className="text-xs text-[var(--muted)] block mb-1">Weeks</label>
                  <select value={weeks} onChange={(e) => setWeeks(e.target.value)}>
                    <option>4</option>
                    <option>6</option>
                    <option>8</option>
                  </select>
                </div>
              </div>
              <div className="flex gap-2 pt-2">
                <button type="button" onClick={() => setOpen(false)} className="flex-1 py-2 border border-[var(--border)] rounded text-sm">
                  Cancel
                </button>
                <button type="submit" disabled={loading || !name} className="flex-1 py-2 bg-[var(--white)] text-[var(--bg)] rounded text-sm font-medium">
                  {loading ? "..." : "Create"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
