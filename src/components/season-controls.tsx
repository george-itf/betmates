"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";

interface Season {
  id: string;
  season_number: number;
  status: string;
  pot_amount: number;
  winner_id: string | null;
}

interface Member {
  user_id: string;
  profiles: { display_name: string };
}

export function SeasonControls({
  leagueId,
  currentSeason,
  allSeasons,
  members,
  seasonLengthWeeks,
}: {
  leagueId: string;
  currentSeason: Season | null;
  allSeasons: Season[];
  members: Member[];
  seasonLengthWeeks: number;
}) {
  const [loading, setLoading] = useState(false);
  const [showEnd, setShowEnd] = useState(false);
  const [winner, setWinner] = useState("");
  const router = useRouter();
  const supabase = createClient();

  const startSeason = async () => {
    setLoading(true);
    const num = allSeasons.length > 0 ? Math.max(...allSeasons.map((s) => s.season_number)) + 1 : 1;
    const ends = new Date();
    ends.setDate(ends.getDate() + seasonLengthWeeks * 7);
    await supabase.from("seasons").insert({
      league_id: leagueId,
      season_number: num,
      starts_at: new Date().toISOString(),
      ends_at: ends.toISOString(),
      status: "active",
    });
    router.refresh();
    setLoading(false);
  };

  const endSeason = async () => {
    if (!currentSeason || !winner) return;
    setLoading(true);
    await supabase.from("seasons").update({ status: "completed", winner_id: winner }).eq("id", currentSeason.id);
    setShowEnd(false);
    router.refresh();
    setLoading(false);
  };

  return (
    <div>
      {currentSeason ? (
        <div className="space-y-3">
          <div className="flex justify-between text-sm py-2 border-y border-[var(--border)]">
            <span>Season {currentSeason.season_number}</span>
            <span className="text-[var(--green)]">£{currentSeason.pot_amount || 0}</span>
          </div>
          {!showEnd ? (
            <button onClick={() => setShowEnd(true)} className="text-sm text-[var(--muted)]">
              End season
            </button>
          ) : (
            <div className="space-y-3">
              <select value={winner} onChange={(e) => setWinner(e.target.value)}>
                <option value="">Select winner</option>
                {members.map((m) => (
                  <option key={m.user_id} value={m.user_id}>{m.profiles?.display_name}</option>
                ))}
              </select>
              <div className="flex gap-2">
                <button onClick={() => setShowEnd(false)} className="flex-1 py-2 border border-[var(--border)] rounded text-sm">
                  Cancel
                </button>
                <button onClick={endSeason} disabled={!winner || loading} className="flex-1 py-2 bg-[var(--white)] text-[var(--bg)] rounded text-sm">
                  Confirm
                </button>
              </div>
            </div>
          )}
        </div>
      ) : (
        <button onClick={startSeason} disabled={loading} className="w-full py-2.5 bg-[var(--white)] text-[var(--bg)] rounded text-sm font-medium">
          {loading ? "..." : "Start new season"}
        </button>
      )}
    </div>
  );
}
