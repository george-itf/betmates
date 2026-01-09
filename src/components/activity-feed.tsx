"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { IconCheck, IconPlus, IconUsers, IconDollar } from "@/components/icons";

// Group icon
function IconUsersGroup({ className = "icon" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  );
}

interface Activity {
  id: string;
  event_type: string;
  data: {
    user_name?: string;
    stake?: number;
    return?: number;
    won?: boolean;
    title?: string;
    amount?: number;
  };
  created_at: string;
}

export function ActivityFeed({
  leagueId,
  initialActivities,
}: {
  leagueId: string;
  initialActivities: Activity[];
}) {
  const [activities, setActivities] = useState<Activity[]>(initialActivities);
  const supabase = createClient();

  useEffect(() => {
    // Subscribe to realtime updates
    const channel = supabase
      .channel(`activity-${leagueId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "activity_log",
          filter: `league_id=eq.${leagueId}`,
        },
        (payload) => {
          const newActivity = payload.new as Activity;
          setActivities((prev) => [newActivity, ...prev.slice(0, 19)]);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [leagueId, supabase]);

  const getIcon = (type: string) => {
    switch (type) {
      case "bet_placed":
        return <IconPlus className="w-4 h-4" />;
      case "bet_settled":
        return <IconCheck className="w-4 h-4" />;
      case "member_joined":
        return <IconUsers className="w-4 h-4" />;
      case "payment_made":
        return <IconDollar className="w-4 h-4" />;
      case "group_bet_created":
        return <IconUsersGroup className="w-4 h-4" />;
      default:
        return <IconPlus className="w-4 h-4" />;
    }
  };

  const getIconBg = (type: string) => {
    switch (type) {
      case "bet_placed":
        return "bg-blue-100 text-blue-600";
      case "bet_settled":
        return "bg-green-100 text-green-600";
      case "member_joined":
        return "bg-purple-100 text-purple-600";
      case "payment_made":
        return "bg-yellow-100 text-yellow-700";
      case "group_bet_created":
        return "bg-pink-100 text-pink-600";
      default:
        return "bg-gray-100 text-gray-600";
    }
  };

  const getMessage = (activity: Activity) => {
    const { event_type, data } = activity;
    switch (event_type) {
      case "bet_placed":
        return (
          <span>
            <strong>{data.user_name}</strong> placed a{" "}
            <strong>£{data.stake?.toFixed(2)}</strong> bet
          </span>
        );
      case "bet_settled":
        return (
          <span>
            <strong>{data.user_name}</strong>{" "}
            {data.won ? (
              <span className="text-[var(--accent)]">won £{data.return?.toFixed(2)}</span>
            ) : (
              <span className="text-[var(--danger)]">lost their bet</span>
            )}
          </span>
        );
      case "member_joined":
        return (
          <span>
            <strong>{data.user_name}</strong> joined the league
          </span>
        );
      case "payment_made":
        return (
          <span>
            <strong>{data.user_name}</strong> paid £{data.amount?.toFixed(2)}
          </span>
        );
      case "group_bet_created":
        return (
          <span>
            <strong>{data.user_name}</strong> created group bet:{" "}
            <strong>{data.title}</strong>
          </span>
        );
      default:
        return <span>Activity</span>;
    }
  };

  const formatTime = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return "just now";
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days < 7) return `${days}d ago`;
    return date.toLocaleDateString("en-GB", { day: "numeric", month: "short" });
  };

  if (activities.length === 0) {
    return (
      <p className="text-sm text-[var(--text-secondary)] text-center py-4">
        No activity yet
      </p>
    );
  }

  return (
    <div className="space-y-3">
      {activities.map((activity) => (
        <div key={activity.id} className="flex items-start gap-3">
          <div
            className={`w-8 h-8 rounded flex items-center justify-center flex-shrink-0 ${getIconBg(
              activity.event_type
            )}`}
          >
            {getIcon(activity.event_type)}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm leading-snug">{getMessage(activity)}</p>
            <p className="text-xs text-[var(--text-secondary)] mt-0.5">
              {formatTime(activity.created_at)}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
}
