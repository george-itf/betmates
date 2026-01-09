interface LeaderboardEntry {
  user_id: string;
  display_name: string;
  avatar_url: string | null;
  total_bets: number;
  wins: number;
  profit: number;
  roi: number;
}

interface LeaderboardProps {
  entries: LeaderboardEntry[];
  currentUserId: string;
}

export function Leaderboard({ entries, currentUserId }: LeaderboardProps) {
  if (entries.length === 0) {
    return (
      <div className="card text-center py-8">
        <p className="text-[var(--muted)]">no bets yet this season</p>
        <p className="text-sm text-[var(--muted)]">be the first to place one!</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {entries.map((entry, index) => {
        const isCurrentUser = entry.user_id === currentUserId;
        const isTop3 = index < 3;
        const medal = index === 0 ? "🥇" : index === 1 ? "🥈" : index === 2 ? "🥉" : null;

        return (
          <div
            key={entry.user_id}
            className={`card flex items-center gap-3 ${
              isCurrentUser ? "border-[var(--accent)]" : ""
            }`}
          >
            {/* Position */}
            <div className="w-8 text-center">
              {medal ? (
                <span className="text-xl">{medal}</span>
              ) : (
                <span className="text-[var(--muted)] font-medium">{index + 1}</span>
              )}
            </div>

            {/* Avatar */}
            <div className="w-10 h-10 rounded-full bg-[var(--background)] flex items-center justify-center text-sm font-medium">
              {entry.avatar_url ? (
                <img
                  src={entry.avatar_url}
                  alt=""
                  className="w-full h-full rounded-full object-cover"
                />
              ) : (
                entry.display_name[0]?.toUpperCase()
              )}
            </div>

            {/* Name & stats */}
            <div className="flex-1 min-w-0">
              <p className="font-medium truncate">
                {entry.display_name}
                {isCurrentUser && (
                  <span className="text-[var(--muted)] font-normal"> (you)</span>
                )}
              </p>
              <p className="text-sm text-[var(--muted)]">
                {entry.wins}/{entry.total_bets} wins • {entry.roi > 0 ? "+" : ""}{entry.roi}% ROI
              </p>
            </div>

            {/* Profit */}
            <div className="text-right">
              <p
                className={`font-bold ${
                  entry.profit > 0
                    ? "text-[var(--success)]"
                    : entry.profit < 0
                    ? "text-[var(--danger)]"
                    : "text-[var(--muted)]"
                }`}
              >
                {entry.profit > 0 ? "+" : ""}£{entry.profit.toFixed(2)}
              </p>
            </div>
          </div>
        );
      })}
    </div>
  );
}
