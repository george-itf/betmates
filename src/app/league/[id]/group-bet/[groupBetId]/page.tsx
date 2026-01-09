import { createClient } from "@/lib/supabase/server";
import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { SubmitLegsForm } from "@/components/submit-legs-form";
import { VotingPanel } from "@/components/voting-panel";
import { GroupBetResult } from "@/components/group-bet-result";
import { GroupBetAdminControls } from "@/components/group-bet-admin-controls";

interface PageProps {
  params: Promise<{ id: string; groupBetId: string }>;
}

export default async function GroupBetDetailPage({ params }: PageProps) {
  const { id: leagueId, groupBetId } = await params;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // Check membership
  const { data: membership } = await supabase
    .from("league_members")
    .select("role")
    .eq("league_id", leagueId)
    .eq("user_id", user.id)
    .single();

  if (!membership) {
    redirect("/dashboard");
  }

  // Get group bet details
  const { data: groupBet, error } = await supabase
    .from("group_bets")
    .select("*")
    .eq("id", groupBetId)
    .single();

  if (error || !groupBet) {
    notFound();
  }

  // Get all submissions with user info
  const { data: submissions } = await supabase
    .from("group_bet_submissions")
    .select(`
      *,
      profiles!group_bet_submissions_user_id_fkey (
        display_name,
        avatar_url
      )
    `)
    .eq("group_bet_id", groupBetId)
    .order("votes_count", { ascending: false });

  // Get user's submissions
  const userSubmissions = submissions?.filter((s) => s.user_id === user.id) || [];

  // Get user's votes
  const { data: userVotes } = await supabase
    .from("group_bet_votes")
    .select("submission_id")
    .eq("group_bet_id", groupBetId)
    .eq("user_id", user.id);

  const votedSubmissionIds = new Set(userVotes?.map((v) => v.submission_id) || []);

  // Get participants count
  const { data: participants } = await supabase
    .from("group_bet_submissions")
    .select("user_id")
    .eq("group_bet_id", groupBetId);
  
  const uniqueParticipants = new Set(participants?.map((p) => p.user_id) || []);
  const participantCount = uniqueParticipants.size;

  // Calculate time remaining
  const getTimeRemaining = (deadline: string) => {
    const end = new Date(deadline);
    const now = new Date();
    const diffMs = end.getTime() - now.getTime();
    
    if (diffMs <= 0) return "ended";
    
    const hours = Math.floor(diffMs / (1000 * 60 * 60));
    const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
    
    if (hours > 24) {
      const days = Math.floor(hours / 24);
      return `${days}d ${hours % 24}h left`;
    }
    if (hours > 0) return `${hours}h ${minutes}m left`;
    return `${minutes}m left`;
  };

  const getStatusInfo = () => {
    switch (groupBet.status) {
      case "submissions_open":
        return {
          title: "submit your legs",
          subtitle: getTimeRemaining(groupBet.submission_deadline),
          color: "var(--accent)",
        };
      case "voting_open":
        return {
          title: "vote for the best",
          subtitle: getTimeRemaining(groupBet.voting_deadline),
          color: "var(--warning)",
        };
      case "betting":
        return {
          title: "bet placed",
          subtitle: "waiting for results",
          color: "var(--muted)",
        };
      case "settled":
        return {
          title: groupBet.result === "won" ? "winner! 🎉" : "lost",
          subtitle: groupBet.result === "won" 
            ? `+£${groupBet.payout_per_user?.toFixed(2)} each` 
            : "better luck next time",
          color: groupBet.result === "won" ? "var(--success)" : "var(--danger)",
        };
      default:
        return { title: groupBet.status, subtitle: "", color: "var(--muted)" };
    }
  };

  const statusInfo = getStatusInfo();
  const winningLegs = submissions?.filter((s) => s.is_winner) || [];
  const isAdmin = membership.role === "admin";

  return (
    <main className="min-h-screen p-4 safe-top safe-bottom">
      <div className="max-w-lg mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <Link href={`/league/${leagueId}/group-bet`} className="text-[var(--muted)]">
            ← back
          </Link>
          <h1 className="font-bold">{groupBet.title}</h1>
          <div className="w-12" />
        </div>

        {/* Status Banner */}
        <div
          className="card text-center py-6"
          style={{
            backgroundColor: `color-mix(in srgb, ${statusInfo.color} 10%, var(--card))`,
            borderColor: `color-mix(in srgb, ${statusInfo.color} 30%, transparent)`,
          }}
        >
          <h2 className="text-xl font-bold" style={{ color: statusInfo.color }}>
            {statusInfo.title}
          </h2>
          <p className="text-sm text-[var(--muted)]">{statusInfo.subtitle}</p>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-3 gap-3 text-center">
          <div className="card py-3">
            <p className="text-lg font-bold">£{groupBet.buyin_per_user}</p>
            <p className="text-xs text-[var(--muted)]">buy-in</p>
          </div>
          <div className="card py-3">
            <p className="text-lg font-bold">{participantCount}</p>
            <p className="text-xs text-[var(--muted)]">participants</p>
          </div>
          <div className="card py-3">
            <p className="text-lg font-bold">
              £{(participantCount * groupBet.buyin_per_user).toFixed(0)}
            </p>
            <p className="text-xs text-[var(--muted)]">total pot</p>
          </div>
        </div>

        {/* Admin Controls */}
        {isAdmin && groupBet.status !== "settled" && (
          <GroupBetAdminControls
            groupBetId={groupBetId}
            status={groupBet.status}
            submissionsCount={submissions?.length || 0}
            winningLegsCount={groupBet.winning_legs_count}
          />
        )}

        {/* Content based on status */}
        {groupBet.status === "submissions_open" && (
          <SubmitLegsForm
            groupBetId={groupBetId}
            legsPerUser={groupBet.legs_per_user}
            userSubmissions={userSubmissions}
            userId={user.id}
          />
        )}

        {groupBet.status === "voting_open" && (
          <VotingPanel
            groupBetId={groupBetId}
            submissions={submissions || []}
            votedSubmissionIds={votedSubmissionIds}
            userId={user.id}
            winningLegsCount={groupBet.winning_legs_count}
          />
        )}

        {(groupBet.status === "betting" || groupBet.status === "settled") && (
          <GroupBetResult
            groupBet={groupBet}
            winningLegs={winningLegs}
            isAdmin={isAdmin}
          />
        )}
      </div>
    </main>
  );
}
