"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

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
  userId?: string;
}) {
  const [activities, setActivities] = useState<Activity[]>(initialActivities);
  const supabase = createClient();

  useEffect(() => {
    const channel = supabase
      .channel(`activity-${leagueId}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "activity_log", filter: `league_id=eq.${leagueId}` },
        (payload) => {
          const newActivity = payload.new as Activity;
          setActivities((prev) => [newActivity, ...prev.slice(0, 9)]);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [leagueId, supabase]);

  const getMessage = (activity: Activity) => {
    const { event_type, data } = activity;
    switch (event_type) {
      case "bet_placed":
        return `${data.user_name} placed £${data.stake?.toFixed(2)} bet`;
      case "bet_settled":
        return data.won 
          ? `${data.user_name} won £${data.return?.toFixed(2)}`
          : `${data.user_name} lost`;
      case "member_joined":
        return `${data.user_name} joined`;
      case "payment_made":
        return `${data.user_name} paid £${data.amount?.toFixed(2)}`;
      case "group_bet_created":
        return `${data.user_name} created "${data.title}"`;
      default:
        return "Activity";
    }
  };

  const formatTime = (dateStr: string) => {
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    const hrs = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (mins < 1) return "now";
    if (mins < 60) return `${mins}m`;
    if (hrs < 24) return `${hrs}h`;
    return `${days}d`;
  };

  if (activities.length === 0) {
    return <p className="text-sm text-[var(--text-secondary)]">No activity</p>;
  }

  return (
    <div className="space-y-1 text-sm">
      {activities.map((activity) => (
        <div key={activity.id} className="flex items-center justify-between py-1">
          <span className="text-[var(--text-secondary)]">{getMessage(activity)}</span>
          <span className="text-xs text-[var(--text-secondary)]">{formatTime(activity.created_at)}</span>
        </div>
      ))}
    </div>
  );
}
