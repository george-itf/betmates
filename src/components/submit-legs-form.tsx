"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";

interface Submission {
  id: string;
  selection: string;
  event_name: string;
  odds_decimal: number;
  odds_fractional: string;
}

interface SubmitLegsFormProps {
  groupBetId: string;
  legsPerUser: number;
  userSubmissions: Submission[];
  userId: string;
}

export function SubmitLegsForm({
  groupBetId,
  legsPerUser,
  userSubmissions,
  userId,
}: SubmitLegsFormProps) {
  const hasSubmitted = userSubmissions.length > 0;
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [legs, setLegs] = useState<Array<{ selection: string; event: string; odds: string }>>(
    hasSubmitted
      ? userSubmissions.map((s) => ({
          selection: s.selection,
          event: s.event_name || "",
          odds: s.odds_fractional,
        }))
      : Array(legsPerUser).fill({ selection: "", event: "", odds: "" })
  );

  const router = useRouter();
  const supabase = createClient();

  const updateLeg = (index: number, field: string, value: string) => {
    const newLegs = [...legs];
    newLegs[index] = { ...newLegs[index], [field]: value };
    setLegs(newLegs);
  };

  const parseFractionalOdds = (fractional: string): number => {
    const parts = fractional.split("/");
    if (parts.length === 2) {
      return parseFloat(parts[0]) / parseFloat(parts[1]) + 1;
    }
    return parseFloat(fractional) || 2.0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const validLegs = legs.filter((l) => l.selection.trim() && l.odds.trim());
      
      if (validLegs.length !== legsPerUser) {
        throw new Error(`Please fill in all ${legsPerUser} legs`);
      }

      // Delete existing submissions if updating
      if (hasSubmitted) {
        await supabase
          .from("group_bet_submissions")
          .delete()
          .eq("group_bet_id", groupBetId)
          .eq("user_id", userId);
      }

      // Insert new submissions
      const submissions = validLegs.map((leg) => ({
        group_bet_id: groupBetId,
        user_id: userId,
        selection: leg.selection,
        event_name: leg.event,
        odds_decimal: parseFractionalOdds(leg.odds),
        odds_fractional: leg.odds,
      }));

      const { error: insertError } = await supabase
        .from("group_bet_submissions")
        .insert(submissions);

      if (insertError) throw insertError;

      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-medium">
          {hasSubmitted ? "your submissions" : "submit your legs"}
        </h3>
        <span className="text-sm text-[var(--muted)]">
          {legsPerUser} required
        </span>
      </div>

      {hasSubmitted && (
        <div className="card bg-[var(--success)]/10 border-[var(--success)]/30">
          <p className="text-sm text-[var(--success)]">
            ✓ you've submitted your legs — you can edit them until submissions close
          </p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-3">
        {legs.map((leg, i) => (
          <div key={i} className="card space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">leg {i + 1}</span>
            </div>
            <input
              type="text"
              value={leg.selection}
              onChange={(e) => updateLeg(i, "selection", e.target.value)}
              placeholder="e.g. Arsenal to win"
              disabled={loading}
            />
            <div className="grid grid-cols-2 gap-3">
              <input
                type="text"
                value={leg.event}
                onChange={(e) => updateLeg(i, "event", e.target.value)}
                placeholder="Event (optional)"
                disabled={loading}
              />
              <input
                type="text"
                value={leg.odds}
                onChange={(e) => updateLeg(i, "odds", e.target.value)}
                placeholder="Odds e.g. 6/4"
                disabled={loading}
              />
            </div>
          </div>
        ))}

        {error && (
          <div className="p-3 bg-[var(--danger)]/10 border border-[var(--danger)] rounded-lg">
            <p className="text-[var(--danger)] text-sm">{error}</p>
          </div>
        )}

        <button
          type="submit"
          className="btn btn-primary w-full"
          disabled={loading}
        >
          {loading ? "saving..." : hasSubmitted ? "update submissions" : "submit legs"}
        </button>
      </form>
    </div>
  );
}
