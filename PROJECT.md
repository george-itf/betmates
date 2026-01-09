# BetMates - PWA Betting League Tracker

## Project Overview

A PWA for tracking bets with friends in a competitive league format. Think fantasy football but for betting.

### Core Features
- Weekly £5 buy-in tracked per user
- 6-week seasons, winner takes the pot
- Screenshot parsing (Paddy Power) via Claude Vision API
- Leaderboard with real-time rankings
- Group bet feature: submit legs → vote → combined acca → split winnings
- League admin customisation

---

## Tech Stack

| Layer | Choice | Reason |
|-------|--------|--------|
| Frontend | Next.js 14 (App Router) | PWA-ready, good iOS support |
| Backend/DB | Supabase | Auth, Postgres, real-time, storage |
| Screenshot OCR | Claude Vision API | Understands context, not just OCR |
| Hosting | Vercel | Free tier, instant deploys |
| Styling | Tailwind CSS | Fast, dark theme with #2d2d2d |

---

## Build Steps & Status

| Step | Task | Est. Time | Status |
|------|------|-----------|--------|
| 1 | Supabase setup | 1 hr | ✅ DONE |
| 2 | Data model & schema | 2 hrs | ✅ DONE |
| 3 | PWA shell | 1.5 hrs | ✅ DONE |
| 4 | Auth flow | 2 hrs | ✅ DONE |
| 5 | Screenshot parser | 3 hrs | ✅ DONE |
| 6 | Bet submission & history | 3 hrs | ✅ DONE |
| 7 | Leaderboard & pot tracker | 3 hrs | ✅ DONE |
| 8 | Group bet feature | 5 hrs | ✅ DONE |
| 9 | Admin panel | 3 hrs | ✅ DONE |
| 10 | Deploy & polish | 2 hrs | ⏳ NOT STARTED |

---

## Current File Structure

```
betmates/
├── PROJECT.md
├── .env.local (configured)
├── package.json
├── public/
│   ├── manifest.json
│   ├── sw.js
│   └── icons/
├── src/
│   ├── app/
│   │   ├── layout.tsx
│   │   ├── page.tsx (landing)
│   │   ├── globals.css
│   │   ├── login/page.tsx
│   │   ├── auth/callback/route.ts
│   │   ├── dashboard/page.tsx
│   │   ├── profile/page.tsx
│   │   ├── league/[id]/
│   │   │   ├── page.tsx (league view)
│   │   │   ├── settings/page.tsx (admin panel)
│   │   │   ├── bet/new/page.tsx (add bet)
│   │   │   └── group-bet/
│   │   │       ├── page.tsx (list group bets)
│   │   │       └── [groupBetId]/page.tsx (group bet detail)
│   │   └── api/
│   │       └── parse-screenshot/route.ts
│   ├── components/
│   │   ├── league-card.tsx
│   │   ├── create-league-button.tsx
│   │   ├── join-league-button.tsx
│   │   ├── league-header.tsx
│   │   ├── leaderboard.tsx
│   │   ├── recent-bets.tsx
│   │   ├── add-bet-button.tsx
│   │   ├── create-group-bet-button.tsx
│   │   ├── submit-legs-form.tsx
│   │   ├── voting-panel.tsx
│   │   ├── group-bet-result.tsx
│   │   ├── group-bet-admin-controls.tsx
│   │   ├── league-settings-form.tsx
│   │   ├── members-list.tsx
│   │   ├── season-controls.tsx
│   │   ├── danger-zone.tsx
│   │   ├── copy-button.tsx
│   │   ├── regenerate-code-button.tsx
│   │   ├── profile-form.tsx
│   │   └── sign-out-button.tsx
│   ├── lib/
│   │   └── supabase/
│   │       ├── client.ts
│   │       ├── server.ts
│   │       └── middleware.ts
│   └── middleware.ts
└── supabase/
    ├── schema.sql (applied)
    └── group_bet_functions.sql (NEEDS APPLYING)
```

---

## Progress Log

### Session 1 - 2025-01-09
- Created project, data model, schema
- Scaffolded Next.js with PWA + auth

### Session 2 - 2025-01-09
- Applied schema, dashboard, league view
- Screenshot parsing, bet submission

### Session 3 - 2025-01-09
- Complete group bet feature
- Submissions, voting, finalization, settlement

### Session 4 - 2025-01-09 (current)

**Completed:**
1. Full admin panel with:
   - League settings (name, buy-in, season length)
   - Group bet defaults (buy-in, legs per user, winning legs)
   - Invite code management (view, copy, regenerate)
   - Member management (view, promote, demote, kick)
   - Season controls (view current, end season, declare winner, start new)
   - Danger zone (delete league with confirmation)
2. Profile page with:
   - Edit display name
   - Sign out button

---

## NEXT ACTIONS

### Before testing:
1. **Apply group_bet_functions.sql** to Supabase:
   - Go to SQL Editor → paste contents → Run

### Ready for deploy:
1. Push to GitHub
2. Connect to Vercel
3. Add environment variables
4. Deploy!

---

## Admin Panel Features

### League Settings
- Edit league name
- Change weekly buy-in amount
- Change season length
- Set group bet defaults (buy-in, legs per user, winning count)

### Invite Code
- View current code
- Copy to clipboard
- Regenerate new code (invalidates old)

### Members
- View all members with join date
- See who is admin
- Promote member to admin
- Demote admin to member (if multiple admins)
- Kick member from league

### Season
- View current season info (pot, dates, time remaining)
- End season and declare winner
- Start new season
- View past seasons with winners

### Danger Zone
- Delete league permanently
- Requires typing league name to confirm

---

## Environment Variables

```env
# Supabase (✅ configured)
NEXT_PUBLIC_SUPABASE_URL=https://wtgjziuwwmpuzjrxqitj.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGc...

# Claude API (✅ configured)
ANTHROPIC_API_KEY=sk-ant-...
```

---

## Complete Feature List

### User Features
- [x] Sign up / sign in with magic link
- [x] Edit profile (display name)
- [x] Sign out
- [x] Create league
- [x] Join league with invite code
- [x] View dashboard with all leagues
- [x] View league (leaderboard, recent bets, pot)
- [x] Add bet via screenshot
- [x] Add bet manually
- [x] Submit legs to group bet
- [x] Vote on group bet legs

### Admin Features
- [x] Edit league settings
- [x] Manage invite code
- [x] View/promote/demote/kick members
- [x] End season and declare winner
- [x] Start new season
- [x] Create group bets
- [x] Transition group bet status
- [x] Settle group bets (won/lost)
- [x] Delete league

---

## Testing Checklist

- [ ] Sign up with email
- [ ] Edit display name
- [ ] Create a league
- [ ] Share invite code
- [ ] Join league with code
- [ ] Add bet via screenshot
- [ ] Add bet manually
- [ ] View leaderboard
- [ ] Create group bet (admin)
- [ ] Submit legs to group bet
- [ ] Vote on legs
- [ ] Finalize group bet
- [ ] Settle group bet
- [ ] Edit league settings (admin)
- [ ] Promote/demote members (admin)
- [ ] Kick member (admin)
- [ ] End season (admin)
- [ ] Start new season (admin)
- [ ] Sign out
