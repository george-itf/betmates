"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";

export function CreateGroupBetButton({ leagueId, seasonId }: { leagueId: string; seasonId: string }) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [title, setTitle] = useState("");
  const [buyin, setBuyin] = useState("2");
  const [legsPerUser, setLegsPerUser] = useState("3");
  const [winningLegs, setWinningLegs] = useState("5");

  const router = useRouter();
  const supabase = createClient();

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const subDeadline = new Date(Date.now() + 24 * 60 * 60 * 1000);
    const voteDeadline = new Date(subDeadline.getTime() + 12 * 60 * 60 * 1000);

    const { data } = await supabase
      .from("group_bets")
      .insert({
        season_id: seasonId,
        title,
        buyin_per_user: parseFloat(buyin),
        legs_per_user: parseInt(legsPerUser),
        winning_legs_count: parseInt(winningLegs),
        submission_deadline: subDeadline.toISOString(),
        voting_deadline: voteDeadline.toISOString(),
        status: "submissions_open",
      })
      .select()
      .single();

    if (data) {
      router.push(`/league/${leagueId}/group-bet/${data.id}`);
    }
    setLoading(false);
  };

  return (
    <>
      <button onClick={() => setOpen(true)} className="w-full py-2.5 bg-[var(--white)] text-[var(--bg)] rounded text-sm font-medium">
        Create group bet
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-5">
          <div className="absolute inset-0 bg-black/80" onClick={() => setOpen(false)} />
          <div className="relative bg-[var(--surface)] border border-[var(--border)] rounded-lg p-5 w-full max-w-xs">
            <h2 className="font-medium mb-4">New group bet</h2>
            <form onSubmit={handleCreate} className="space-y-3">
              <input placeholder="Title" value={title} onChange={(e) => setTitle(e.target.value)} required />
              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="text-xs text-[var(--muted)] block mb-1">Buy-in</label>
                  <input type="number" value={buyin} onChange={(e) => setBuyin(e.target.value)} min="0" step="0.5" />
                </div>
                <div>
                  <label className="text-xs text-[var(--muted)] block mb-1">Legs each</label>
                  <select value={legsPerUser} onChange={(e) => setLegsPerUser(e.target.value)}>
                    <option>2</option><option>3</option><option>4</option><option>5</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs text-[var(--muted)] block mb-1">Final</label>
                  <select value={winningLegs} onChange={(e) => setWinningLegs(e.target.value)}>
                    <option>3</option><option>4</option><option>5</option><option>6</option>
                  </select>
                </div>
              </div>
              <div className="flex gap-2 pt-2">
                <button type="button" onClick={() => setOpen(false)} className="flex-1 py-2 border border-[var(--border)] rounded text-sm">
                  Cancel
                </button>
                <button type="submit" disabled={loading || !title} className="flex-1 py-2 bg-[var(--white)] text-[var(--bg)] rounded text-sm">
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
