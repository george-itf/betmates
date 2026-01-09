"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";

interface RegenerateCodeButtonProps {
  leagueId: string;
}

export function RegenerateCodeButton({ leagueId }: RegenerateCodeButtonProps) {
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  const handleRegenerate = async () => {
    if (!confirm("Generate a new invite code? The old code will stop working.")) {
      return;
    }

    setLoading(true);
    try {
      // Generate a random 8-character code
      const newCode = Math.random().toString(36).substring(2, 10);

      const { error } = await supabase
        .from("leagues")
        .update({ invite_code: newCode })
        .eq("id", leagueId);

      if (error) throw error;
      router.refresh();
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      onClick={handleRegenerate}
      disabled={loading}
      className="text-sm text-[var(--muted)] hover:text-[var(--foreground)]"
    >
      {loading ? "generating..." : "regenerate code"}
    </button>
  );
}
