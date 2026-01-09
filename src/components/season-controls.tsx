"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";

interface Season {
  id: string;
  season_number: number;
  status: string;
  starts_at: string;
  ends_at: string;
  pot_amount: number;
  winner_id: string | null;
}

interface Member {
  user_id: string;
  profiles: {
    display_name: string;
  };
}

interface SeasonControlsProps {
  leagueId: string;
  currentSeason: Season | null;
  allSeasons: Season[];
  members: Member[];
  seasonLengthWeeks: number;
}

export function SeasonControls({
  leagueId,
  currentSeason,
  allSeasons,
  members,
  seasonLengthWeeks,
}: SeasonControlsProps) {
  const [loading, setLoading] = useState(false);
  const [showEndModal, setShowEndModal] = useState(false);
  const [selectedWinner, setSelectedWinner] = useState("");
  const router = useRouter();
  const supabase = createClient();

  const handleStartNewSeason = async () => {
    setLoading(true);
    try {
      const nextSeasonNumber = allSeasons.length > 0 
        ? Math.max(...allSeasons.map(s => s.season_number)) + 1 
        : 1;

      const startsAt = new Date();
      const endsAt = new Date();
      endsAt.setDate(endsAt.getDate() + seasonLengthWeeks * 7);

      const { error } = await supabase
        .from("seasons")
        .insert({
          league_id: leagueId,
          season_number: nextSeasonNumber,
          starts_at: startsAt.toISOString(),
          ends_at: endsAt.toISOString(),
          status: "active",
        });

      if (error) throw error;
      router.refresh();
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleEndSeason = async () => {
    if (!currentSeason || !selectedWinner) return;
    
    setLoading(true);
    try {
      const { error } = await supabase
        .from("seasons")
        .update({
          status: "completed",
          winner_id: selectedWinner,
        })
        .eq("id", currentSeason.id);

      if (error) throw error;
      setShowEndModal(false);
      router.refresh();
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const getTimeInfo = () => {
    if (!currentSeason) return null;
    const end = new Date(currentSeason.ends_at);
    const now = new Date();
    const days = Math.ceil((end.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    
    if (days <= 0) return "ended";
    return `${days} days remaining`;
  };

  return (
    <div className="space-y-4">
      {/* Current Season Info */}
      {currentSeason ? (
        <div className="card space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-medium">season {currentSeason.season_number}</h3>
              <p className="text-sm text-[var(--muted)]">{getTimeInfo()}</p>
            </div>
            <div className="text-right">
              <p className="text-lg font-bold text-[var(--success)]">
                £{currentSeason.pot_amount?.toFixed(0) || 0}
              </p>
              <p className="text-xs text-[var(--muted)]">pot</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 text-sm">
            <div>
              <p className="text-[var(--muted)]">started</p>
              <p>{new Date(currentSeason.starts_at).toLocaleDateString("en-GB", {
                day: "numeric",
                month: "short",
              })}</p>
            </div>
            <div>
              <p className="text-[var(--muted)]">ends</p>
              <p>{new Date(currentSeason.ends_at).toLocaleDateString("en-GB", {
                day: "numeric",
                month: "short",
              })}</p>
            </div>
          </div>

          <button
            onClick={() => setShowEndModal(true)}
            className="btn w-full border-[var(--warning)] text-[var(--warning)]"
          >
            end season & declare winner
          </button>
        </div>
      ) : (
        <div className="card text-center py-8 space-y-4">
          <p className="text-[var(--muted)]">no active season</p>
          <button
            onClick={handleStartNewSeason}
            className="btn btn-primary"
            disabled={loading}
          >
            {loading ? "creating..." : "start new season"}
          </button>
        </div>
      )}

      {/* Past Seasons */}
      {allSeasons.filter(s => s.status === "completed").length > 0 && (
        <div className="space-y-2">
          <p className="text-sm text-[var(--muted)]">past seasons</p>
          {allSeasons
            .filter(s => s.status === "completed")
            .map(season => {
              const winner = members.find(m => m.user_id === season.winner_id);
              return (
                <div key={season.id} className="card flex items-center justify-between">
                  <div>
                    <p className="font-medium">season {season.season_number}</p>
                    <p className="text-sm text-[var(--muted)]">
                      {winner ? `won by ${winner.profiles?.display_name}` : "no winner"}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-[var(--success)]">
                      £{season.pot_amount?.toFixed(0) || 0}
                    </p>
                  </div>
                </div>
              );
            })}
        </div>
      )}

      {/* End Season Modal */}
      {showEndModal && currentSeason && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60" onClick={() => setShowEndModal(false)} />
          <div className="relative bg-[var(--card)] rounded-xl p-6 w-full max-w-md border border-[var(--card-border)]">
            <h2 className="text-xl font-bold mb-4">end season {currentSeason.season_number}</h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm text-[var(--muted)] mb-1">
                  select winner
                </label>
                <select
                  value={selectedWinner}
                  onChange={(e) => setSelectedWinner(e.target.value)}
                  className="w-full"
                >
                  <option value="">choose winner...</option>
                  {members.map(member => (
                    <option key={member.user_id} value={member.user_id}>
                      {member.profiles?.display_name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="card bg-[var(--warning)]/10 border-[var(--warning)]/30">
                <p className="text-sm">
                  <strong>pot:</strong> £{currentSeason.pot_amount?.toFixed(2) || 0}
                </p>
                <p className="text-sm text-[var(--muted)] mt-1">
                  this will end the season permanently
                </p>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => setShowEndModal(false)}
                  className="btn flex-1"
                  disabled={loading}
                >
                  cancel
                </button>
                <button
                  onClick={handleEndSeason}
                  className="btn btn-primary flex-1"
                  disabled={loading || !selectedWinner}
                >
                  {loading ? "..." : "confirm"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
