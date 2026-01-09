"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";

interface Member {
  user_id: string;
  profiles: { display_name: string };
}

export function GroupBetAdminControls({ 
  groupBetId,
  status,
  leagueId,
  members,
  submissionCount,
  winningCount
}: { 
  groupBetId: string;
  status: string;
  leagueId: string;
  members: Member[];
  submissionCount: number;
  winningCount: number;
}) {
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  const moveToVoting = async () => {
    setLoading(true);
    await supabase
      .from("group_bets")
      .update({ status: "voting_open" })
      .eq("id", groupBetId);
    router.refresh();
    setLoading(false);
  };

  const finalize = async () => {
    setLoading(true);

    // Get top N submissions by votes
    const { data: topSubmissions } = await supabase
      .from("group_bet_submissions")
      .select("id")
      .eq("group_bet_id", groupBetId)
      .order("votes_count", { ascending: false })
      .limit(winningCount);

    if (topSubmissions) {
      // Mark them as winners
      for (const sub of topSubmissions) {
        await supabase
          .from("group_bet_submissions")
          .update({ is_winner: true })
          .eq("id", sub.id);
      }
    }

    await supabase
      .from("group_bets")
      .update({ status: "betting" })
      .eq("id", groupBetId);

    router.refresh();
    setLoading(false);
  };

  const settle = async (won: boolean) => {
    setLoading(true);
    await supabase
      .from("group_bets")
      .update({ status: "settled" })
      .eq("id", groupBetId);
    // TODO: handle winnings distribution
    router.refresh();
    setLoading(false);
  };

  const deleteGroupBet = async () => {
    if (!confirm("Delete this group bet? This cannot be undone.")) return;
    setLoading(true);
    await supabase.from("group_bet_votes").delete().eq("submission_id", groupBetId);
    await supabase.from("group_bet_submissions").delete().eq("group_bet_id", groupBetId);
    await supabase.from("group_bets").delete().eq("id", groupBetId);
    router.push(`/league/${leagueId}/group-bet`);
  };

  return (
    <div className="space-y-3">
      {status === "submissions_open" && (
        <>
          <p className="text-sm text-[var(--text-secondary)]">
            {submissionCount} legs submitted so far
          </p>
          <button
            onClick={moveToVoting}
            disabled={loading || submissionCount < winningCount}
            className="btn btn-primary w-full"
          >
            {loading ? "..." : "OPEN VOTING"}
          </button>
          {submissionCount < winningCount && (
            <p className="text-xs text-[var(--text-secondary)] text-center">
              Need at least {winningCount} submissions to start voting
            </p>
          )}
        </>
      )}

      {status === "voting_open" && (
        <button
          onClick={finalize}
          disabled={loading}
          className="btn btn-primary w-full"
        >
          {loading ? "..." : "FINALIZE ACCA"}
        </button>
      )}

      {status === "betting" && (
        <div className="flex gap-3">
          <button
            onClick={() => settle(false)}
            disabled={loading}
            className="btn btn-danger flex-1"
          >
            LOST
          </button>
          <button
            onClick={() => settle(true)}
            disabled={loading}
            className="btn btn-primary flex-1"
          >
            WON
          </button>
        </div>
      )}

      {status !== "settled" && (
        <button
          onClick={deleteGroupBet}
          disabled={loading}
          className="text-sm text-[var(--danger)] w-full py-2"
        >
          Delete Group Bet
        </button>
      )}
    </div>
  );
}
