"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { IconCheck, IconX } from "@/components/icons";

interface Bet {
  id: string;
  user_id: string;
  stake: number;
  potential_return: number;
  placed_at: string;
  profiles: { display_name: string };
  bet_legs: Array<{ selection: string }>;
}

export function SettleBets({
  bets,
  seasonId,
  leagueId,
}: {
  bets: Bet[];
  seasonId: string;
  leagueId: string;
}) {
  const [loading, setLoading] = useState<string | null>(null);
  const router = useRouter();
  const supabase = createClient();

  const settleBet = async (betId: string, won: boolean) => {
    setLoading(betId);

    const bet = bets.find(b => b.id === betId);
    if (!bet) return;

    await supabase
      .from("bets")
      .update({
        status: "settled",
        actual_return: won ? bet.potential_return : 0,
        settled_at: new Date().toISOString(),
      })
      .eq("id", betId);

    // Log activity
    await supabase.from("activity_log").insert({
      league_id: leagueId,
      user_id: bet.user_id,
      event_type: "bet_settled",
      data: {
        user_name: bet.profiles?.display_name,
        won,
        return: won ? bet.potential_return : 0,
        stake: bet.stake,
      },
    });

    router.refresh();
    setLoading(null);
  };

  if (bets.length === 0) {
    return (
      <p className="text-sm text-[var(--text-secondary)] text-center py-4">
        No pending bets to settle
      </p>
    );
  }

  return (
    <div className="space-y-3">
      {bets.map((bet) => (
        <div key={bet.id} className="p-3 bg-[var(--bg)] rounded border border-[var(--border)]">
          <div className="flex items-start justify-between mb-2">
            <div className="flex-1 min-w-0">
              <p className="font-medium text-sm">{bet.profiles?.display_name}</p>
              <p className="text-xs text-[var(--text-secondary)] truncate">
                {bet.bet_legs.map(l => l.selection).join(" + ")}
              </p>
            </div>
            <div className="text-right ml-2">
              <p className="text-sm font-semibold">£{bet.stake.toFixed(2)}</p>
              <p className="text-xs text-[var(--accent)]">£{bet.potential_return.toFixed(2)}</p>
            </div>
          </div>

          <div className="flex gap-2">
            <button
              onClick={() => settleBet(bet.id, false)}
              disabled={loading === bet.id}
              className="btn btn-danger flex-1 py-2 text-xs"
            >
              <IconX className="w-4 h-4" />
              <span>{loading === bet.id ? "..." : "LOST"}</span>
            </button>
            <button
              onClick={() => settleBet(bet.id, true)}
              disabled={loading === bet.id}
              className="btn btn-primary flex-1 py-2 text-xs"
            >
              <IconCheck className="w-4 h-4" />
              <span>{loading === bet.id ? "..." : "WON"}</span>
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
