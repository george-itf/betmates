import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { LeagueCard } from "@/components/league-card";
import { CreateLeagueButton } from "@/components/create-league-button";
import { JoinLeagueButton } from "@/components/join-league-button";

export default async function DashboardPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // Get user's profile
  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  // Get user's leagues with current season info
  const { data: memberships } = await supabase
    .from("league_members")
    .select(`
      role,
      league:leagues (
        id,
        name,
        invite_code,
        weekly_buyin,
        seasons (
          id,
          season_number,
          status,
          starts_at,
          ends_at,
          pot_amount
        )
      )
    `)
    .eq("user_id", user.id);

  const leagues = memberships?.map((m) => ({
    ...m.league,
    role: m.role,
    currentSeason: m.league?.seasons?.find((s: { status: string }) => s.status === "active") || 
                   m.league?.seasons?.find((s: { status: string }) => s.status === "upcoming") ||
                   m.league?.seasons?.[0],
  })) || [];

  return (
    <main className="min-h-screen p-6 safe-top safe-bottom">
      <div className="max-w-lg mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">hey {profile?.display_name || "mate"}</h1>
            <p className="text-[var(--muted)] text-sm">your leagues</p>
          </div>
          <Link
            href="/profile"
            className="w-10 h-10 rounded-full bg-[var(--card)] flex items-center justify-center text-lg"
          >
            {profile?.display_name?.[0]?.toUpperCase() || "?"}
          </Link>
        </div>

        {/* Leagues */}
        {leagues.length > 0 ? (
          <div className="space-y-3">
            {leagues.map((league) => (
              <LeagueCard key={league.id} league={league} />
            ))}
          </div>
        ) : (
          <div className="card text-center py-12 space-y-4">
            <div className="text-4xl">🏆</div>
            <div>
              <h2 className="font-medium">no leagues yet</h2>
              <p className="text-sm text-[var(--muted)]">
                create one or join with an invite code
              </p>
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-3">
          <CreateLeagueButton />
          <JoinLeagueButton />
        </div>
      </div>
    </main>
  );
}
