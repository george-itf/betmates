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
      <button onClick={() => setOpen(true)} className="btn btn-primary flex-1">
        Create league
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
          <div className="absolute inset-0 bg-black/50" onClick={() => setOpen(false)} />
          <div className="relative bg-[var(--surface)] rounded-t-2xl sm:rounded-2xl p-6 w-full max-w-md safe-b">
            <h2 className="text-xl font-bold mb-6">Create a league</h2>
            
            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">League name</label>
                <input
                  placeholder="e.g. Sunday League Lads"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Weekly buy-in</label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-secondary)]">£</span>
                    <input 
                      type="number" 
                      value={buyin} 
                      onChange={(e) => setBuyin(e.target.value)} 
                      min="1" 
                      className="pl-7"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Season length</label>
                  <select value={weeks} onChange={(e) => setWeeks(e.target.value)}>
                    <option value="4">4 weeks</option>
                    <option value="6">6 weeks</option>
                    <option value="8">8 weeks</option>
                    <option value="12">12 weeks</option>
                  </select>
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <button type="button" onClick={() => setOpen(false)} className="btn btn-secondary flex-1">
                  Cancel
                </button>
                <button type="submit" disabled={loading || !name} className="btn btn-primary flex-1">
                  {loading ? "Creating..." : "Create"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
