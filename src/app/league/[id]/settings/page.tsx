import { createClient } from "@/lib/supabase/server";
import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { LeagueSettingsForm } from "@/components/league-settings-form";
import { MembersList } from "@/components/members-list";
import { SeasonControls } from "@/components/season-controls";
import { DangerZone } from "@/components/danger-zone";
import { CopyButton } from "@/components/copy-button";
import { RegenerateCodeButton } from "@/components/regenerate-code-button";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function SettingsPage({ params }: PageProps) {
  const { id: leagueId } = await params;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // Check admin membership
  const { data: membership } = await supabase
    .from("league_members")
    .select("role")
    .eq("league_id", leagueId)
    .eq("user_id", user.id)
    .single();

  if (!membership || membership.role !== "admin") {
    redirect(`/league/${leagueId}`);
  }

  // Get league details
  const { data: league, error } = await supabase
    .from("leagues")
    .select(`
      *,
      seasons (
        id,
        season_number,
        status,
        starts_at,
        ends_at,
        pot_amount,
        winner_id
      )
    `)
    .eq("id", leagueId)
    .single();

  if (error || !league) {
    notFound();
  }

  // Get all members with profiles
  const { data: rawMembers } = await supabase
    .from("league_members")
    .select(`
      id,
      user_id,
      role,
      joined_at,
      profiles!league_members_user_id_fkey (
        display_name,
        avatar_url
      )
    `)
    .eq("league_id", leagueId)
    .order("joined_at", { ascending: true });

  // Transform members to flatten profiles
  const members = ((rawMembers || []) as unknown as Array<{
    id: string;
    user_id: string;
    role: string;
    joined_at: string;
    profiles: { display_name: string; avatar_url: string | null } | Array<{ display_name: string; avatar_url: string | null }>;
  }>).map(m => ({
    ...m,
    profiles: Array.isArray(m.profiles) ? m.profiles[0] : m.profiles
  }));

  const seasons = (league.seasons || []) as Array<{ id: string; status: string; season_number: number; starts_at: string; ends_at: string; pot_amount: number; winner_id: string | null }>;
  const currentSeason = seasons.find((s) => s.status === "active");
  const allSeasons = [...seasons].sort((a, b) => b.season_number - a.season_number);

  return (
    <main className="min-h-screen p-4 safe-top safe-bottom">
      <div className="max-w-lg mx-auto space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <Link href={`/league/${leagueId}`} className="text-[var(--muted)]">
            ← back
          </Link>
          <h1 className="font-bold">league settings</h1>
          <div className="w-12" />
        </div>

        {/* League Settings */}
        <section className="space-y-4">
          <h2 className="text-sm font-medium text-[var(--muted)]">league settings</h2>
          <LeagueSettingsForm league={league} />
        </section>

        {/* Invite Code */}
        <section className="space-y-4">
          <h2 className="text-sm font-medium text-[var(--muted)]">invite code</h2>
          <div className="card space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-[var(--muted)]">share this code</p>
                <p className="font-mono text-2xl tracking-widest">{league.invite_code}</p>
              </div>
              <CopyButton text={league.invite_code} />
            </div>
            <RegenerateCodeButton leagueId={leagueId} />
          </div>
        </section>

        {/* Members */}
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-medium text-[var(--muted)]">
              members ({members.length})
            </h2>
          </div>
          <MembersList
            members={members}
            leagueId={leagueId}
            currentUserId={user.id}
          />
        </section>

        {/* Season Controls */}
        <section className="space-y-4">
          <h2 className="text-sm font-medium text-[var(--muted)]">season</h2>
          <SeasonControls
            leagueId={leagueId}
            currentSeason={currentSeason || null}
            allSeasons={allSeasons}
            members={members}
            seasonLengthWeeks={league.season_length_weeks}
          />
        </section>

        {/* Danger Zone */}
        <section className="space-y-4">
          <h2 className="text-sm font-medium text-[var(--danger)]">danger zone</h2>
          <DangerZone leagueId={leagueId} leagueName={league.name} />
        </section>
      </div>
    </main>
  );
}
