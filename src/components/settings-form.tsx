"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";

interface League {
  id: string;
  name: string;
  weekly_buyin: number;
}

export function SettingsForm({ league }: { league: League }) {
  const [name, setName] = useState(league.name);
  const [buyin, setBuyin] = useState(league.weekly_buyin.toString());
  const [loading, setLoading] = useState(false);
  const [saved, setSaved] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    await supabase.from("leagues").update({ name, weekly_buyin: parseFloat(buyin) }).eq("id", league.id);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
    router.refresh();
    setLoading(false);
  };

  return (
    <form onSubmit={handleSave} className="space-y-4">
      <div>
        <label className="block text-sm font-medium mb-2">League name</label>
        <input value={name} onChange={(e) => setName(e.target.value)} required />
      </div>
      <div>
        <label className="block text-sm font-medium mb-2">Weekly buy-in</label>
        <div className="relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-secondary)]">£</span>
          <input type="number" value={buyin} onChange={(e) => setBuyin(e.target.value)} min="0" step="0.5" className="pl-7" />
        </div>
      </div>
      <button type="submit" disabled={loading} className="btn btn-primary w-full">
        {loading ? "Saving..." : saved ? "Saved ✓" : "Save changes"}
      </button>
    </form>
  );
}
