import { createClient } from "@/lib/supabase/server";
import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { SettingsForm } from "@/components/settings-form";
import { MembersList } from "@/components/members-list";
import { SeasonControls } from "@/components/season-controls";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function SettingsPage({ params }: PageProps) {
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

  if (!membership || membership.role !== "admin") redirect(`/league/${id}`);

  const { data: league } = await supabase
    .from("leagues")
    .select(`*, seasons ( id, season_number, status, starts_at, ends_at, pot_amount, winner_id )`)
    .eq("id", id)
    .single();

  if (!league) notFound();

  const { data: rawMembers } = await supabase
    .from("league_members")
    .select(`id, user_id, role, joined_at, profiles!league_members_user_id_fkey ( display_name )`)
    .eq("league_id", id)
    .order("joined_at");

  const members = ((rawMembers || []) as unknown as Array<{
    id: string; user_id: string; role: string; joined_at: string;
    profiles: { display_name: string } | Array<{ display_name: string }>;
  }>).map(m => ({
    ...m,
    profiles: Array.isArray(m.profiles) ? m.profiles[0] : m.profiles
  }));

  const seasons = (league.seasons || []) as Array<{ id: string; status: string; season_number: number; pot_amount: number; winner_id: string | null }>;
  const currentSeason = seasons.find((s) => s.status === "active");

  return (
    <main className="min-h-screen px-5 py-6 safe-t safe-b">
      <div className="max-w-md mx-auto">
        <header className="flex items-center justify-between mb-6">
          <Link href={`/league/${id}`} className="text-[var(--muted)] text-sm">← Back</Link>
          <h1 className="font-medium">Settings</h1>
          <div className="w-12" />
        </header>

        <section className="mb-8">
          <h2 className="text-xs text-[var(--muted)] uppercase tracking-wide mb-3">League</h2>
          <SettingsForm league={league} />
        </section>

        <section className="mb-8">
          <h2 className="text-xs text-[var(--muted)] uppercase tracking-wide mb-3">
            Invite code: <span className="mono normal-case">{league.invite_code}</span>
          </h2>
        </section>

        <section className="mb-8">
          <h2 className="text-xs text-[var(--muted)] uppercase tracking-wide mb-3">Members ({members.length})</h2>
          <MembersList members={members} leagueId={id} currentUserId={user.id} />
        </section>

        <section className="mb-8">
          <h2 className="text-xs text-[var(--muted)] uppercase tracking-wide mb-3">Season</h2>
          <SeasonControls
            leagueId={id}
            currentSeason={currentSeason || null}
            allSeasons={seasons}
            members={members}
            seasonLengthWeeks={league.season_length_weeks}
          />
        </section>
      </div>
    </main>
  );
}
