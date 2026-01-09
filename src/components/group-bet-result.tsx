"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";

interface WinningLeg {
  id: string;
  selection: string;
  event_name: string;
  odds_decimal: number;
  odds_fractional: string;
  result: string;
  votes_count: number;
  profiles: {
    display_name: string;
  };
}

interface GroupBet {
  id: string;
  status: string;
  result: string;
  final_odds_decimal: number | null;
  total_stake: number | null;
  payout_per_user: number | null;
  buyin_per_user: number;
}

interface GroupBetResultProps {
  groupBet: GroupBet;
  winningLegs: WinningLeg[];
  isAdmin: boolean;
}

export function GroupBetResult({ groupBet, winningLegs, isAdmin }: GroupBetResultProps) {
  const [loading, setLoading] = useState(false);
  const [settleLoading, setSettleLoading] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  const getResultIcon = (result: string) => {
    switch (result) {
      case "won": return "✓";
      case "lost": return "✗";
      case "void": return "−";
      default: return "○";
    }
  };

  const getResultColor = (result: string) => {
    switch (result) {
      case "won": return "var(--success)";
      case "lost": return "var(--danger)";
      case "void": return "var(--muted)";
      default: return "var(--warning)";
    }
  };

  const handleSettle = async (result: "won" | "lost") => {
    setSettleLoading(true);
    try {
      // Calculate payout if won
      let payoutPerUser = 0;
      if (result === "won" && groupBet.total_stake && groupBet.final_odds_decimal) {
        const totalReturn = groupBet.total_stake * groupBet.final_odds_decimal;
        // Get participant count
        const { data: participants } = await supabase
          .from("group_bet_submissions")
          .select("user_id")
          .eq("group_bet_id", groupBet.id);
        
        const uniqueParticipants = new Set(participants?.map(p => p.user_id) || []);
        payoutPerUser = totalReturn / uniqueParticipants.size;
      }

      // Update group bet
      await supabase
        .from("group_bets")
        .update({
          status: "settled",
          result,
          payout_per_user: result === "won" ? payoutPerUser : 0,
        })
        .eq("id", groupBet.id);

      // Update all winning legs result
      await supabase
        .from("group_bet_submissions")
        .update({ result })
        .eq("group_bet_id", groupBet.id)
        .eq("is_winner", true);

      router.refresh();
    } catch (err) {
      console.error("Settle error:", err);
    } finally {
      setSettleLoading(false);
    }
  };

  const combinedOdds = winningLegs.reduce((acc, leg) => acc * leg.odds_decimal, 1);

  return (
    <div className="space-y-4">
      <h3 className="font-medium">the final acca</h3>

      {/* Combined odds display */}
      {winningLegs.length > 0 && (
        <div className="card bg-[var(--accent)]/10 border-[var(--accent)]/30 text-center py-4">
          <p className="text-3xl font-bold text-[var(--accent)]">
            {combinedOdds.toFixed(1)}x
          </p>
          <p className="text-sm text-[var(--muted)]">combined odds</p>
        </div>
      )}

      {/* Winning legs */}
      <div className="space-y-2">
        {winningLegs.map((leg, i) => (
          <div
            key={leg.id}
            className="card flex items-center gap-3"
          >
            <div
              className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold"
              style={{
                backgroundColor: `color-mix(in srgb, ${getResultColor(leg.result)} 20%, transparent)`,
                color: getResultColor(leg.result),
              }}
            >
              {groupBet.status === "settled" ? getResultIcon(leg.result) : i + 1}
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-medium truncate">{leg.selection}</p>
              <p className="text-sm text-[var(--muted)]">
                {leg.odds_fractional} • {leg.votes_count} votes • by {leg.profiles?.display_name}
              </p>
            </div>
          </div>
        ))}
      </div>

      {winningLegs.length === 0 && (
        <div className="card text-center py-8">
          <p className="text-[var(--muted)]">no winning legs selected yet</p>
        </div>
      )}

      {/* Settlement info */}
      {groupBet.status === "settled" && (
        <div
          className="card text-center py-6"
          style={{
            backgroundColor: `color-mix(in srgb, ${getResultColor(groupBet.result)} 10%, var(--card))`,
          }}
        >
          {groupBet.result === "won" ? (
            <>
              <p className="text-2xl font-bold text-[var(--success)]">
                +£{groupBet.payout_per_user?.toFixed(2)}
              </p>
              <p className="text-sm text-[var(--muted)]">each participant wins</p>
            </>
          ) : (
            <>
              <p className="text-xl font-bold text-[var(--danger)]">
                bet lost
              </p>
              <p className="text-sm text-[var(--muted)]">better luck next time</p>
            </>
          )}
        </div>
      )}

      {/* Admin settle controls */}
      {isAdmin && groupBet.status === "betting" && (
        <div className="space-y-3">
          <p className="text-sm text-[var(--muted)] text-center">
            settle the bet when results are in
          </p>
          <div className="flex gap-3">
            <button
              onClick={() => handleSettle("lost")}
              className="btn flex-1 border-[var(--danger)] text-[var(--danger)]"
              disabled={settleLoading}
            >
              lost
            </button>
            <button
              onClick={() => handleSettle("won")}
              className="btn btn-primary flex-1 bg-[var(--success)]"
              disabled={settleLoading}
            >
              {settleLoading ? "..." : "won! 🎉"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
