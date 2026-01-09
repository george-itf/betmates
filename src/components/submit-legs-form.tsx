"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";

interface Submission {
  selection: string;
  odds_fractional: string;
}

export function SubmitLegsForm({ groupBetId, legsPerUser, userSubmissions, userId }: {
  groupBetId: string;
  legsPerUser: number;
  userSubmissions: Submission[];
  userId: string;
}) {
  const hasSubmitted = userSubmissions.length > 0;
  const [loading, setLoading] = useState(false);
  const [legs, setLegs] = useState<Array<{ selection: string; odds: string }>>(
    hasSubmitted
      ? userSubmissions.map((s) => ({ selection: s.selection, odds: s.odds_fractional }))
      : Array(legsPerUser).fill({ selection: "", odds: "" })
  );

  const router = useRouter();
  const supabase = createClient();

  const update = (i: number, field: string, value: string) => {
    const next = [...legs];
    next[i] = { ...next[i], [field]: value };
    setLegs(next);
  };

  const parseFrac = (f: string) => {
    const [a, b] = f.split("/");
    return b ? parseFloat(a) / parseFloat(b) + 1 : parseFloat(f) || 2;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const valid = legs.filter((l) => l.selection && l.odds);
    if (valid.length !== legsPerUser) {
      setLoading(false);
      return;
    }

    if (hasSubmitted) {
      await supabase.from("group_bet_submissions").delete().eq("group_bet_id", groupBetId).eq("user_id", userId);
    }

    await supabase.from("group_bet_submissions").insert(
      valid.map((l) => ({
        group_bet_id: groupBetId,
        user_id: userId,
        selection: l.selection,
        odds_fractional: l.odds,
        odds_decimal: parseFrac(l.odds),
      }))
    );

    router.refresh();
    setLoading(false);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <p className="text-xs text-[var(--muted)]">
        {hasSubmitted ? "Your submissions (can edit until voting)" : `Submit ${legsPerUser} legs`}
      </p>

      {legs.map((leg, i) => (
        <div key={i} className="flex gap-2">
          <input
            value={leg.selection}
            onChange={(e) => update(i, "selection", e.target.value)}
            placeholder="Selection"
            className="flex-1"
          />
          <input
            value={leg.odds}
            onChange={(e) => update(i, "odds", e.target.value)}
            placeholder="Odds"
            className="w-20"
          />
        </div>
      ))}

      <button type="submit" disabled={loading} className="w-full py-2.5 bg-[var(--white)] text-[var(--bg)] rounded text-sm font-medium">
        {loading ? "..." : hasSubmitted ? "Update" : "Submit"}
      </button>
    </form>
  );
}
