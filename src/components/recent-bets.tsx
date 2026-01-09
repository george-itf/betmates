interface Bet {
  id: string;
  user_id: string;
  bet_type: string;
  stake: number;
  potential_return: number;
  actual_return: number;
  status: string;
  placed_at: string;
  profiles: { display_name: string; avatar_url: string | null };
  bet_legs: Array<{ selection: string; odds_fractional: string; result: string }>;
}

interface RecentBetsProps {
  bets: Bet[];
  currentUserId: string;
}

export function RecentBets({ bets, currentUserId }: RecentBetsProps) {
  if (bets.length === 0) {
    return (
      <div className="card text-center py-8">
        <p className="text-[var(--muted)]">no bets yet</p>
      </div>
    );
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "won":
        return "var(--success)";
      case "lost":
        return "var(--danger)";
      case "void":
        return "var(--muted)";
      default:
        return "var(--warning)";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "won":
        return "✓";
      case "lost":
        return "✗";
      case "void":
        return "−";
      default:
        return "○";
    }
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffHours / 24);

    if (diffHours < 1) return "just now";
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays === 1) return "yesterday";
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString("en-GB", { day: "numeric", month: "short" });
  };

  return (
    <div className="space-y-3">
      {bets.map((bet) => {
        const isCurrentUser = bet.user_id === currentUserId;
        const profile = bet.profiles;

        return (
          <div key={bet.id} className="card">
            {/* Header */}
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-full bg-[var(--background)] flex items-center justify-center text-xs">
                  {profile?.avatar_url ? (
                    <img
                      src={profile.avatar_url}
                      alt=""
                      className="w-full h-full rounded-full object-cover"
                    />
                  ) : (
                    profile?.display_name?.[0]?.toUpperCase() || "?"
                  )}
                </div>
                <span className="text-sm">
                  {isCurrentUser ? "you" : profile?.display_name}
                </span>
                <span className="text-xs text-[var(--muted)]">
                  {formatTime(bet.placed_at)}
                </span>
              </div>
              <div
                className="flex items-center gap-1 text-sm font-medium"
                style={{ color: getStatusColor(bet.status) }}
              >
                <span>{getStatusIcon(bet.status)}</span>
                <span>{bet.status}</span>
              </div>
            </div>

            {/* Legs */}
            <div className="space-y-1 mb-3">
              {bet.bet_legs.slice(0, 3).map((leg, i) => (
                <div key={i} className="flex items-center gap-2 text-sm">
                  <span
                    className="w-4 text-center"
                    style={{ color: getStatusColor(leg.result) }}
                  >
                    {getStatusIcon(leg.result)}
                  </span>
                  <span className="flex-1 truncate">{leg.selection}</span>
                  <span className="text-[var(--muted)]">{leg.odds_fractional}</span>
                </div>
              ))}
              {bet.bet_legs.length > 3 && (
                <p className="text-xs text-[var(--muted)] pl-6">
                  +{bet.bet_legs.length - 3} more legs
                </p>
              )}
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between pt-2 border-t border-[var(--border)]">
              <div className="text-sm">
                <span className="text-[var(--muted)]">stake:</span>{" "}
                <span>£{bet.stake.toFixed(2)}</span>
              </div>
              <div className="text-sm">
                {bet.status === "won" ? (
                  <span className="text-[var(--success)] font-medium">
                    +£{(bet.actual_return - bet.stake).toFixed(2)}
                  </span>
                ) : bet.status === "lost" ? (
                  <span className="text-[var(--danger)]">
                    -£{bet.stake.toFixed(2)}
                  </span>
                ) : (
                  <span className="text-[var(--muted)]">
                    returns £{bet.potential_return.toFixed(2)}
                  </span>
                )}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
