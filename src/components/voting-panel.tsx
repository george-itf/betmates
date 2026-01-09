"use client";

import { useState, useTransition } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";

interface Submission {
  id: string;
  user_id: string;
  selection: string;
  event_name: string;
  odds_decimal: number;
  odds_fractional: string;
  votes_count: number;
  profiles: {
    display_name: string;
    avatar_url: string | null;
  };
}

interface VotingPanelProps {
  groupBetId: string;
  submissions: Submission[];
  votedSubmissionIds: Set<string>;
  userId: string;
  winningLegsCount: number;
}

export function VotingPanel({
  groupBetId,
  submissions,
  votedSubmissionIds,
  userId,
  winningLegsCount,
}: VotingPanelProps) {
  const [voted, setVoted] = useState(votedSubmissionIds);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();
  const supabase = createClient();

  const handleVote = async (submissionId: string) => {
    const hasVoted = voted.has(submissionId);

    // Optimistic update
    setVoted((prev) => {
      const next = new Set(prev);
      if (hasVoted) {
        next.delete(submissionId);
      } else {
        next.add(submissionId);
      }
      return next;
    });

    try {
      if (hasVoted) {
        // Remove vote
        await supabase
          .from("group_bet_votes")
          .delete()
          .eq("submission_id", submissionId)
          .eq("user_id", userId);

        // Decrement votes_count
        await supabase.rpc("decrement_votes", { submission_id: submissionId });
      } else {
        // Add vote
        await supabase.from("group_bet_votes").insert({
          group_bet_id: groupBetId,
          submission_id: submissionId,
          user_id: userId,
        });

        // Increment votes_count
        await supabase.rpc("increment_votes", { submission_id: submissionId });
      }

      startTransition(() => {
        router.refresh();
      });
    } catch (err) {
      // Revert optimistic update
      setVoted(votedSubmissionIds);
      console.error("Vote error:", err);
    }
  };

  // Group submissions by user
  const byUser = submissions.reduce((acc, s) => {
    if (!acc[s.user_id]) {
      acc[s.user_id] = {
        profile: s.profiles,
        submissions: [],
      };
    }
    acc[s.user_id].submissions.push(s);
    return acc;
  }, {} as Record<string, { profile: { display_name: string; avatar_url: string | null }; submissions: Submission[] }>);

  const totalVotes = voted.size;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-medium">vote for the best legs</h3>
        <span className="text-sm text-[var(--muted)]">
          top {winningLegsCount} win
        </span>
      </div>

      <div className="card bg-[var(--accent)]/10 border-[var(--accent)]/30">
        <p className="text-sm">
          tap legs to vote — you've voted for <strong>{totalVotes}</strong> so far.
          vote for as many as you like!
        </p>
      </div>

      {/* All submissions grouped by user */}
      <div className="space-y-4">
        {Object.entries(byUser).map(([oddsUserId, { profile, submissions: userSubs }]) => (
          <div key={oddsUserId} className="space-y-2">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-full bg-[var(--background)] flex items-center justify-center text-xs">
                {profile?.avatar_url ? (
                  <img
                    src={profile.avatar_url}
                    alt=""
                    className="w-full h-full rounded-full object-cover"
                  />
                ) : (
                  profile?.display_name?.[0]?.toUpperCase() || "?"
                )}
              </div>
              <span className="text-sm font-medium">
                {oddsUserId === userId ? "your legs" : profile?.display_name}
              </span>
            </div>

            <div className="space-y-2 pl-8">
              {userSubs.map((sub) => {
                const isVoted = voted.has(sub.id);
                const isOwn = sub.user_id === userId;

                return (
                  <button
                    key={sub.id}
                    onClick={() => !isOwn && handleVote(sub.id)}
                    disabled={isOwn || isPending}
                    className={`card w-full text-left transition-all ${
                      isVoted
                        ? "border-[var(--accent)] bg-[var(--accent)]/10"
                        : isOwn
                        ? "opacity-60 cursor-not-allowed"
                        : "hover:border-[var(--accent)]/50"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate">{sub.selection}</p>
                        {sub.event_name && (
                          <p className="text-sm text-[var(--muted)] truncate">
                            {sub.event_name}
                          </p>
                        )}
                      </div>
                      <div className="flex items-center gap-3 ml-3">
                        <span className="text-sm text-[var(--muted)]">
                          {sub.odds_fractional}
                        </span>
                        <div className="flex items-center gap-1">
                          <span className={isVoted ? "text-[var(--accent)]" : "text-[var(--muted)]"}>
                            {isVoted ? "▲" : "△"}
                          </span>
                          <span className="text-sm font-medium">
                            {sub.votes_count + (isVoted && !votedSubmissionIds.has(sub.id) ? 1 : 0) - (!isVoted && votedSubmissionIds.has(sub.id) ? 1 : 0)}
                          </span>
                        </div>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {submissions.length === 0 && (
        <div className="card text-center py-8">
          <p className="text-[var(--muted)]">no submissions yet</p>
        </div>
      )}
    </div>
  );
}
