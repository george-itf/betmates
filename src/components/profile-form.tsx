"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";

interface ProfileFormProps {
  userId: string;
  currentName: string;
}

export function ProfileForm({ userId, currentName }: ProfileFormProps) {
  const [name, setName] = useState(currentName);
  const [loading, setLoading] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");
  
  const router = useRouter();
  const supabase = createClient();

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!name.trim()) {
      setError("Name is required");
      return;
    }

    setLoading(true);
    setError("");
    setSaved(false);

    try {
      const { error: updateError } = await supabase
        .from("profiles")
        .update({ display_name: name.trim() })
        .eq("id", userId);

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
        <label className="block text-sm text-[var(--muted)] mb-1">
          display name
        </label>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="your name"
          required
          disabled={loading}
        />
        <p className="text-xs text-[var(--muted)] mt-1">
          this is how you appear to other players
        </p>
      </div>

      {error && <p className="text-[var(--danger)] text-sm">{error}</p>}

      <button
        type="submit"
        className="btn btn-primary w-full"
        disabled={loading || name === currentName}
      >
        {loading ? "saving..." : saved ? "saved ✓" : "save"}
      </button>
    </form>
  );
}
