"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";

export function ProfileForm({ userId, currentName }: { userId: string; currentName: string }) {
  const [name, setName] = useState(currentName);
  const [loading, setLoading] = useState(false);
  const [saved, setSaved] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || name === currentName) return;
    
    setLoading(true);
    await supabase.from("profiles").update({ display_name: name.trim() }).eq("id", userId);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
    router.refresh();
    setLoading(false);
  };

  return (
    <form onSubmit={handleSave} className="space-y-4">
      <input 
        value={name} 
        onChange={(e) => setName(e.target.value)} 
        placeholder="Your name"
        required 
      />
      <button
        type="submit"
        disabled={loading || !name.trim() || name === currentName}
        className="btn btn-primary w-full"
      >
        {loading ? "Saving..." : saved ? "Saved ✓" : "Save changes"}
      </button>
    </form>
  );
}
