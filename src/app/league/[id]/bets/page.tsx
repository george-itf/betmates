import { createClient } from "@/lib/supabase/server";
import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { IconArrowLeft } from "@/components/icons";

interface PageProps {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ filter?: string }>;
}

export default async function BetsHistoryPage({ params, searchParams }: PageProps) {
  const { id } = await params;
  const { filter = "all" } = await searchParams;
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
    .select(`*, seasons ( id, season_number, status )`)
    .eq("id", id)
    .single();

  if (!league) notFound();

  const seasons = (league.seasons || []) as Array<{ id: string; status: string; season_number: number }>;
  const season = seasons.find((s) => s.status === "active") || seasons[0];

  // Get user's bets in this season
  let bets: Array<{
    id: string;
    stake: number;
    potential_return: number;
    actual_return: number | null;
    status: string;
    placed_at: string;
    bet_legs: Array<{ selection: string; odds_fractional: string }>;
  }> = [];

  if (season) {
    let query = supabase
      .from("bets")
      .select(`id, stake, potential_return, actual_return, status, placed_at, bet_legs(selection, odds_fractional)`)
      .eq("season_id", season.id)
      .eq("user_id", user.id)
      .order("placed_at", { ascending: false });

    if (filter === "pending") {
      query = query.eq("status", "pending");
    } else if (filter === "won") {
      query = query.eq("status", "settled").gt("actual_return", 0);
    } else if (filter === "lost") {
      query = query.eq("status", "settled").eq("actual_return", 0);
    }

    const { data } = await query;
    bets = data || [];
  }

  // Calculate totals
  const totalStaked = bets.reduce((sum, b) => sum + b.stake, 0);
  const totalReturned = bets.reduce((sum, b) => sum + (b.actual_return || 0), 0);
  const profitLoss = totalReturned - totalStaked;

  const filterTabs = [
    { key: "all", label: "ALL" },
    { key: "pending", label: "PENDING" },
    { key: "won", label: "WON" },
    { key: "lost", label: "LOST" },
  ];

  return (
    <main className="min-h-screen bg-[var(--bg)] safe-t safe-b">
      {/* Header */}
      <div className="header flex items-center justify-between">
        <Link href={`/league/${id}`} className="flex items-center gap-1 text-[var(--accent)] font-medium text-sm">
          <IconArrowLeft className="w-4 h-4" />
          <span>Back</span>
        </Link>
        <h1 className="font-bold text-sm uppercase tracking-wide">My Bets</h1>
        <div className="w-16" />
      </div>

      <div className="p-4 max-w-lg mx-auto">
        {/* Stats */}
        <div className="card mb-4">
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <p className="text-xs text-[var(--text-secondary)] uppercase">Staked</p>
              <p className="text-lg font-bold">£{totalStaked.toFixed(2)}</p>
            </div>
            <div>
              <p className="text-xs text-[var(--text-secondary)] uppercase">Returned</p>
              <p className="text-lg font-bold">£{totalReturned.toFixed(2)}</p>
            </div>
            <div>
              <p className="text-xs text-[var(--text-secondary)] uppercase">P&L</p>
              <p className={`text-lg font-bold ${profitLoss >= 0 ? "text-[var(--accent)]" : "text-[var(--danger)]"}`}>
                {profitLoss >= 0 ? "+" : ""}£{profitLoss.toFixed(2)}
              </p>
            </div>
          </div>
        </div>

        {/* Filter tabs */}
        <div className="flex gap-2 mb-4 overflow-x-auto">
          {filterTabs.map((tab) => (
            <Link
              key={tab.key}
              href={`/league/${id}/bets${tab.key === "all" ? "" : `?filter=${tab.key}`}`}
              className={`px-4 py-2 text-xs font-semibold rounded whitespace-nowrap ${
                filter === tab.key
                  ? "bg-[var(--accent)] text-white"
                  : "bg-[var(--surface)] text-[var(--text-secondary)] border border-[var(--border)]"
              }`}
            >
              {tab.label}
            </Link>
          ))}
        </div>

        {/* Bets list */}
        {bets.length > 0 ? (
          <div className="space-y-3">
            {bets.map((bet) => {
              const profit = bet.status === "settled" ? (bet.actual_return || 0) - bet.stake : 0;
              const isWon = bet.status === "settled" && (bet.actual_return || 0) > 0;
              const isLost = bet.status === "settled" && (bet.actual_return || 0) === 0;

              return (
                <div key={bet.id} className="card">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-[var(--text-secondary)]">
                        {new Date(bet.placed_at).toLocaleDateString("en-GB", {
                          day: "numeric",
                          month: "short",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </p>
                    </div>
                    <span
                      className={`badge ${
                        bet.status === "pending"
                          ? "badge-yellow"
                          : isWon
                          ? "badge-green"
                          : "badge-red"
                      }`}
                    >
                      {bet.status === "pending" ? "PENDING" : isWon ? "WON" : "LOST"}
                    </span>
                  </div>

                  <div className="space-y-1 mb-3">
                    {bet.bet_legs.map((leg, i) => (
                      <div key={i} className="flex items-center justify-between text-sm">
                        <span className="truncate flex-1">{leg.selection}</span>
                        <span className="text-[var(--text-secondary)] ml-2">{leg.odds_fractional}</span>
                      </div>
                    ))}
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t border-[var(--border)]">
                    <div>
                      <span className="text-xs text-[var(--text-secondary)]">Stake: </span>
                      <span className="font-semibold">£{bet.stake.toFixed(2)}</span>
                    </div>
                    {bet.status === "pending" ? (
                      <div>
                        <span className="text-xs text-[var(--text-secondary)]">Returns: </span>
                        <span className="font-semibold text-[var(--accent)]">
                          £{bet.potential_return.toFixed(2)}
                        </span>
                      </div>
                    ) : (
                      <div>
                        <span className="text-xs text-[var(--text-secondary)]">P&L: </span>
                        <span
                          className={`font-semibold ${
                            profit >= 0 ? "text-[var(--accent)]" : "text-[var(--danger)]"
                          }`}
                        >
                          {profit >= 0 ? "+" : ""}£{profit.toFixed(2)}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="card text-center py-10">
            <p className="text-[var(--text-secondary)]">No bets found</p>
          </div>
        )}
      </div>
    </main>
  );
}
