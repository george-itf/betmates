-- BetMates Database Schema
-- Run this in Supabase SQL Editor

-- Enable UUID extension (usually already enabled)
create extension if not exists "pgcrypto";

-- ============================================
-- PROFILES (extends Supabase auth.users)
-- ============================================
create table profiles (
  id uuid references auth.users on delete cascade primary key,
  display_name text not null,
  avatar_url text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Auto-create profile on signup
create or replace function handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, display_name)
  values (new.id, coalesce(new.raw_user_meta_data->>'display_name', split_part(new.email, '@', 1)));
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function handle_new_user();

-- ============================================
-- LEAGUES
-- ============================================
create table leagues (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  invite_code text unique not null default substr(md5(random()::text), 1, 8),
  weekly_buyin numeric(10,2) default 5.00,
  season_length_weeks int default 6,
  group_bet_buyin numeric(10,2) default 2.00,
  group_bet_legs_per_user int default 4,
  group_bet_winning_legs int default 5,
  created_by uuid references profiles(id),
  created_at timestamptz default now()
);

-- ============================================
-- LEAGUE MEMBERS
-- ============================================
create table league_members (
  id uuid primary key default gen_random_uuid(),
  league_id uuid references leagues(id) on delete cascade,
  user_id uuid references profiles(id) on delete cascade,
  role text check (role in ('admin', 'member')) default 'member',
  joined_at timestamptz default now(),
  unique(league_id, user_id)
);

-- ============================================
-- SEASONS
-- ============================================
create table seasons (
  id uuid primary key default gen_random_uuid(),
  league_id uuid references leagues(id) on delete cascade,
  season_number int not null,
  starts_at timestamptz not null,
  ends_at timestamptz not null,
  status text check (status in ('upcoming', 'active', 'completed')) default 'upcoming',
  winner_id uuid references profiles(id),
  pot_amount numeric(10,2) default 0,
  created_at timestamptz default now(),
  unique(league_id, season_number)
);

-- ============================================
-- BETS
-- ============================================
create table bets (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references profiles(id) on delete cascade,
  season_id uuid references seasons(id) on delete cascade,
  bet_type text check (bet_type in ('single', 'double', 'treble', 'acca', 'other')) not null,
  stake numeric(10,2) not null,
  potential_return numeric(10,2),
  actual_return numeric(10,2) default 0,
  status text check (status in ('pending', 'won', 'lost', 'void', 'partial')) default 'pending',
  screenshot_url text,
  placed_at timestamptz not null,
  settled_at timestamptz,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- ============================================
-- BET LEGS
-- ============================================
create table bet_legs (
  id uuid primary key default gen_random_uuid(),
  bet_id uuid references bets(id) on delete cascade,
  selection text not null,
  event_name text,
  odds_decimal numeric(10,4) not null,
  odds_fractional text,
  result text check (result in ('pending', 'won', 'lost', 'void')) default 'pending',
  created_at timestamptz default now()
);

-- ============================================
-- GROUP BETS
-- ============================================
create table group_bets (
  id uuid primary key default gen_random_uuid(),
  season_id uuid references seasons(id) on delete cascade,
  title text not null,
  buyin_per_user numeric(10,2) not null,
  legs_per_user int not null,
  winning_legs_count int not null,
  submission_deadline timestamptz not null,
  voting_deadline timestamptz not null,
  status text check (status in ('submissions_open', 'voting_open', 'betting', 'settled')) default 'submissions_open',
  final_odds_decimal numeric(10,4),
  total_stake numeric(10,2),
  result text check (result in ('pending', 'won', 'lost', 'void')) default 'pending',
  payout_per_user numeric(10,2),
  created_at timestamptz default now()
);

-- ============================================
-- GROUP BET SUBMISSIONS
-- ============================================
create table group_bet_submissions (
  id uuid primary key default gen_random_uuid(),
  group_bet_id uuid references group_bets(id) on delete cascade,
  user_id uuid references profiles(id) on delete cascade,
  selection text not null,
  event_name text,
  odds_decimal numeric(10,4) not null,
  odds_fractional text,
  votes_count int default 0,
  is_winner boolean default false,
  result text check (result in ('pending', 'won', 'lost', 'void')) default 'pending',
  created_at timestamptz default now()
);

-- ============================================
-- GROUP BET VOTES
-- ============================================
create table group_bet_votes (
  id uuid primary key default gen_random_uuid(),
  group_bet_id uuid references group_bets(id) on delete cascade,
  submission_id uuid references group_bet_submissions(id) on delete cascade,
  user_id uuid references profiles(id) on delete cascade,
  created_at timestamptz default now(),
  unique(submission_id, user_id)
);

-- ============================================
-- PAYMENTS (weekly buy-in tracking)
-- ============================================
create table payments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references profiles(id) on delete cascade,
  season_id uuid references seasons(id) on delete cascade,
  amount numeric(10,2) not null,
  week_number int not null,
  paid_at timestamptz default now(),
  unique(user_id, season_id, week_number)
);

