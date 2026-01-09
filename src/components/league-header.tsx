"use client";

import Link from "next/link";
import { useState } from "react";

interface Season {
  id: string;
  season_number: number;
  status: string;
  starts_at: string;
  ends_at: string;
  pot_amount: number;
}

interface LeagueHeaderProps {
  league: {
    id: string;
    name: string;
    invite_code: string;
    weekly_buyin: number;
  };
  season?: Season;
  isAdmin: boolean;
  memberCount: number;
}

export function LeagueHeader({ league, season, isAdmin, memberCount }: LeagueHeaderProps) {
  const [showCode, setShowCode] = useState(false);
  const [copied, setCopied] = useState(false);

  const getTimeRemaining = () => {
    if (!season || season.status !== "active") return null;
    const end = new Date(season.ends_at);
    const now = new Date();
    const days = Math.ceil((end.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    if (days <= 0) return "ending today";
    if (days === 1) return "1 day left";
    return `${days} days left`;
  };

  const copyCode = async () => {
    await navigator.clipboard.writeText(league.invite_code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="bg-[var(--card)] border-b border-[var(--card-border)]">
      <div className="p-4 max-w-lg mx-auto">
        {/* Top row */}
        <div className="flex items-center justify-between mb-4">
          <Link href="/dashboard" className="text-[var(--muted)]">
            ← back
          </Link>
          {isAdmin && (
            <Link
              href={`/league/${league.id}/settings`}
              className="text-sm text-[var(--accent)]"
            >
              settings
            </Link>
          )}
        </div>

        {/* League name & invite */}
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold">{league.name}</h1>
            <p className="text-sm text-[var(--muted)]">
              {memberCount} member{memberCount !== 1 ? "s" : ""} • £{league.weekly_buyin}/week
            </p>
          </div>
          
          <button
            onClick={() => setShowCode(!showCode)}
            className="text-sm text-[var(--accent)]"
          >
            invite
          </button>
        </div>

        {/* Invite code drawer */}
        {showCode && (
          <div className="mt-4 p-3 bg-[var(--background)] rounded-lg flex items-center justify-between">
            <div>
              <p className="text-xs text-[var(--muted)]">invite code</p>
              <p className="font-mono text-lg tracking-widest">{league.invite_code}</p>
            </div>
            <button
              onClick={copyCode}
              className="btn text-sm py-2 px-3"
            >
              {copied ? "copied!" : "copy"}
            </button>
          </div>
        )}

        {/* Season info */}
        {season && (
          <div className="mt-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="text-center">
                <p className="text-2xl font-bold text-[var(--success)]">
                  £{season.pot_amount?.toFixed(0) || 0}
                </p>
                <p className="text-xs text-[var(--muted)]">pot</p>
              </div>
              <div className="w-px h-8 bg-[var(--border)]" />
              <div>
                <p className="font-medium">season {season.season_number}</p>
                <p className="text-xs text-[var(--muted)]">{getTimeRemaining()}</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
