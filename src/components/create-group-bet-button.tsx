"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";

interface League {
  group_bet_buyin: number;
  group_bet_legs_per_user: number;
  group_bet_winning_legs: number;
}

interface CreateGroupBetButtonProps {
  leagueId: string;
  seasonId: string;
  league: League;
}

export function CreateGroupBetButton({ leagueId, seasonId, league }: CreateGroupBetButtonProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  
  const [title, setTitle] = useState("");
  const [buyin, setBuyin] = useState(league.group_bet_buyin?.toString() || "2");
  const [legsPerUser, setLegsPerUser] = useState(league.group_bet_legs_per_user?.toString() || "4");
  const [winningLegs, setWinningLegs] = useState(league.group_bet_winning_legs?.toString() || "5");
  const [submissionHours, setSubmissionHours] = useState("24");
  const [votingHours, setVotingHours] = useState("12");

  const router = useRouter();
  const supabase = createClient();

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const now = new Date();
      const submissionDeadline = new Date(now.getTime() + parseInt(submissionHours) * 60 * 60 * 1000);
      const votingDeadline = new Date(submissionDeadline.getTime() + parseInt(votingHours) * 60 * 60 * 1000);

      const { data: groupBet, error: createError } = await supabase
        .from("group_bets")
        .insert({
          season_id: seasonId,
          title,
          buyin_per_user: parseFloat(buyin),
          legs_per_user: parseInt(legsPerUser),
          winning_legs_count: parseInt(winningLegs),
          submission_deadline: submissionDeadline.toISOString(),
          voting_deadline: votingDeadline.toISOString(),
          status: "submissions_open",
        })
        .select()
        .single();

      if (createError) throw createError;

      setOpen(false);
      router.push(`/league/${leagueId}/group-bet/${groupBet.id}`);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <button onClick={() => setOpen(true)} className="btn btn-primary w-full">
        + create group bet
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60" onClick={() => setOpen(false)} />
          <div className="relative bg-[var(--card)] rounded-xl p-6 w-full max-w-md border border-[var(--card-border)] max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-bold mb-4">create group bet</h2>

            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="block text-sm text-[var(--muted)] mb-1">title</label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Weekend Acca"
                  required
                  disabled={loading}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-[var(--muted)] mb-1">buy-in</label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--muted)]">£</span>
                    <input
                      type="number"
                      value={buyin}
                      onChange={(e) => setBuyin(e.target.value)}
                      min="0.50"
                      step="0.50"
                      required
                      disabled={loading}
                      className="pl-7"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm text-[var(--muted)] mb-1">legs per user</label>
                  <select
                    value={legsPerUser}
                    onChange={(e) => setLegsPerUser(e.target.value)}
                    disabled={loading}
                  >
                    <option value="2">2 legs</option>
                    <option value="3">3 legs</option>
                    <option value="4">4 legs</option>
                    <option value="5">5 legs</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm text-[var(--muted)] mb-1">
                  winning legs (final acca size)
                </label>
                <select
                  value={winningLegs}
                  onChange={(e) => setWinningLegs(e.target.value)}
                  disabled={loading}
                >
                  <option value="3">3 legs</option>
                  <option value="4">4 legs</option>
                  <option value="5">5 legs</option>
                  <option value="6">6 legs</option>
                  <option value="8">8 legs</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-[var(--muted)] mb-1">submit window</label>
                  <select
                    value={submissionHours}
                    onChange={(e) => setSubmissionHours(e.target.value)}
                    disabled={loading}
                  >
                    <option value="6">6 hours</option>
                    <option value="12">12 hours</option>
                    <option value="24">24 hours</option>
                    <option value="48">48 hours</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm text-[var(--muted)] mb-1">voting window</label>
                  <select
                    value={votingHours}
                    onChange={(e) => setVotingHours(e.target.value)}
                    disabled={loading}
                  >
                    <option value="6">6 hours</option>
                    <option value="12">12 hours</option>
                    <option value="24">24 hours</option>
                  </select>
                </div>
              </div>

              {error && <p className="text-[var(--danger)] text-sm">{error}</p>}

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="btn flex-1"
                  disabled={loading}
                >
                  cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary flex-1"
                  disabled={loading || !title}
                >
                  {loading ? "creating..." : "create"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
