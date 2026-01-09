import { createClient } from "@/lib/supabase/server";
import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { CopyButton } from "@/components/copy-button";
import { ActivityFeed } from "@/components/activity-feed";

interface PageProps {
  params: Promise<{ id: string }>;
}

function getDeadlineText(deadlineDay: number, deadlineHour: number) {
  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const now = new Date();
  const deadline = new Date();
  deadline.setDate(deadline.getDate() + ((deadlineDay - deadline.getDay() + 7) % 7 || 7));
  deadline.setHours(deadlineHour, 0, 0, 0);
  if (deadline < now) deadline.setDate(deadline.getDate() + 7);
  const diff = deadline.getTime() - now.getTime();
  const daysLeft = Math.floor(diff / 86400000);
  const hoursLeft = Math.floor((diff % 86400000) / 3600000);
  return `${days[deadlineDay]} ${deadlineHour}:00 (${daysLeft}d ${hoursLeft}h)`;
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

  const currentWeek = season ? Math.max(1, Math.ceil((Date.now() - new Date(season.starts_at).getTime()) / (7 * 24 * 60 * 60 * 1000))) : 1;

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

  let leaderboard: Array<{ user_id: string; display_name: string; profit: number }> = [];
  if (season) {
    const { data } = await supabase.rpc("get_season_leaderboard", { p_season_id: season.id });
    leaderboard = data || [];
  }

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
      .limit(5);
    bets = (data || []) as typeof bets;
  }

  const daysLeft = season ? Math.max(0, Math.ceil((new Date(season.ends_at).getTime() - Date.now()) / 86400000)) : 0;
  const buyin = league.weekly_buyin || 5;

  const { data: activityData } = await supabase
    .from("activity_log")
    .select("*")
    .eq("league_id", id)
    .order("created_at", { ascending: false })
    .limit(10);

  const activities = (activityData || []) as Array<{
    id: string;
    event_type: string;
    data: Record<string, unknown>;
    created_at: string;
  }>;

  return (
    <main className="min-h-screen bg-[var(--bg)] safe-t" style={{ paddingBottom: '80px' }}>
      <div className="header flex items-center justify-between">
        <Link href="/dashboard" className="text-[var(--accent)] text-sm">← Back</Link>
        {membership.role === "admin" && (
          <Link href={`/league/${id}/settings`} className="text-[var(--text-secondary)] text-sm">Settings</Link>
        )}
      </div>

      <div className="p-4 max-w-lg mx-auto">
        {/* Header */}
        <div className="mb-5">
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-lg font-bold">{league.name}</h1>
              <p className="text-sm text-[var(--text-secondary)]">Season {season?.season_number || 1} · {daysLeft}d left</p>
            </div>
            <div className="text-right">
              <p className="text-xl font-bold text-[var(--accent)]">£{season?.pot_amount || 0}</p>
              <p className="text-xs text-[var(--text-secondary)]">pot</p>
            </div>
          </div>
          
          <div className="mt-3 text-sm text-[var(--text-secondary)]">
            Deadline: {getDeadlineText(league.bet_deadline_day ?? 5, league.bet_deadline_hour ?? 15)}
          </div>
        </div>

        {/* Payment */}
        <div className="card mb-4">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-sm">Week {currentWeek} · £{buyin}</span>
            </div>
            {hasPaidThisWeek ? (
              <span className="text-sm text-[var(--accent)]">✓ Paid</span>
            ) : (
              <a
                href={`https://paypal.me/harbourgate/${buyin}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-[var(--accent)]"
              >
                Pay →
              </a>
            )}
          </div>
        </div>

        {/* Invite */}
        <div className="card mb-4">
          <div className="flex items-center justify-between">
            <span className="font-mono text-lg">{league.invite_code}</span>
            <CopyButton text={league.invite_code} />
          </div>
        </div>

        {/* Leaderboard */}
        <div className="card mb-4">
          <div className="text-xs text-[var(--text-secondary)] mb-2">Leaderboard</div>
          {leaderboard.length > 0 ? (
            <div className="space-y-1">
              {leaderboard.map((entry, i) => (
                <div key={entry.user_id} className="flex items-center justify-between py-1">
                  <span className={entry.user_id === user.id ? "font-medium" : ""}>
                    {i + 1}. {entry.display_name}{entry.user_id === user.id && " (you)"}
                  </span>
                  <span className={entry.profit >= 0 ? "text-[var(--accent)]" : "text-[var(--danger)]"}>
                    {entry.profit >= 0 ? "+" : ""}£{entry.profit.toFixed(2)}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-[var(--text-secondary)] text-sm">No bets yet</p>
          )}
        </div>

        {/* Recent bets */}
        {bets.length > 0 && (
          <div className="card mb-4">
            <div className="text-xs text-[var(--text-secondary)] mb-2">Recent bets</div>
            <div className="space-y-2">
              {bets.map((bet) => {
                const profile = Array.isArray(bet.profiles) ? bet.profiles[0] : bet.profiles;
                return (
                  <div key={bet.id} className="flex items-center justify-between text-sm">
                    <div className="min-w-0 flex-1">
                      <span className="font-medium">{profile?.display_name}</span>
                      <span className="text-[var(--text-secondary)]"> · </span>
                      <span className="text-[var(--text-secondary)] truncate">
                        {bet.bet_legs[0]?.selection}
                      </span>
                    </div>
                    <span className="ml-2">£{bet.stake}</span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Links */}
        <div className="card mb-4">
          <div className="space-y-2 text-sm">
            <Link href={`/league/${id}/bets`} className="block py-1 text-[var(--accent)]">My bets →</Link>
            <Link href={`/league/${id}/group-bet`} className="block py-1 text-[var(--accent)]">Group bets →</Link>
            <Link href={`/league/${id}/members`} className="block py-1 text-[var(--accent)]">Members →</Link>
            <Link href={`/league/${id}/stats`} className="block py-1 text-[var(--accent)]">Stats →</Link>
          </div>
        </div>

        {/* Activity */}
        {activities.length > 0 && (
          <div className="card">
            <div className="text-xs text-[var(--text-secondary)] mb-2">Activity</div>
            <ActivityFeed leagueId={id} initialActivities={activities} userId={user.id} />
          </div>
        )}
      </div>

      {/* Add bet */}
      <div className="fixed bottom-0 left-0 right-0 p-3 bg-[var(--surface)] border-t border-[var(--border)]">
        <Link
          href={`/league/${id}/bet/new?season=${season?.id || ''}`}
          className="btn btn-primary w-full"
        >
          + Add bet
        </Link>
      </div>
    </main>
  );
}
