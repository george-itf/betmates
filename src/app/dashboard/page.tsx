import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { CreateLeagueButton } from "@/components/create-league-button";
import { JoinLeagueButton } from "@/components/join-league-button";
import { PushPrompt } from "@/components/push-prompt";
import { IconUser } from "@/components/icons";

export default async function DashboardPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("display_name")
    .eq("id", user.id)
    .single();

  const { data: memberships } = await supabase
    .from("league_members")
    .select(`
      role,
      league:leagues (
        id, name, weekly_buyin,
        seasons ( id, season_number, status, pot_amount )
      )
    `)
    .eq("user_id", user.id);

  const leagues = (memberships as unknown as Array<{
    role: string;
    league: {
      id: string;
      name: string;
      weekly_buyin: number;
      seasons: Array<{ id: string; season_number: number; status: string; pot_amount: number }>;
    };
  }>)?.map((m) => {
    const s = m.league?.seasons?.find((s) => s.status === "active") || m.league?.seasons?.[0];
    return { ...m.league, role: m.role, season: s };
  }) || [];

  return (
    <main className="min-h-screen bg-[var(--bg)] safe-t safe-b">
      {/* Header */}
      <div className="header flex items-center justify-between">
        <h1 className="text-lg font-bold tracking-tight">BETMATES</h1>
        <Link href="/profile" className="flex items-center gap-2 text-sm text-[var(--text-secondary)]">
          <IconUser className="icon" />
          <span>{profile?.display_name || "Profile"}</span>
        </Link>
      </div>

      <div className="p-4 max-w-lg mx-auto">
        {/* Welcome */}
        <div className="mb-6">
          <h2 className="text-xl font-bold">
            {profile?.display_name ? `Hi, ${profile.display_name.split(' ')[0]}` : 'Dashboard'}
          </h2>
          <p className="text-[var(--text-secondary)] text-sm">
            {leagues.length === 0 ? "Create or join a league to get started" : `${leagues.length} league${leagues.length !== 1 ? 's' : ''}`}
          </p>
        </div>

        {/* Leagues */}
        {leagues.length > 0 ? (
          <div className="space-y-3 mb-6">
            {leagues.map((league) => (
              <Link key={league.id} href={`/league/${league.id}`} className="card block">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-semibold">{league.name}</h3>
                    <p className="text-sm text-[var(--text-secondary)]">
                      Season {league.season?.season_number || 1}
                      {league.role === "admin" && <span className="ml-2 badge badge-gray">Admin</span>}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-xl font-bold text-[var(--accent)]">£{league.season?.pot_amount || 0}</p>
                    <p className="text-xs text-[var(--text-secondary)] uppercase">Pot</p>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="card text-center py-10 mb-6">
            <p className="text-[var(--text-secondary)]">No leagues yet</p>
            <p className="text-sm text-[var(--text-secondary)]">Create one or join with an invite code</p>
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-3">
          <CreateLeagueButton />
          <JoinLeagueButton />
        </div>
      </div>

      {/* Push notification prompt */}
      <PushPrompt />
    </main>
  );
}
