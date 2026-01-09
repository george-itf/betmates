import { createClient } from "@/lib/supabase/server";
import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { CreateGroupBetButton } from "@/components/create-group-bet-button";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function GroupBetsPage({ params }: PageProps) {
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
    .select(`*, seasons ( id, status )`)
    .eq("id", id)
    .single();

  if (!league) notFound();

  const seasons = (league.seasons || []) as Array<{ id: string; status: string }>;
  const currentSeason = seasons.find((s) => s.status === "active");

  let groupBets: Array<{ id: string; title: string; status: string; result: string; buyin_per_user: number }> = [];
  if (currentSeason) {
    const { data } = await supabase
      .from("group_bets")
      .select("id, title, status, result, buyin_per_user")
      .eq("season_id", currentSeason.id)
      .order("created_at", { ascending: false });
    groupBets = data || [];
  }

  return (
    <main className="min-h-screen px-5 py-6 safe-t safe-b">
      <div className="max-w-md mx-auto">
        <header className="flex items-center justify-between mb-6">
          <Link href={`/league/${id}`} className="text-[var(--muted)] text-sm">← Back</Link>
          <h1 className="font-medium">Group bets</h1>
          <div className="w-12" />
        </header>

        <p className="text-sm text-[var(--muted)] mb-6">
          Everyone submits legs, vote on the best, build a combined acca.
        </p>

        {groupBets.length > 0 ? (
          <ul className="border-t border-[var(--border)] mb-6">
            {groupBets.map((gb) => (
              <li key={gb.id} className="border-b border-[var(--border)]">
                <Link href={`/league/${id}/group-bet/${gb.id}`} className="flex justify-between py-3 text-sm">
                  <span>{gb.title}</span>
                  <span className={
                    gb.result === "won" ? "text-[var(--green)]" :
                    gb.result === "lost" ? "text-[var(--red)]" :
                    "text-[var(--muted)]"
                  }>
                    {gb.status === "submissions_open" ? "Submit" :
                     gb.status === "voting_open" ? "Vote" :
                     gb.status === "betting" ? "Placed" :
                     gb.result === "won" ? "Won" : gb.result === "lost" ? "Lost" : gb.status}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-[var(--muted)] py-8 text-center">No group bets yet</p>
        )}

        {membership.role === "admin" && currentSeason && (
          <CreateGroupBetButton leagueId={id} seasonId={currentSeason.id} />
        )}
      </div>
    </main>
  );
}
