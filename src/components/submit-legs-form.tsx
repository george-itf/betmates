"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { IconPlus, IconX } from "@/components/icons";
import { OddsBrowser } from "@/components/odds-browser";

interface Leg {
  selection: string;
  odds: string;
  oddsDecimal: number;
}

export function SubmitLegsForm({ groupBetId, legsRemaining }: { groupBetId: string; legsRemaining: number }) {
  const [legs, setLegs] = useState<Leg[]>([]);
  const [loading, setLoading] = useState(false);
  const [showBrowser, setShowBrowser] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  const handleBrowseSelect = (selection: {
    selection: string;
    odds: number;
    oddsFractional: string;
  }) => {
    if (legs.length >= legsRemaining) return;
    
    setLegs([...legs, {
      selection: selection.selection,
      odds: selection.oddsFractional,
      oddsDecimal: selection.odds,
    }]);
  };

  const removeLeg = (i: number) => setLegs(legs.filter((_, idx) => idx !== i));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (legs.length === 0) return;
    
    setLoading(true);

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { error } = await supabase.from("group_bet_submissions").insert(
      legs.map(l => ({
        group_bet_id: groupBetId,
        user_id: user.id,
        selection: l.selection,
        odds_fractional: l.odds,
        odds_decimal: l.oddsDecimal,
      }))
    );

    if (error) {
      console.error("Failed to submit legs:", error);
    }

    router.refresh();
    setLegs([]);
    setLoading(false);
  };

  return (
    <>
      <div className="space-y-3">
        {/* Added legs */}
        {legs.length > 0 && (
          <div className="space-y-2 mb-4">
            {legs.map((leg, i) => (
              <div key={i} className="flex items-center gap-2 p-3 bg-[var(--bg)] rounded">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{leg.selection}</p>
                </div>
                <span className="text-sm font-bold text-[var(--accent)]">{leg.odds}</span>
                <button onClick={() => removeLeg(i)} className="p-1 text-[var(--danger)]">
                  <IconX className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Browse button */}
        {legs.length < legsRemaining && (
          <button
            type="button"
            onClick={() => setShowBrowser(true)}
            className="w-full p-4 border-2 border-dashed border-[var(--border)] rounded text-center hover:border-[var(--accent)] hover:bg-green-50 transition"
          >
            <IconPlus className="w-5 h-5 mx-auto mb-1 text-[var(--accent)]" />
            <p className="text-sm font-medium text-[var(--accent)]">Browse Live Odds</p>
            <p className="text-xs text-[var(--text-secondary)]">
              {legs.length}/{legsRemaining} selections added
            </p>
          </button>
        )}

        {/* Submit */}
        {legs.length > 0 && (
          <button
            onClick={handleSubmit}
            disabled={loading}
            className="btn btn-primary w-full"
          >
            {loading ? "Submitting..." : `Submit ${legs.length} Selection${legs.length > 1 ? "s" : ""}`}
          </button>
        )}
      </div>

      {/* Odds browser modal */}
      <OddsBrowser
        isOpen={showBrowser}
        onClose={() => setShowBrowser(false)}
        onSelect={handleBrowseSelect}
      />
    </>
  );
}
