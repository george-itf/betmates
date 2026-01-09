"use client";

import { useState, useRef, use } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";

interface ParsedBet {
  bet_type: string;
  stake: number;
  potential_return: number;
  status: string;
  placed_at: string;
  legs: Array<{
    selection: string;
    event_name: string;
    odds_decimal: number;
    odds_fractional: string;
    result: string;
  }>;
}

interface PageProps {
  params: Promise<{ id: string }>;
}

export default function NewBetPage({ params }: PageProps) {
  const { id: leagueId } = use(params);
  const searchParams = useSearchParams();
  const seasonId = searchParams.get("season");

  const [step, setStep] = useState<"upload" | "confirm" | "manual">("upload");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [parsedBet, setParsedBet] = useState<ParsedBet | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();
  const supabase = createClient();

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setLoading(true);
    setError("");

    try {
      // Upload to Supabase Storage
      const filename = `${Date.now()}-${file.name}`;
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from("screenshots")
        .upload(filename, file);

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: urlData } = supabase.storage
        .from("screenshots")
        .getPublicUrl(filename);

      setImageUrl(urlData.publicUrl);

      // Parse with Claude
      const formData = new FormData();
      formData.append("image", file);

      const parseResponse = await fetch("/api/parse-screenshot", {
        method: "POST",
        body: formData,
      });

      if (!parseResponse.ok) {
        const errorData = await parseResponse.json();
        throw new Error(errorData.error || "Failed to parse screenshot");
      }

      const parsed = await parseResponse.json();
      setParsedBet(parsed);
      setStep("confirm");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to process image");
    } finally {
      setLoading(false);
    }
  };

  const handleConfirm = async () => {
    if (!parsedBet || !seasonId) return;

    setLoading(true);
    setError("");

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not logged in");

      // Create bet
      const { data: bet, error: betError } = await supabase
        .from("bets")
        .insert({
          user_id: user.id,
          season_id: seasonId,
          bet_type: parsedBet.bet_type,
          stake: parsedBet.stake,
          potential_return: parsedBet.potential_return,
          status: parsedBet.status,
          screenshot_url: imageUrl,
          placed_at: parsedBet.placed_at || new Date().toISOString(),
        })
        .select()
        .single();

      if (betError) throw betError;

      // Create legs
      if (parsedBet.legs.length > 0) {
        const legs = parsedBet.legs.map((leg) => ({
          bet_id: bet.id,
          selection: leg.selection,
          event_name: leg.event_name,
          odds_decimal: leg.odds_decimal,
          odds_fractional: leg.odds_fractional,
          result: leg.result,
        }));

        const { error: legsError } = await supabase
          .from("bet_legs")
          .insert(legs);

        if (legsError) throw legsError;
      }

      router.push(`/league/${leagueId}`);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save bet");
    } finally {
      setLoading(false);
    }
  };

  const updateParsedBet = (field: string, value: unknown) => {
    if (!parsedBet) return;
    setParsedBet({ ...parsedBet, [field]: value });
  };

  const updateLeg = (index: number, field: string, value: unknown) => {
    if (!parsedBet) return;
    const newLegs = [...parsedBet.legs];
    newLegs[index] = { ...newLegs[index], [field]: value };
    setParsedBet({ ...parsedBet, legs: newLegs });
  };

  return (
    <main className="min-h-screen p-4 safe-top safe-bottom">
      <div className="max-w-lg mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <Link href={`/league/${leagueId}`} className="text-[var(--muted)]">
            ← cancel
          </Link>
          <h1 className="font-bold">add bet</h1>
          <div className="w-16" />
        </div>

        {/* Upload Step */}
        {step === "upload" && (
          <div className="space-y-6">
            <div
              onClick={() => fileInputRef.current?.click()}
              className="card border-dashed border-2 border-[var(--border)] flex flex-col items-center justify-center py-16 cursor-pointer hover:border-[var(--accent)] transition-colors"
            >
              {loading ? (
                <>
                  <div className="text-4xl mb-3 animate-pulse">📸</div>
                  <p className="font-medium">processing...</p>
                  <p className="text-sm text-[var(--muted)]">reading your bet slip</p>
                </>
              ) : (
                <>
                  <div className="text-4xl mb-3">📸</div>
                  <p className="font-medium">upload screenshot</p>
                  <p className="text-sm text-[var(--muted)]">tap to select from camera roll</p>
                </>
              )}
            </div>

            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              capture="environment"
              onChange={handleFileSelect}
              className="hidden"
            />

            {error && (
              <div className="p-3 bg-[var(--danger)]/10 border border-[var(--danger)] rounded-lg">
                <p className="text-[var(--danger)] text-sm">{error}</p>
              </div>
            )}

            <div className="text-center">
              <button
                onClick={() => setStep("manual")}
                className="text-[var(--accent)] text-sm"
              >
                or enter manually
              </button>
            </div>
          </div>
        )}

        {/* Confirm Step */}
        {step === "confirm" && parsedBet && (
          <div className="space-y-6">
            {/* Preview image */}
            {imageUrl && (
              <div className="rounded-lg overflow-hidden">
                <img src={imageUrl} alt="Bet slip" className="w-full" />
              </div>
            )}

            {/* Parsed data */}
            <div className="card space-y-4">
              <h2 className="font-medium">confirm details</h2>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-[var(--muted)] mb-1">stake</label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--muted)]">£</span>
                    <input
                      type="number"
                      value={parsedBet.stake}
                      onChange={(e) => updateParsedBet("stake", parseFloat(e.target.value))}
                      className="pl-7"
                      step="0.01"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm text-[var(--muted)] mb-1">returns</label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--muted)]">£</span>
                    <input
                      type="number"
                      value={parsedBet.potential_return}
                      onChange={(e) => updateParsedBet("potential_return", parseFloat(e.target.value))}
                      className="pl-7"
                      step="0.01"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm text-[var(--muted)] mb-1">status</label>
                <select
                  value={parsedBet.status}
                  onChange={(e) => updateParsedBet("status", e.target.value)}
                >
                  <option value="pending">pending</option>
                  <option value="won">won</option>
                  <option value="lost">lost</option>
                  <option value="void">void</option>
                </select>
              </div>
            </div>

            {/* Legs */}
            <div className="space-y-3">
              <h2 className="text-sm font-medium text-[var(--muted)]">
                {parsedBet.legs.length} selection{parsedBet.legs.length !== 1 ? "s" : ""}
              </h2>
              {parsedBet.legs.map((leg, i) => (
                <div key={i} className="card space-y-3">
                  <input
                    type="text"
                    value={leg.selection}
                    onChange={(e) => updateLeg(i, "selection", e.target.value)}
                    placeholder="Selection"
                  />
                  <div className="grid grid-cols-2 gap-3">
                    <input
                      type="text"
                      value={leg.odds_fractional}
                      onChange={(e) => updateLeg(i, "odds_fractional", e.target.value)}
                      placeholder="Odds (e.g. 6/4)"
                    />
                    <select
                      value={leg.result}
                      onChange={(e) => updateLeg(i, "result", e.target.value)}
                    >
                      <option value="pending">pending</option>
                      <option value="won">won</option>
                      <option value="lost">lost</option>
                      <option value="void">void</option>
                    </select>
                  </div>
                </div>
              ))}
            </div>

            {error && (
              <div className="p-3 bg-[var(--danger)]/10 border border-[var(--danger)] rounded-lg">
                <p className="text-[var(--danger)] text-sm">{error}</p>
              </div>
            )}

            <div className="flex gap-3">
              <button
                onClick={() => setStep("upload")}
                className="btn flex-1"
                disabled={loading}
              >
                back
              </button>
              <button
                onClick={handleConfirm}
                className="btn btn-primary flex-1"
                disabled={loading}
              >
                {loading ? "saving..." : "save bet"}
              </button>
            </div>
          </div>
        )}

        {/* Manual Entry Step */}
        {step === "manual" && (
          <ManualBetForm
            leagueId={leagueId}
            seasonId={seasonId || ""}
            onBack={() => setStep("upload")}
          />
        )}
      </div>
    </main>
  );
}

