import { createClient } from "@/lib/supabase/server";
import { redirect, notFound } from "next/navigation";
import Link from "next/link";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function LeaguePage({ params }: PageProps) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: membership } = await supabase
    .from("league_members")
    .select("role")
    .eq("league_id", id)
    .eq("user_id", user.id)
    .single();

  if (!membership) redirect("/dashboard");

  const { data: league } = await supabase
    .from("leagues")
    .select(`*, seasons ( id, season_number, status, starts_at, ends_at, pot_amount )`)
    .eq("id", id)
    .single();

  if (!league) notFound();

  const seasons = (league.seasons || []) as Array<{ id: string; status: string; season_number: number; starts_at: string; ends_at: string; pot_amount: number }>;
  const season = seasons.find((s) => s.status === "active") || seasons[0];

  // Calculate current week
  const currentWeek = season ? Math.max(1, Math.ceil((Date.now() - new Date(season.starts_at).getTime()) / (7 * 24 * 60 * 60 * 1000))) : 1;

  // Check if user paid this week
  let hasPaidThisWeek = false;
  if (season) {
    const { data: payment } = await supabase
      .from("payments")
      .select("id")
      .eq("season_id", season.id)
      .eq("user_id", user.id)
      .eq("week_number", currentWeek)
      .eq("status", "paid")
      .single();
    hasPaidThisWeek = !!payment;
  }

  // Leaderboard
  let leaderboard: Array<{ user_id: string; display_name: string; profit: number; roi: number; wins: number; total_bets: number }> = [];
  if (season) {
    const { data } = await supabase.rpc("get_season_leaderboard", { p_season_id: season.id });
    leaderboard = data || [];
  }

  // Recent bets
  let bets: Array<{
    id: string; user_id: string; stake: number; status: string; actual_return: number;
    profiles: { display_name: string } | Array<{ display_name: string }>;
    bet_legs: Array<{ selection: string }>;
  }> = [];
  if (season) {
    const { data } = await supabase
      .from("bets")
      .select(`id, user_id, stake, status, actual_return, profiles!bets_user_id_fkey(display_name), bet_legs(selection)`)
      .eq("season_id", season.id)
      .order("placed_at", { ascending: false })
      .limit(10);
    bets = (data || []) as typeof bets;
  }

  const daysLeft = season ? Math.max(0, Math.ceil((new Date(season.ends_at).getTime() - Date.now()) / 86400000)) : 0;
  const buyin = league.weekly_buyin || 5;

  return (
    <main className="min-h-screen px-5 py-6 safe-t safe-b">
      <div className="max-w-md mx-auto">
        {/* Header */}
        <header className="flex items-baseline justify-between mb-1">
          <Link href="/dashboard" className="text-[var(--muted)] text-sm">← Back</Link>
          {membership.role === "admin" && (
            <Link href={`/league/${id}/settings`} className="text-sm text-[var(--muted)]">Settings</Link>
          )}
        </header>

        <div className="flex items-baseline justify-between mb-6">
          <h1 className="text-lg font-medium">{league.name}</h1>
          <div className="text-right">
            <p className="text-xl font-semibold text-[var(--green)]">£{season?.pot_amount || 0}</p>
            <p className="text-xs text-[var(--muted)]">{daysLeft}d left · week {currentWeek}</p>
          </div>
        </div>

        {/* Payment Status */}
        <div className="flex items-center justify-between py-3 border-y border-[var(--border)] mb-6 text-sm">
          {hasPaidThisWeek ? (
            <>
              <span className="text-[var(--green)]">Week {currentWeek} paid</span>
              <span className="text-[var(--muted)]">£{buyin}</span>
            </>
          ) : (
            <>
              <span>Week {currentWeek} buy-in</span>
              <a
                href={`https://paypal.me/harbourgate/${buyin}`}
                target="_blank"
                rel="noopener noreferrer"
                className="px-3 py-1 bg-[var(--white)] text-[var(--bg)] rounded text-sm font-medium"
              >
                Pay £{buyin}
              </a>
            </>
          )}
        </div>

        {/* Invite */}
        <div className="flex items-center justify-between py-2 border-b border-[var(--border)] mb-6 text-sm">
          <span className="text-[var(--muted)]">Invite</span>
          <span className="mono">{league.invite_code}</span>
        </div>

        {/* Leaderboard */}
        <section className="mb-6">
          <h2 className="text-xs text-[var(--muted)] uppercase tracking-wide mb-2">Leaderboard</h2>
          {leaderboard.length > 0 ? (
            <ul className="border-t border-[var(--border)]">
              {leaderboard.map((entry, i) => (
                <li key={entry.user_id} className="flex items-center justify-between py-2 border-b border-[var(--border)] text-sm">
                  <div className="flex items-center gap-3">
                    <span className="w-5 text-[var(--muted)]">{i + 1}</span>
                    <span className={entry.user_id === user.id ? "font-medium" : ""}>{entry.display_name}</span>
                  </div>
                  <span className={entry.profit >= 0 ? "text-[var(--green)]" : "text-[var(--red)]"}>
                    {entry.profit >= 0 ? "+" : ""}£{entry.profit.toFixed(2)}
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-[var(--muted)] py-4">No bets yet</p>
          )}
        </section>

        {/* Recent bets */}
        <section className="mb-6">
          <h2 className="text-xs text-[var(--muted)] uppercase tracking-wide mb-2">Recent</h2>
          {bets.length > 0 ? (
            <ul className="border-t border-[var(--border)]">
              {bets.map((bet) => {
                const profile = Array.isArray(bet.profiles) ? bet.profiles[0] : bet.profiles;
                const profit = bet.status === "settled" ? (bet.actual_return || 0) - bet.stake : 0;
                return (
                  <li key={bet.id} className="py-2 border-b border-[var(--border)] text-sm">
                    <div className="flex justify-between">
                      <span>{profile?.display_name}</span>
                      <span>
                        {bet.status === "settled" ? (
                          <span className={profit >= 0 ? "text-[var(--green)]" : "text-[var(--red)]"}>
                            {profit >= 0 ? "+" : ""}£{profit.toFixed(2)}
                          </span>
                        ) : (
                          <span className="text-[var(--muted)]">£{bet.stake}</span>
                        )}
                      </span>
                    </div>
                    <p className="text-[var(--muted)] text-xs truncate">
                      {bet.bet_legs.map((l) => l.selection).join(" · ")}
                    </p>
                  </li>
                );
              })}
            </ul>
          ) : (
            <p className="text-sm text-[var(--muted)] py-4">No bets yet</p>
          )}
        </section>

        {/* Group bets link */}
        <Link href={`/league/${id}/group-bet`} className="block py-3 border-y border-[var(--border)] text-sm mb-6">
          <span>Group bets</span>
          <span className="text-[var(--muted)] float-right">→</span>
        </Link>

        {/* Add bet */}
        {season && (
          <Link
            href={`/league/${id}/bet/new?season=${season.id}`}
            className="block w-full text-center py-2.5 bg-[var(--white)] text-[var(--bg)] rounded text-sm font-medium"
          >
            Add bet
          </Link>
        )}
      </div>
    </main>
  );
}
