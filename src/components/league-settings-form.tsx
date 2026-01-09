"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";

interface League {
  id: string;
  name: string;
  weekly_buyin: number;
  season_length_weeks: number;
  group_bet_buyin: number;
  group_bet_legs_per_user: number;
  group_bet_winning_legs: number;
}

interface LeagueSettingsFormProps {
  league: League;
}

export function LeagueSettingsForm({ league }: LeagueSettingsFormProps) {
  const [loading, setLoading] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");
  
  const [name, setName] = useState(league.name);
  const [weeklyBuyin, setWeeklyBuyin] = useState(league.weekly_buyin.toString());
  const [seasonLength, setSeasonLength] = useState(league.season_length_weeks.toString());
  const [groupBetBuyin, setGroupBetBuyin] = useState(league.group_bet_buyin.toString());
  const [groupBetLegs, setGroupBetLegs] = useState(league.group_bet_legs_per_user.toString());
  const [groupBetWinning, setGroupBetWinning] = useState(league.group_bet_winning_legs.toString());

  const router = useRouter();
  const supabase = createClient();

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSaved(false);

    try {
      const { error: updateError } = await supabase
        .from("leagues")
        .update({
          name,
          weekly_buyin: parseFloat(weeklyBuyin),
          season_length_weeks: parseInt(seasonLength),
          group_bet_buyin: parseFloat(groupBetBuyin),
          group_bet_legs_per_user: parseInt(groupBetLegs),
          group_bet_winning_legs: parseInt(groupBetWinning),
        })
        .eq("id", league.id);

      if (updateError) throw updateError;

      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSave} className="card space-y-4">
      <div>
        <label className="block text-sm text-[var(--muted)] mb-1">league name</label>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
          disabled={loading}
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm text-[var(--muted)] mb-1">weekly buy-in</label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--muted)]">£</span>
            <input
              type="number"
              value={weeklyBuyin}
              onChange={(e) => setWeeklyBuyin(e.target.value)}
              min="0"
              step="0.50"
              required
              disabled={loading}
              className="pl-7"
            />
          </div>
        </div>
        <div>
          <label className="block text-sm text-[var(--muted)] mb-1">season length</label>
          <select
            value={seasonLength}
            onChange={(e) => setSeasonLength(e.target.value)}
            disabled={loading}
          >
            <option value="4">4 weeks</option>
            <option value="6">6 weeks</option>
            <option value="8">8 weeks</option>
            <option value="12">12 weeks</option>
          </select>
        </div>
      </div>

      <div className="pt-2 border-t border-[var(--border)]">
        <p className="text-sm text-[var(--muted)] mb-3">group bet defaults</p>
        <div className="grid grid-cols-3 gap-3">
          <div>
            <label className="block text-xs text-[var(--muted)] mb-1">buy-in</label>
            <div className="relative">
              <span className="absolute left-2 top-1/2 -translate-y-1/2 text-[var(--muted)] text-sm">£</span>
              <input
                type="number"
                value={groupBetBuyin}
                onChange={(e) => setGroupBetBuyin(e.target.value)}
                min="0"
                step="0.50"
                disabled={loading}
                className="pl-5 text-sm"
              />
            </div>
          </div>
          <div>
            <label className="block text-xs text-[var(--muted)] mb-1">legs each</label>
            <select
              value={groupBetLegs}
              onChange={(e) => setGroupBetLegs(e.target.value)}
              disabled={loading}
              className="text-sm"
            >
              <option value="2">2</option>
              <option value="3">3</option>
              <option value="4">4</option>
              <option value="5">5</option>
            </select>
          </div>
          <div>
            <label className="block text-xs text-[var(--muted)] mb-1">winning</label>
            <select
              value={groupBetWinning}
              onChange={(e) => setGroupBetWinning(e.target.value)}
              disabled={loading}
              className="text-sm"
            >
              <option value="3">3</option>
              <option value="4">4</option>
              <option value="5">5</option>
              <option value="6">6</option>
            </select>
          </div>
        </div>
      </div>

      {error && <p className="text-[var(--danger)] text-sm">{error}</p>}

      <button
        type="submit"
        className="btn btn-primary w-full"
        disabled={loading}
      >
        {loading ? "saving..." : saved ? "saved ✓" : "save changes"}
      </button>
    </form>
  );
}
