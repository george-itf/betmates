import { createClient } from "@/lib/supabase/server";
import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { CreateGroupBetButton } from "@/components/create-group-bet-button";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function GroupBetsPage({ params }: PageProps) {
  const { id: leagueId } = await params;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // Check membership
  const { data: membership } = await supabase
    .from("league_members")
    .select("role")
    .eq("league_id", leagueId)
    .eq("user_id", user.id)
    .single();

  if (!membership) {
    redirect("/dashboard");
  }

  // Get league with current season
  const { data: league } = await supabase
    .from("leagues")
    .select(`
      *,
      seasons (
        id,
        season_number,
        status
      )
    `)
    .eq("id", leagueId)
    .single();

  if (!league) {
    notFound();
  }

  const currentSeason = league.seasons?.find((s: { status: string }) => s.status === "active");

  // Get group bets for current season
  let groupBets: Array<{
    id: string;
    title: string;
    buyin_per_user: number;
    status: string;
    submission_deadline: string;
    voting_deadline: string;
    result: string;
    final_odds_decimal: number | null;
    total_stake: number | null;
    payout_per_user: number | null;
    _count: { submissions: number; participants: number };
  }> = [];

  if (currentSeason) {
    const { data } = await supabase
      .from("group_bets")
      .select(`
        id,
        title,
        buyin_per_user,
        status,
        submission_deadline,
        voting_deadline,
        result,
        final_odds_decimal,
        total_stake,
        payout_per_user
      `)
      .eq("season_id", currentSeason.id)
      .order("created_at", { ascending: false });

    groupBets = (data || []).map(gb => ({ ...gb, _count: { submissions: 0, participants: 0 } }));
  }

  const getStatusBadge = (status: string, result: string) => {
    if (result === "won") return { text: "won! 🎉", color: "var(--success)" };
    if (result === "lost") return { text: "lost", color: "var(--danger)" };
    if (status === "submissions_open") return { text: "submit legs", color: "var(--accent)" };
    if (status === "voting_open") return { text: "vote now", color: "var(--warning)" };
    if (status === "betting") return { text: "bet placed", color: "var(--muted)" };
    return { text: status, color: "var(--muted)" };
  };

  return (
    <main className="min-h-screen p-4 safe-top safe-bottom">
      <div className="max-w-lg mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <Link href={`/league/${leagueId}`} className="text-[var(--muted)]">
            ← back
          </Link>
          <h1 className="font-bold">group bets</h1>
          <div className="w-12" />
        </div>

        {/* Explainer */}
        <div className="card bg-[var(--accent)]/10 border-[var(--accent)]/30">
          <p className="text-sm">
            <strong>how it works:</strong> everyone submits legs → vote on the best → 
            top picks become a combined acca → share the winnings 🤝
          </p>
        </div>

        {/* Group Bets List */}
        {groupBets.length > 0 ? (
          <div className="space-y-3">
            {groupBets.map((gb) => {
              const badge = getStatusBadge(gb.status, gb.result);
              return (
                <Link
                  key={gb.id}
                  href={`/league/${leagueId}/group-bet/${gb.id}`}
                  className="card block hover:border-[var(--accent)] transition-colors"
                >
                  <div className="flex items-start justify-between mb-2">
                    <h3 className="font-medium">{gb.title}</h3>
                    <span
                      className="text-xs px-2 py-1 rounded-full"
                      style={{
                        backgroundColor: `color-mix(in srgb, ${badge.color} 20%, transparent)`,
                        color: badge.color,
                      }}
                    >
                      {badge.text}
                    </span>
                  </div>
                  <div className="flex items-center gap-3 text-sm text-[var(--muted)]">
                    <span>£{gb.buyin_per_user} buy-in</span>
                    {gb.final_odds_decimal && (
                      <>
                        <span>•</span>
                        <span>{gb.final_odds_decimal.toFixed(1)}x odds</span>
                      </>
                    )}
                    {gb.result === "won" && gb.payout_per_user && (
                      <>
                        <span>•</span>
                        <span className="text-[var(--success)]">
                          +£{gb.payout_per_user.toFixed(2)} each
                        </span>
                      </>
                    )}
                  </div>
                </Link>
              );
            })}
          </div>
        ) : (
          <div className="card text-center py-12 space-y-2">
            <div className="text-4xl">🤝</div>
            <p className="text-[var(--muted)]">no group bets yet</p>
            {membership.role === "admin" && (
              <p className="text-sm text-[var(--muted)]">create one below</p>
            )}
          </div>
        )}

        {/* Create Button (admin only) */}
        {membership.role === "admin" && currentSeason && (
          <CreateGroupBetButton leagueId={leagueId} seasonId={currentSeason.id} league={league} />
        )}
      </div>
    </main>
  );
}
