-- Additional functions for group bets
-- Run this in Supabase SQL Editor

-- Increment votes count
create or replace function increment_votes(submission_id uuid)
returns void as $$
begin
  update group_bet_submissions
  set votes_count = votes_count + 1
  where id = submission_id;
end;
$$ language plpgsql security definer;

-- Decrement votes count
create or replace function decrement_votes(submission_id uuid)
returns void as $$
begin
  update group_bet_submissions
  set votes_count = greatest(0, votes_count - 1)
  where id = submission_id;
end;
$$ language plpgsql security definer;

-- Finalize group bet (move from voting to betting, select winners)
create or replace function finalize_group_bet(p_group_bet_id uuid)
returns void as $$
declare
  v_winning_count int;
  v_total_stake numeric;
  v_final_odds numeric;
begin
  -- Get winning legs count
  select winning_legs_count into v_winning_count
  from group_bets where id = p_group_bet_id;

  -- Mark top voted submissions as winners
  with ranked as (
    select id, row_number() over (order by votes_count desc, created_at asc) as rn
    from group_bet_submissions
    where group_bet_id = p_group_bet_id
  )
  update group_bet_submissions
  set is_winner = true
  where id in (select id from ranked where rn <= v_winning_count);

  -- Calculate combined odds
  select coalesce(exp(sum(ln(odds_decimal))), 1) into v_final_odds
  from group_bet_submissions
  where group_bet_id = p_group_bet_id and is_winner = true;

  -- Calculate total stake (participants * buyin)
  select count(distinct user_id) * (select buyin_per_user from group_bets where id = p_group_bet_id)
  into v_total_stake
  from group_bet_submissions
  where group_bet_id = p_group_bet_id;

  -- Update group bet
  update group_bets
  set 
    status = 'betting',
    final_odds_decimal = v_final_odds,
    total_stake = v_total_stake
  where id = p_group_bet_id;
end;
$$ language plpgsql security definer;

-- Transition group bet to voting (after submission deadline)
create or replace function transition_to_voting(p_group_bet_id uuid)
returns void as $$
begin
  update group_bets
  set status = 'voting_open'
  where id = p_group_bet_id and status = 'submissions_open';
end;
$$ language plpgsql security definer;

-- Grant execute permissions
grant execute on function increment_votes(uuid) to authenticated;
grant execute on function decrement_votes(uuid) to authenticated;
grant execute on function finalize_group_bet(uuid) to authenticated;
grant execute on function transition_to_voting(uuid) to authenticated;
