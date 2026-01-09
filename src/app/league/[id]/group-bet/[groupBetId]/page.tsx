import { createClient } from "@/lib/supabase/server";
import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { SubmitLegsForm } from "@/components/submit-legs-form";
import { VotingPanel } from "@/components/voting-panel";
import { GroupBetResult } from "@/components/group-bet-result";

interface PageProps {
  params: Promise<{ id: string; groupBetId: string }>;
}

export default async function GroupBetDetailPage({ params }: PageProps) {
  const { id, groupBetId } = await params;
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

  const { data: groupBet } = await supabase
    .from("group_bets")
    .select("*")
    .eq("id", groupBetId)
    .single();

  if (!groupBet) notFound();

  const { data: submissions } = await supabase
    .from("group_bet_submissions")
    .select(`*, profiles!group_bet_submissions_user_id_fkey ( display_name )`)
    .eq("group_bet_id", groupBetId)
    .order("votes_count", { ascending: false });

  const allSubs = ((submissions || []) as unknown as Array<{
    id: string; user_id: string; selection: string; event_name: string;
    odds_fractional: string; odds_decimal: number; votes_count: number; is_winner: boolean;
    profiles: { display_name: string } | Array<{ display_name: string }>;
  }>).map(s => ({
    ...s,
    profiles: Array.isArray(s.profiles) ? s.profiles[0] : s.profiles
  }));

  const userSubs = allSubs.filter((s) => s.user_id === user.id);

  const { data: userVotes } = await supabase
    .from("group_bet_votes")
    .select("submission_id")
    .eq("group_bet_id", groupBetId)
    .eq("user_id", user.id);

  const votedIds = new Set(userVotes?.map((v) => v.submission_id) || []);
  const participants = new Set(allSubs.map((s) => s.user_id)).size;

  return (
    <main className="min-h-screen px-5 py-6 safe-t safe-b">
      <div className="max-w-md mx-auto">
        <header className="flex items-center justify-between mb-6">
          <Link href={`/league/${id}/group-bet`} className="text-[var(--muted)] text-sm">← Back</Link>
          <h1 className="font-medium">{groupBet.title}</h1>
          <div className="w-12" />
        </header>

        {/* Stats */}
        <div className="flex justify-between text-sm py-3 border-y border-[var(--border)] mb-6">
          <span>£{groupBet.buyin_per_user} buy-in</span>
          <span>{participants} joined</span>
          <span>£{(participants * groupBet.buyin_per_user).toFixed(0)} pot</span>
        </div>

        {/* Status-based content */}
        {groupBet.status === "submissions_open" && (
          <SubmitLegsForm
            groupBetId={groupBetId}
            legsPerUser={groupBet.legs_per_user}
            userSubmissions={userSubs}
            userId={user.id}
          />
        )}

        {groupBet.status === "voting_open" && (
          <VotingPanel
            groupBetId={groupBetId}
            submissions={allSubs}
            votedIds={votedIds}
            userId={user.id}
            winningCount={groupBet.winning_legs_count}
          />
        )}

        {(groupBet.status === "betting" || groupBet.status === "settled") && (
          <GroupBetResult
            groupBet={groupBet}
            winningLegs={allSubs.filter((s) => s.is_winner)}
            isAdmin={membership.role === "admin"}
          />
        )}

        {/* Admin controls */}
        {membership.role === "admin" && groupBet.status !== "settled" && (
          <AdminControls groupBetId={groupBetId} status={groupBet.status} subsCount={allSubs.length} winningCount={groupBet.winning_legs_count} />
        )}
      </div>
    </main>
  );
}

import { AdminControls } from "@/components/admin-controls";
