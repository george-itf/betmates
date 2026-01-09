-- Activity Log Table
-- Run this in Supabase SQL Editor

CREATE TABLE activity_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  league_id uuid REFERENCES leagues(id) ON DELETE CASCADE,
  user_id uuid REFERENCES profiles(id) ON DELETE SET NULL,
  event_type text NOT NULL CHECK (event_type IN ('bet_placed', 'bet_settled', 'member_joined', 'payment_made', 'group_bet_created')),
  data jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE activity_log ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "League members can view activity" ON activity_log
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM league_members lm
      WHERE lm.league_id = activity_log.league_id AND lm.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create activity for their leagues" ON activity_log
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM league_members lm
      WHERE lm.league_id = activity_log.league_id AND lm.user_id = auth.uid()
    )
  );

-- Index for quick lookups
CREATE INDEX idx_activity_log_league ON activity_log(league_id);
CREATE INDEX idx_activity_log_created ON activity_log(created_at DESC);

-- Enable realtime
ALTER PUBLICATION supabase_realtime ADD TABLE activity_log;
