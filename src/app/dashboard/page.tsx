import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { CreateLeagueButton } from "@/components/create-league-button";
import { JoinLeagueButton } from "@/components/join-league-button";

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
        id, name,
        seasons ( id, season_number, status, pot_amount )
      )
    `)
    .eq("user_id", user.id);

  const leagues = (memberships as unknown as Array<{
    role: string;
    league: {
      id: string;
      name: string;
      seasons: Array<{ id: string; season_number: number; status: string; pot_amount: number }>;
    };
  }>)?.map((m) => {
    const s = m.league?.seasons?.find((s) => s.status === "active") || m.league?.seasons?.[0];
    return { ...m.league, role: m.role, season: s };
  }) || [];

  return (
    <main className="min-h-screen px-5 py-6 safe-t safe-b">
      <div className="max-w-md mx-auto">
        <header className="flex items-baseline justify-between mb-6">
          <h1 className="text-lg font-medium">{profile?.display_name || "Leagues"}</h1>
          <Link href="/profile" className="text-sm text-[var(--muted)]">Profile</Link>
        </header>

        {leagues.length > 0 ? (
          <ul className="border-t border-[var(--border)]">
            {leagues.map((l) => (
              <li key={l.id} className="border-b border-[var(--border)]">
                <Link href={`/league/${l.id}`} className="flex justify-between py-3">
                  <div>
                    <span className="font-medium">{l.name}</span>
                    <span className="text-[var(--muted)] text-sm ml-2">
                      S{l.season?.season_number || 1}
                    </span>
                  </div>
                  <span className="text-[var(--green)] font-medium">
                    £{l.season?.pot_amount || 0}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-[var(--muted)] py-8 text-center text-sm">No leagues</p>
        )}

        <div className="flex gap-2 mt-6">
          <CreateLeagueButton />
          <JoinLeagueButton />
        </div>
      </div>
    </main>
  );
}
