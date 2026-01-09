"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";

interface Submission {
  id: string;
  user_id: string;
  selection: string;
  odds_fractional: string;
  votes_count: number;
  profiles: { display_name: string };
}

export function VotingPanel({ groupBetId, submissions, votedIds, userId, winningCount }: {
  groupBetId: string;
  submissions: Submission[];
  votedIds: Set<string>;
  userId: string;
  winningCount: number;
}) {
  const [voted, setVoted] = useState(votedIds);
  const [loading, setLoading] = useState<string | null>(null);
  const router = useRouter();
  const supabase = createClient();

  const toggle = async (subId: string) => {
    const isOwn = submissions.find((s) => s.id === subId)?.user_id === userId;
    if (isOwn) return;

    setLoading(subId);
    const hasVoted = voted.has(subId);

    // Optimistic
    setVoted((prev) => {
      const next = new Set(prev);
      hasVoted ? next.delete(subId) : next.add(subId);
      return next;
    });

    if (hasVoted) {
      await supabase.from("group_bet_votes").delete().eq("submission_id", subId).eq("user_id", userId);
      await supabase.rpc("decrement_votes", { submission_id: subId });
    } else {
      await supabase.from("group_bet_votes").insert({ group_bet_id: groupBetId, submission_id: subId, user_id: userId });
      await supabase.rpc("increment_votes", { submission_id: subId });
    }

    router.refresh();
    setLoading(null);
  };

  return (
    <div>
      <p className="text-xs text-[var(--muted)] mb-3">Vote for the best legs (top {winningCount} win)</p>
      <ul className="border-t border-[var(--border)]">
        {submissions.map((sub) => {
          const isOwn = sub.user_id === userId;
          const isVoted = voted.has(sub.id);
          return (
            <li key={sub.id} className="border-b border-[var(--border)]">
              <button
                onClick={() => toggle(sub.id)}
                disabled={isOwn || loading === sub.id}
                className={`w-full text-left py-3 text-sm ${isOwn ? "opacity-50" : ""}`}
              >
                <div className="flex justify-between">
                  <span className={isVoted ? "font-medium" : ""}>{sub.selection}</span>
                  <span className="text-[var(--muted)]">{sub.odds_fractional}</span>
                </div>
                <div className="flex justify-between text-xs text-[var(--muted)] mt-1">
                  <span>{sub.profiles?.display_name}{isOwn ? " (you)" : ""}</span>
                  <span>{isVoted ? "▲" : "△"} {sub.votes_count + (isVoted && !votedIds.has(sub.id) ? 1 : 0) - (!isVoted && votedIds.has(sub.id) ? 1 : 0)}</span>
                </div>
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
