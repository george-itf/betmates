"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";

export function AdminControls({ groupBetId, status, subsCount, winningCount }: {
  groupBetId: string;
  status: string;
  subsCount: number;
  winningCount: number;
}) {
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  const transition = async (to: string) => {
    setLoading(true);
    if (to === "voting_open") {
      await supabase.rpc("transition_to_voting", { p_group_bet_id: groupBetId });
    } else if (to === "betting") {
      await supabase.rpc("finalize_group_bet", { p_group_bet_id: groupBetId });
    }
    router.refresh();
    setLoading(false);
  };

  return (
    <div className="mt-6 pt-6 border-t border-[var(--border)]">
      <p className="text-xs text-[var(--muted)] mb-2">Admin</p>
      {status === "submissions_open" && (
        <button onClick={() => transition("voting_open")} disabled={loading || subsCount === 0} className="w-full py-2 border border-[var(--border)] rounded text-sm">
          {loading ? "..." : "Start voting"}
        </button>
      )}
      {status === "voting_open" && (
        <button onClick={() => transition("betting")} disabled={loading || subsCount < winningCount} className="w-full py-2 border border-[var(--border)] rounded text-sm">
          {loading ? "..." : "Finalize acca"}
        </button>
      )}
    </div>
  );
}
