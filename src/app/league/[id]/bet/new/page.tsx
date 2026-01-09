"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { IconCamera, IconEdit, IconX, IconPlus } from "@/components/icons";

interface Leg {
  selection: string;
  odds: string;
}

export default function NewBetPage({ params }: { params: Promise<{ id: string }> }) {
  const [leagueId, setLeagueId] = useState<string | null>(null);
  
  useEffect(() => {
    params.then((p) => setLeagueId(p.id));
  }, [params]);

  const searchParams = useSearchParams();
  const seasonId = searchParams.get("season");

  const [mode, setMode] = useState<"choose" | "upload" | "manual">("choose");
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
    <main className="min-h-screen bg-[var(--bg)] safe-t safe-b">
      {/* Header */}
      <div className="header flex items-center justify-between">
        <Link href={`/league/${leagueId}`} className="text-[var(--accent)] font-medium text-sm">Cancel</Link>
        <h1 className="font-bold text-sm uppercase tracking-wide">Add Bet</h1>
        <div className="w-16" />
      </div>

      <div className="p-4 max-w-lg mx-auto">
        {mode === "choose" && (
          <div className="space-y-4">
            <p className="text-[var(--text-secondary)] text-center text-sm mb-6">How do you want to add your bet?</p>
            
            <label className="card block cursor-pointer text-center py-8 hover:border-[var(--accent)] transition-colors">
              <input type="file" accept="image/*" onChange={handleFile} className="hidden" />
              <IconCamera className="w-10 h-10 mx-auto mb-3 text-[var(--text-secondary)]" />
              <p className="font-semibold">Upload Screenshot</p>
              <p className="text-sm text-[var(--text-secondary)]">We'll read your bet slip automatically</p>
            </label>

            <button onClick={() => setMode("manual")} className="card block w-full text-center py-8 hover:border-[var(--accent)] transition-colors">
              <IconEdit className="w-10 h-10 mx-auto mb-3 text-[var(--text-secondary)]" />
              <p className="font-semibold">Enter Manually</p>
              <p className="text-sm text-[var(--text-secondary)]">Type in your bet details</p>
            </button>
          </div>
        )}

        {mode === "upload" && (
          <div className="card text-center py-12">
            <p>{uploading ? "Uploading..." : parsing ? "Reading bet slip..." : "Processing..."}</p>
          </div>
        )}

        {mode === "manual" && (
          <div className="space-y-4">
            {/* Stake and returns */}
            <div className="card">
              <p className="section-header">Bet Details</p>
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-xs font-medium mb-2 text-[var(--text-secondary)]">Stake</label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-secondary)]">£</span>
                    <input 
                      type="number" 
                      value={stake} 
                      onChange={(e) => setStake(e.target.value)} 
                      placeholder="0.00"
                      className="pl-7"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-medium mb-2 text-[var(--text-secondary)]">Returns</label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-secondary)]">£</span>
                    <input 
                      type="number" 
                      value={potentialReturn} 
                      onChange={(e) => setPotentialReturn(e.target.value)} 
                      placeholder="0.00"
                      className="pl-7"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium mb-2 text-[var(--text-secondary)]">Status</label>
                <div className="grid grid-cols-3 gap-2">
                  {["pending", "won", "lost"].map((s) => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => setStatus(s)}
                      className={`py-2 px-3 rounded text-xs font-semibold uppercase tracking-wide border transition ${
                        status === s
                          ? s === "won" ? "bg-green-50 border-[var(--accent)] text-[var(--accent)]"
                            : s === "lost" ? "bg-red-50 border-[var(--danger)] text-[var(--danger)]"
                            : "bg-yellow-50 border-[var(--warning)] text-[var(--warning)]"
                          : "border-[var(--border)] text-[var(--text-secondary)]"
                      }`}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Selections */}
            <div className="card">
              <p className="section-header">Selections</p>
              <div className="space-y-3">
                {legs.map((leg, i) => (
                  <div key={i} className="flex gap-2">
                    <input
                      value={leg.selection}
                      onChange={(e) => updateLeg(i, "selection", e.target.value)}
                      placeholder="e.g. Arsenal to win"
                      className="flex-1"
                    />
                    <input
                      value={leg.odds}
                      onChange={(e) => updateLeg(i, "odds", e.target.value)}
                      placeholder="2/1"
                      className="w-20 text-center"
                    />
                    {legs.length > 1 && (
                      <button 
                        onClick={() => removeLeg(i)} 
                        className="p-2 text-[var(--danger)]"
                      >
                        <IconX className="w-5 h-5" />
                      </button>
                    )}
                  </div>
                ))}
              </div>
              <button 
                onClick={addLeg} 
                className="mt-3 flex items-center gap-1 text-[var(--accent)] font-medium text-sm"
              >
                <IconPlus className="w-4 h-4" />
                <span>Add selection</span>
              </button>
            </div>

            {/* Save button */}
            <button
              onClick={handleSave}
              disabled={saving || !stake || !potentialReturn || !legs.some((l) => l.selection)}
              className="btn btn-primary w-full"
            >
              {saving ? "Saving..." : "Save Bet"}
            </button>
          </div>
        )}
      </div>
    </main>
  );
}
