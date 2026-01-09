"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";

export function ProfileForm({ userId, currentName }: { userId: string; currentName: string }) {
  const [name, setName] = useState(currentName);
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || name === currentName) return;
    
    setLoading(true);
    await supabase.from("profiles").update({ display_name: name.trim() }).eq("id", userId);
    router.refresh();
    setLoading(false);
  };

  return (
    <form onSubmit={handleSave} className="space-y-3">
      <div>
        <label className="text-xs text-[var(--muted)] block mb-1">Display name</label>
        <input value={name} onChange={(e) => setName(e.target.value)} required />
      </div>
      <button
        type="submit"
        disabled={loading || !name.trim() || name === currentName}
        className="w-full py-2.5 bg-[var(--white)] text-[var(--bg)] rounded text-sm font-medium"
      >
        {loading ? "Saving..." : "Save"}
      </button>
    </form>
  );
}
