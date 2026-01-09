import { SupabaseClient } from "@supabase/supabase-js";

interface ActivityParams {
  leagueId: string;
  userId: string;
  eventType: "bet_placed" | "bet_settled" | "member_joined" | "payment_made" | "group_bet_created";
  data: Record<string, unknown>;
}

export async function logActivity(
  supabase: SupabaseClient,
  params: ActivityParams
) {
  try {
    await supabase.from("activity_log").insert({
      league_id: params.leagueId,
      user_id: params.userId,
      event_type: params.eventType,
      data: params.data,
    });
  } catch (error) {
    console.error("Failed to log activity:", error);
  }
}