-- ============================================
-- ROW LEVEL SECURITY
-- ============================================

-- Enable RLS on all tables
alter table profiles enable row level security;
alter table leagues enable row level security;
alter table league_members enable row level security;
alter table seasons enable row level security;
alter table bets enable row level security;
alter table bet_legs enable row level security;
alter table group_bets enable row level security;
alter table group_bet_submissions enable row level security;
alter table group_bet_votes enable row level security;
alter table payments enable row level security;

-- Profiles: users can read all, update own
create policy "Profiles are viewable by everyone" on profiles for select using (true);
create policy "Users can update own profile" on profiles for update using (auth.uid() = id);

-- Leagues: members can read, admins can update
create policy "League members can view league" on leagues for select using (
  exists (select 1 from league_members where league_id = id and user_id = auth.uid())
);
create policy "Anyone can create a league" on leagues for insert with check (auth.uid() = created_by);
create policy "Admins can update league" on leagues for update using (
  exists (select 1 from league_members where league_id = id and user_id = auth.uid() and role = 'admin')
);

-- League members: members can view, anyone can join via invite
create policy "Members can view league members" on league_members for select using (
  exists (select 1 from league_members lm where lm.league_id = league_id and lm.user_id = auth.uid())
);
create policy "Users can join leagues" on league_members for insert with check (auth.uid() = user_id);
create policy "Admins can remove members" on league_members for delete using (
  exists (select 1 from league_members lm where lm.league_id = league_id and lm.user_id = auth.uid() and lm.role = 'admin')
  or auth.uid() = user_id
);

-- Seasons: league members can view
create policy "League members can view seasons" on seasons for select using (
  exists (select 1 from league_members lm join leagues l on lm.league_id = l.id where l.id = league_id and lm.user_id = auth.uid())
);
create policy "Admins can manage seasons" on seasons for all using (
  exists (select 1 from league_members lm join leagues l on lm.league_id = l.id where l.id = league_id and lm.user_id = auth.uid() and lm.role = 'admin')
);

-- Bets: users can manage own, league members can view all in league
create policy "Users can view bets in their leagues" on bets for select using (
  exists (
    select 1 from seasons s 
    join league_members lm on lm.league_id = s.league_id 
    where s.id = season_id and lm.user_id = auth.uid()
  )
);
create policy "Users can create own bets" on bets for insert with check (auth.uid() = user_id);
create policy "Users can update own bets" on bets for update using (auth.uid() = user_id);
create policy "Users can delete own bets" on bets for delete using (auth.uid() = user_id);

-- Bet legs: same as bets
create policy "Users can view bet legs" on bet_legs for select using (
  exists (select 1 from bets b where b.id = bet_id and (
    b.user_id = auth.uid() or exists (
      select 1 from seasons s join league_members lm on lm.league_id = s.league_id 
      where s.id = b.season_id and lm.user_id = auth.uid()
    )
  ))
);
create policy "Users can manage own bet legs" on bet_legs for all using (
  exists (select 1 from bets b where b.id = bet_id and b.user_id = auth.uid())
);

-- Group bets: league members can view and participate
create policy "League members can view group bets" on group_bets for select using (
  exists (
    select 1 from seasons s 
    join league_members lm on lm.league_id = s.league_id 
    where s.id = season_id and lm.user_id = auth.uid()
  )
);
create policy "Admins can manage group bets" on group_bets for all using (
  exists (
    select 1 from seasons s 
    join league_members lm on lm.league_id = s.league_id 
    where s.id = season_id and lm.user_id = auth.uid() and lm.role = 'admin'
  )
);

