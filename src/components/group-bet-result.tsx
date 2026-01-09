"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";

interface WinningLeg {
  selection: string;
  odds_fractional: string;
  odds_decimal: number;
  profiles: { display_name: string };
}

interface GroupBet {
  id: string;
  status: string;
  result: string;
  final_odds_decimal: number | null;
  payout_per_user: number | null;
  total_stake: number | null;
}

export function GroupBetResult({ groupBet, winningLegs, isAdmin }: {
  groupBet: GroupBet;
  winningLegs: WinningLeg[];
  isAdmin: boolean;
}) {
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  const settle = async (result: "won" | "lost") => {
    setLoading(true);

    let payout = 0;
    if (result === "won" && groupBet.total_stake && groupBet.final_odds_decimal) {
      const { data: participants } = await supabase
        .from("group_bet_submissions")
        .select("user_id")
        .eq("group_bet_id", groupBet.id);
      const count = new Set(participants?.map((p) => p.user_id)).size;
      payout = (groupBet.total_stake * groupBet.final_odds_decimal) / count;
    }

    await supabase
      .from("group_bets")
      .update({ status: "settled", result, payout_per_user: result === "won" ? payout : 0 })
      .eq("id", groupBet.id);

    router.refresh();
    setLoading(false);
  };

  const combinedOdds = winningLegs.reduce((acc, l) => acc * l.odds_decimal, 1);

  return (
    <div>
      <p className="text-xs text-[var(--muted)] mb-3">Final acca ({combinedOdds.toFixed(1)}x)</p>

      <ul className="border-t border-[var(--border)] mb-6">
        {winningLegs.map((leg, i) => (
          <li key={i} className="py-2 border-b border-[var(--border)] text-sm">
            <div className="flex justify-between">
              <span>{leg.selection}</span>
              <span className="text-[var(--muted)]">{leg.odds_fractional}</span>
            </div>
            <p className="text-xs text-[var(--muted)]">{leg.profiles?.display_name}</p>
          </li>
        ))}
      </ul>

      {groupBet.status === "settled" && (
        <div className={`text-center py-4 ${groupBet.result === "won" ? "text-[var(--green)]" : "text-[var(--red)]"}`}>
          {groupBet.result === "won" ? (
            <p className="text-xl font-semibold">+£{groupBet.payout_per_user?.toFixed(2)} each</p>
          ) : (
            <p>Lost</p>
          )}
        </div>
      )}

      {isAdmin && groupBet.status === "betting" && (
        <div className="flex gap-2">
          <button onClick={() => settle("lost")} disabled={loading} className="flex-1 py-2 border border-[var(--border)] rounded text-sm text-[var(--red)]">
            Lost
          </button>
          <button onClick={() => settle("won")} disabled={loading} className="flex-1 py-2 bg-[var(--green)] text-[var(--bg)] rounded text-sm">
            {loading ? "..." : "Won"}
          </button>
        </div>
      )}
    </div>
  );
}
