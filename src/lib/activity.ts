import { SupabaseClient } from "@supabase/supabase-js";

export async function logActivity(
  supabase: SupabaseClient,
  leagueId: string,
  userId: string,
  eventType: "bet_placed" | "bet_settled" | "member_joined" | "payment_made" | "group_bet_created",
  data: Record<string, unknown>
) {
  try {
    await supabase.from("activity_log").insert({
      league_id: leagueId,
      user_id: userId,
      event_type: eventType,
      data,
    });
  } catch (error) {
    console.error("Failed to log activity:", error);
  }
}
