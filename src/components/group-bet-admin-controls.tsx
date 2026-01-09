"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";

interface GroupBetAdminControlsProps {
  groupBetId: string;
  status: string;
  submissionsCount: number;
  winningLegsCount: number;
}

export function GroupBetAdminControls({
  groupBetId,
  status,
  submissionsCount,
  winningLegsCount,
}: GroupBetAdminControlsProps) {
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  const handleTransition = async (newStatus: string) => {
    setLoading(true);
    try {
      if (newStatus === "voting_open") {
        // Simple status update
        await supabase.rpc("transition_to_voting", { p_group_bet_id: groupBetId });
      } else if (newStatus === "betting") {
        // Finalize and select winners
        await supabase.rpc("finalize_group_bet", { p_group_bet_id: groupBetId });
      }
      router.refresh();
    } catch (err) {
      console.error("Transition error:", err);
    } finally {
      setLoading(false);
    }
  };

  if (status === "settled") return null;

  return (
    <div className="card bg-[var(--warning)]/10 border-[var(--warning)]/30 space-y-3">
      <p className="text-sm font-medium text-[var(--warning)]">admin controls</p>
      
      {status === "submissions_open" && (
        <div className="space-y-2">
          <p className="text-sm text-[var(--muted)]">
            {submissionsCount} legs submitted. Move to voting when ready.
          </p>
          <button
            onClick={() => handleTransition("voting_open")}
            className="btn btn-primary w-full"
            disabled={loading || submissionsCount === 0}
          >
            {loading ? "..." : "start voting"}
          </button>
        </div>
      )}

      {status === "voting_open" && (
        <div className="space-y-2">
          <p className="text-sm text-[var(--muted)]">
            Finalize will pick top {winningLegsCount} voted legs and create the acca.
          </p>
          <button
            onClick={() => handleTransition("betting")}
            className="btn btn-primary w-full"
            disabled={loading || submissionsCount < winningLegsCount}
          >
            {loading ? "..." : "finalize & place bet"}
          </button>
        </div>
      )}

      {status === "betting" && (
        <p className="text-sm text-[var(--muted)]">
          Use the settle buttons below when results are in.
        </p>
      )}
    </div>
  );
}
