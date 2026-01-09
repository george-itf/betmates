"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";

interface Leg {
  selection: string;
  odds: string;
}

export default function NewBetPage({ params }: { params: Promise<{ id: string }> }) {
  const [leagueId, setLeagueId] = useState<string | null>(null);
  params.then((p) => setLeagueId(p.id));

  const searchParams = useSearchParams();
  const seasonId = searchParams.get("season");

  const [mode, setMode] = useState<"upload" | "manual">("upload");
  const [uploading, setUploading] = useState(false);
  const [parsing, setParsing] = useState(false);
  const [saving, setSaving] = useState(false);

  const [stake, setStake] = useState("");
  const [potentialReturn, setPotentialReturn] = useState("");
  const [status, setStatus] = useState("pending");
  const [legs, setLegs] = useState<Leg[]>([{ selection: "", odds: "" }]);

  const router = useRouter();
  const supabase = createClient();

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const path = `${user.id}/${Date.now()}-${file.name}`;
    await supabase.storage.from("screenshots").upload(path, file);

    setUploading(false);
    setParsing(true);

    const formData = new FormData();
    formData.append("image", file);

    try {
      const res = await fetch("/api/parse-screenshot", { method: "POST", body: formData });
      const data = await res.json();

      if (data.stake) setStake(data.stake.toString());
      if (data.potential_return) setPotentialReturn(data.potential_return.toString());
      if (data.status) setStatus(data.status);
      if (data.legs?.length) {
        setLegs(data.legs.map((l: { selection: string; odds_fractional: string }) => ({
          selection: l.selection,
          odds: l.odds_fractional,
        })));
      }
      setMode("manual");
    } catch {
      setMode("manual");
    }
    setParsing(false);
  };

  const addLeg = () => setLegs([...legs, { selection: "", odds: "" }]);
  const removeLeg = (i: number) => setLegs(legs.filter((_, idx) => idx !== i));
  const updateLeg = (i: number, field: keyof Leg, value: string) => {
    const updated = [...legs];
    updated[i][field] = value;
    setLegs(updated);
  };

  const parseFrac = (f: string) => {
    const [a, b] = f.split("/");
    return b ? parseFloat(a) / parseFloat(b) + 1 : parseFloat(f) || 2;
  };

  const handleSave = async () => {
    setSaving(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user || !seasonId) return;

    const validLegs = legs.filter((l) => l.selection && l.odds);
    const betTypes = ["single", "double", "treble", "acca"];
    const betType = betTypes[Math.min(validLegs.length - 1, 3)];

    const { data: bet } = await supabase
      .from("bets")
      .insert({
        user_id: user.id,
        season_id: seasonId,
        bet_type: betType,
        stake: parseFloat(stake),
        potential_return: parseFloat(potentialReturn),
        status,
        actual_return: status === "won" ? parseFloat(potentialReturn) : status === "lost" ? 0 : null,
      })
      .select()
      .single();

    if (bet) {
      await supabase.from("bet_legs").insert(
        validLegs.map((l) => ({
          bet_id: bet.id,
          selection: l.selection,
          odds_fractional: l.odds,
          odds_decimal: parseFrac(l.odds),
          result: status === "won" ? "won" : status === "lost" ? "lost" : "pending",
        }))
      );
    }

    router.push(`/league/${leagueId}`);
    router.refresh();
  };

  if (!leagueId) return null;

  return (
    <main className="min-h-screen px-5 py-6 safe-t safe-b">
      <div className="max-w-md mx-auto">
        <header className="flex items-center justify-between mb-6">
          <Link href={`/league/${leagueId}`} className="text-[var(--muted)] text-sm">Cancel</Link>
          <h1 className="font-medium">Add bet</h1>
          <div className="w-12" />
        </header>

        {mode === "upload" && (
          <div className="space-y-4">
            <label className="block border border-dashed border-[var(--border)] rounded-lg p-8 text-center cursor-pointer">
              <input type="file" accept="image/*" onChange={handleFile} className="hidden" />
              <p className="text-sm text-[var(--muted)]">
                {uploading ? "Uploading..." : parsing ? "Reading..." : "Tap to upload screenshot"}
              </p>
            </label>
            <button onClick={() => setMode("manual")} className="w-full py-2 text-sm text-[var(--muted)]">
              Enter manually
            </button>
          </div>
        )}

        {mode === "manual" && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-[var(--muted)] block mb-1">Stake</label>
                <input type="number" value={stake} onChange={(e) => setStake(e.target.value)} placeholder="0.00" />
              </div>
              <div>
                <label className="text-xs text-[var(--muted)] block mb-1">Returns</label>
                <input type="number" value={potentialReturn} onChange={(e) => setPotentialReturn(e.target.value)} placeholder="0.00" />
              </div>
            </div>

            <div>
              <label className="text-xs text-[var(--muted)] block mb-1">Status</label>
              <select value={status} onChange={(e) => setStatus(e.target.value)}>
                <option value="pending">Pending</option>
                <option value="won">Won</option>
                <option value="lost">Lost</option>
              </select>
            </div>

            <div>
              <label className="text-xs text-[var(--muted)] block mb-2">Selections</label>
              {legs.map((leg, i) => (
                <div key={i} className="flex gap-2 mb-2">
                  <input
                    value={leg.selection}
                    onChange={(e) => updateLeg(i, "selection", e.target.value)}
                    placeholder="Selection"
                    className="flex-1"
                  />
                  <input
                    value={leg.odds}
                    onChange={(e) => updateLeg(i, "odds", e.target.value)}
                    placeholder="Odds"
                    className="w-20"
                  />
                  {legs.length > 1 && (
                    <button onClick={() => removeLeg(i)} className="px-2 text-[var(--muted)]">×</button>
                  )}
                </div>
              ))}
              <button onClick={addLeg} className="text-sm text-[var(--muted)]">+ Add leg</button>
            </div>

            <button
              onClick={handleSave}
              disabled={saving || !stake || !potentialReturn || !legs.some((l) => l.selection)}
              className="w-full py-2.5 bg-[var(--white)] text-[var(--bg)] rounded text-sm font-medium mt-4"
            >
              {saving ? "Saving..." : "Save"}
            </button>
          </div>
        )}
      </div>
    </main>
  );
}
