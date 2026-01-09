"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";

interface DangerZoneProps {
  leagueId: string;
  leagueName: string;
}

export function DangerZone({ leagueId, leagueName }: DangerZoneProps) {
  const [showConfirm, setShowConfirm] = useState(false);
  const [confirmText, setConfirmText] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  const handleDelete = async () => {
    if (confirmText !== leagueName) return;
    
    setLoading(true);
    try {
      const { error } = await supabase
        .from("leagues")
        .delete()
        .eq("id", leagueId);

      if (error) throw error;
      
      router.push("/dashboard");
      router.refresh();
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="card border-[var(--danger)]/30 space-y-4">
      <div>
        <h3 className="font-medium text-[var(--danger)]">delete league</h3>
        <p className="text-sm text-[var(--muted)]">
          permanently delete this league and all its data. this cannot be undone.
        </p>
      </div>

      {!showConfirm ? (
        <button
          onClick={() => setShowConfirm(true)}
          className="btn border-[var(--danger)] text-[var(--danger)] w-full"
        >
          delete league
        </button>
      ) : (
        <div className="space-y-3">
          <p className="text-sm">
            type <strong>{leagueName}</strong> to confirm
          </p>
          <input
            type="text"
            value={confirmText}
            onChange={(e) => setConfirmText(e.target.value)}
            placeholder="league name"
            className="border-[var(--danger)]"
          />
          <div className="flex gap-3">
            <button
              onClick={() => {
                setShowConfirm(false);
                setConfirmText("");
              }}
              className="btn flex-1"
              disabled={loading}
            >
              cancel
            </button>
            <button
              onClick={handleDelete}
              className="btn flex-1 bg-[var(--danger)] text-white"
              disabled={loading || confirmText !== leagueName}
            >
              {loading ? "deleting..." : "delete forever"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
