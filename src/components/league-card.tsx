import Link from "next/link";

interface Season {
  id: string;
  season_number: number;
  status: string;
  starts_at: string;
  ends_at: string;
  pot_amount: number;
}

interface LeagueProps {
  league: {
    id: string;
    name: string;
    invite_code: string;
    weekly_buyin: number;
    role: string;
    currentSeason?: Season;
  };
}

export function LeagueCard({ league }: LeagueProps) {
  const season = league.currentSeason;
  
  const getSeasonStatus = () => {
    if (!season) return { label: "no season", color: "var(--muted)" };
    if (season.status === "active") return { label: "live", color: "var(--success)" };
    if (season.status === "upcoming") return { label: "starting soon", color: "var(--accent)" };
    return { label: "ended", color: "var(--muted)" };
  };

  const status = getSeasonStatus();

  const getTimeRemaining = () => {
    if (!season || season.status !== "active") return null;
    const end = new Date(season.ends_at);
    const now = new Date();
    const days = Math.ceil((end.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    if (days <= 0) return "ending today";
    if (days === 1) return "1 day left";
    return `${days} days left`;
  };

  const timeRemaining = getTimeRemaining();

  return (
    <Link href={`/league/${league.id}`} className="card block hover:border-[var(--accent)] transition-colors">
      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <h3 className="font-medium">{league.name}</h3>
            {league.role === "admin" && (
              <span className="text-xs px-1.5 py-0.5 rounded bg-[var(--accent)]/20 text-[var(--accent)]">
                admin
              </span>
            )}
          </div>
          <div className="flex items-center gap-2 text-sm text-[var(--muted)]">
            <span style={{ color: status.color }}>● {status.label}</span>
            {timeRemaining && <span>• {timeRemaining}</span>}
          </div>
        </div>
        
        {season && (
          <div className="text-right">
            <div className="text-lg font-bold text-[var(--success)]">
              £{season.pot_amount?.toFixed(0) || 0}
            </div>
            <div className="text-xs text-[var(--muted)]">pot</div>
          </div>
        )}
      </div>

      {season && (
        <div className="mt-3 pt-3 border-t border-[var(--card-border)] flex items-center justify-between text-sm">
          <span className="text-[var(--muted)]">season {season.season_number}</span>
          <span className="text-[var(--muted)]">£{league.weekly_buyin}/week</span>
        </div>
      )}
    </Link>
  );
}
