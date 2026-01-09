"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";

interface League {
  id: string;
  name: string;
  weekly_buyin: number;
  season_length_weeks: number;
}

export function SettingsForm({ league }: { league: League }) {
  const [name, setName] = useState(league.name);
  const [buyin, setBuyin] = useState(league.weekly_buyin.toString());
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    await supabase.from("leagues").update({ name, weekly_buyin: parseFloat(buyin) }).eq("id", league.id);
    router.refresh();
    setLoading(false);
  };

  return (
    <form onSubmit={handleSave} className="space-y-3">
      <input value={name} onChange={(e) => setName(e.target.value)} placeholder="League name" required />
      <div>
        <label className="text-xs text-[var(--muted)] block mb-1">Weekly buy-in (£)</label>
        <input type="number" value={buyin} onChange={(e) => setBuyin(e.target.value)} min="0" step="0.5" />
      </div>
      <button
        type="submit"
        disabled={loading}
        className="w-full py-2.5 bg-[var(--white)] text-[var(--bg)] rounded text-sm font-medium"
      >
        {loading ? "..." : "Save"}
      </button>
    </form>
  );
}