function ManualBetForm({
  leagueId,
  seasonId,
  onBack,
}: {
  leagueId: string;
  seasonId: string;
  onBack: () => void;
}) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [stake, setStake] = useState("");
  const [potentialReturn, setPotentialReturn] = useState("");
  const [status, setStatus] = useState("pending");
  const [legs, setLegs] = useState([
    { selection: "", odds_fractional: "", result: "pending" },
  ]);

  const router = useRouter();
  const supabase = createClient();

  const addLeg = () => {
    setLegs([...legs, { selection: "", odds_fractional: "", result: "pending" }]);
  };

  const removeLeg = (index: number) => {
    if (legs.length > 1) {
      setLegs(legs.filter((_, i) => i !== index));
    }
  };

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

  const getBetType = (legCount: number): string => {
    if (legCount === 1) return "single";
    if (legCount === 2) return "double";
    if (legCount === 3) return "treble";
    return "acca";
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not logged in");

      const validLegs = legs.filter((l) => l.selection.trim());
      if (validLegs.length === 0) throw new Error("Add at least one selection");

      // Create bet
      const { data: bet, error: betError } = await supabase
        .from("bets")
        .insert({
          user_id: user.id,
          season_id: seasonId,
          bet_type: getBetType(validLegs.length),
          stake: parseFloat(stake),
          potential_return: parseFloat(potentialReturn),
          status,
          placed_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (betError) throw betError;

      // Create legs
      const legData = validLegs.map((leg) => ({
        bet_id: bet.id,
        selection: leg.selection,
        event_name: "",
        odds_decimal: parseFractionalOdds(leg.odds_fractional),
        odds_fractional: leg.odds_fractional,
        result: leg.result,
      }));

      const { error: legsError } = await supabase.from("bet_legs").insert(legData);
      if (legsError) throw legsError;

      router.push(`/league/${leagueId}`);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save bet");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="card space-y-4">
        <h2 className="font-medium">bet details</h2>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm text-[var(--muted)] mb-1">stake</label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--muted)]">£</span>
              <input
                type="number"
                value={stake}
                onChange={(e) => setStake(e.target.value)}
                className="pl-7"
                step="0.01"
                required
              />
            </div>
          </div>
          <div>
            <label className="block text-sm text-[var(--muted)] mb-1">returns</label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--muted)]">£</span>
              <input
                type="number"
                value={potentialReturn}
                onChange={(e) => setPotentialReturn(e.target.value)}
                className="pl-7"
                step="0.01"
                required
              />
            </div>
          </div>
        </div>

        <div>
          <label className="block text-sm text-[var(--muted)] mb-1">status</label>
          <select value={status} onChange={(e) => setStatus(e.target.value)}>
            <option value="pending">pending</option>
            <option value="won">won</option>
            <option value="lost">lost</option>
          </select>
        </div>
      </div>

      {/* Legs */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-medium text-[var(--muted)]">selections</h2>
          <button type="button" onClick={addLeg} className="text-[var(--accent)] text-sm">
            + add leg
          </button>
        </div>

        {legs.map((leg, i) => (
          <div key={i} className="card space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-[var(--muted)]">leg {i + 1}</span>
              {legs.length > 1 && (
                <button
                  type="button"
                  onClick={() => removeLeg(i)}
                  className="text-[var(--danger)] text-sm"
                >
                  remove
                </button>
              )}
            </div>
            <input
              type="text"
              value={leg.selection}
              onChange={(e) => updateLeg(i, "selection", e.target.value)}
              placeholder="e.g. Arsenal to win"
            />
            <div className="grid grid-cols-2 gap-3">
              <input
                type="text"
                value={leg.odds_fractional}
                onChange={(e) => updateLeg(i, "odds_fractional", e.target.value)}
                placeholder="e.g. 6/4"
              />
              <select
                value={leg.result}
                onChange={(e) => updateLeg(i, "result", e.target.value)}
              >
                <option value="pending">pending</option>
                <option value="won">won</option>
                <option value="lost">lost</option>
                <option value="void">void</option>
              </select>
            </div>
          </div>
        ))}
      </div>

      {error && (
        <div className="p-3 bg-[var(--danger)]/10 border border-[var(--danger)] rounded-lg">
          <p className="text-[var(--danger)] text-sm">{error}</p>
        </div>
      )}

      <div className="flex gap-3">
        <button type="button" onClick={onBack} className="btn flex-1" disabled={loading}>
          back
        </button>
        <button type="submit" className="btn btn-primary flex-1" disabled={loading}>
          {loading ? "saving..." : "save bet"}
        </button>
      </div>
    </form>
  );
}