-- Group bet submissions: members can submit, all can view
create policy "Members can view submissions" on group_bet_submissions for select using (
  exists (
    select 1 from group_bets gb 
    join seasons s on s.id = gb.season_id 
    join league_members lm on lm.league_id = s.league_id 
    where gb.id = group_bet_id and lm.user_id = auth.uid()
  )
);
create policy "Members can create submissions" on group_bet_submissions for insert with check (auth.uid() = user_id);

-- Group bet votes: members can vote
create policy "Members can view votes" on group_bet_votes for select using (
  exists (
    select 1 from group_bets gb 
    join seasons s on s.id = gb.season_id 
    join league_members lm on lm.league_id = s.league_id 
    where gb.id = group_bet_id and lm.user_id = auth.uid()
  )
);
create policy "Members can vote" on group_bet_votes for insert with check (auth.uid() = user_id);
create policy "Members can remove own vote" on group_bet_votes for delete using (auth.uid() = user_id);

-- Payments: users can view own, admins can view all in league
create policy "Users can view own payments" on payments for select using (auth.uid() = user_id);
create policy "Admins can view all payments" on payments for select using (
  exists (
    select 1 from seasons s 
    join league_members lm on lm.league_id = s.league_id 
    where s.id = season_id and lm.user_id = auth.uid() and lm.role = 'admin'
  )
);
create policy "Users can record payments" on payments for insert with check (auth.uid() = user_id);

-- ============================================
-- INDEXES
-- ============================================
create index idx_league_members_league on league_members(league_id);
create index idx_league_members_user on league_members(user_id);
create index idx_seasons_league on seasons(league_id);
create index idx_bets_user on bets(user_id);
create index idx_bets_season on bets(season_id);
create index idx_bet_legs_bet on bet_legs(bet_id);
create index idx_group_bets_season on group_bets(season_id);
create index idx_group_bet_submissions_group on group_bet_submissions(group_bet_id);
create index idx_group_bet_votes_submission on group_bet_votes(submission_id);

-- ============================================
-- HELPER FUNCTIONS
-- ============================================

-- Calculate user stats for a season
create or replace function get_user_season_stats(p_user_id uuid, p_season_id uuid)
returns table (
  total_bets int,
  wins int,
  losses int,
  pending int,
  total_staked numeric,
  total_returned numeric,
  profit numeric,
  roi numeric
) as $$
begin
  return query
  select 
    count(*)::int as total_bets,
    count(*) filter (where status = 'won')::int as wins,
    count(*) filter (where status = 'lost')::int as losses,
    count(*) filter (where status = 'pending')::int as pending,
    coalesce(sum(stake), 0) as total_staked,
    coalesce(sum(actual_return), 0) as total_returned,
    coalesce(sum(actual_return) - sum(stake), 0) as profit,
    case when sum(stake) > 0 then round(((sum(actual_return) - sum(stake)) / sum(stake) * 100)::numeric, 2) else 0 end as roi
  from bets
  where user_id = p_user_id and season_id = p_season_id;
end;
$$ language plpgsql security definer;

-- Get leaderboard for a season
create or replace function get_season_leaderboard(p_season_id uuid)
returns table (
  user_id uuid,
  display_name text,
  avatar_url text,
  total_bets int,
  wins int,
  profit numeric,
  roi numeric
) as $$
begin
  return query
  select 
    p.id as user_id,
    p.display_name,
    p.avatar_url,
    count(b.id)::int as total_bets,
    count(b.id) filter (where b.status = 'won')::int as wins,
    coalesce(sum(b.actual_return) - sum(b.stake), 0) as profit,
    case when sum(b.stake) > 0 then round(((sum(b.actual_return) - sum(b.stake)) / sum(b.stake) * 100)::numeric, 2) else 0 end as roi
  from profiles p
  join league_members lm on lm.user_id = p.id
  join seasons s on s.league_id = lm.league_id
  left join bets b on b.user_id = p.id and b.season_id = s.id
  where s.id = p_season_id
  group by p.id, p.display_name, p.avatar_url
  order by profit desc;
end;
$$ language plpgsql security definer;
