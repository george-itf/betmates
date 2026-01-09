import { NextResponse } from "next/server";

const API_KEY = process.env.API_FOOTBALL_KEY;
const BASE_URL = "https://v3.football.api-sports.io";

// Popular leagues to show by default
const POPULAR_LEAGUES = [
  39,   // Premier League
  140,  // La Liga
  78,   // Bundesliga
  135,  // Serie A
  61,   // Ligue 1
  2,    // Champions League
  3,    // Europa League
  48,   // FA Cup
];

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const date = searchParams.get("date") || new Date().toISOString().split("T")[0];
  const league = searchParams.get("league");

  if (!API_KEY) {
    return NextResponse.json({ error: "API key not configured" }, { status: 500 });
  }

  try {
    // Build URL - either specific league or all popular leagues
    let url = `${BASE_URL}/fixtures?date=${date}`;
    
    if (league) {
      url += `&league=${league}`;
    } else {
      // Get fixtures for all popular leagues
      url += `&league=${POPULAR_LEAGUES.join("-")}`;
    }

    const response = await fetch(url, {
      headers: {
        "x-apisports-key": API_KEY,
      },
      next: { revalidate: 300 }, // Cache for 5 minutes
    });

    const data = await response.json();

    if (data.errors && Object.keys(data.errors).length > 0) {
      return NextResponse.json({ error: data.errors }, { status: 400 });
    }

    // Transform to simpler format
    const fixtures = (data.response || []).map((fixture: {
      fixture: { id: number; date: string; status: { short: string } };
      league: { id: number; name: string; country: string; logo: string };
      teams: { home: { id: number; name: string; logo: string }; away: { id: number; name: string; logo: string } };
    }) => ({
      id: fixture.fixture.id,
      date: fixture.fixture.date,
      status: fixture.fixture.status.short,
      league: {
        id: fixture.league.id,
        name: fixture.league.name,
        country: fixture.league.country,
        logo: fixture.league.logo,
      },
      home: {
        id: fixture.teams.home.id,
        name: fixture.teams.home.name,
        logo: fixture.teams.home.logo,
      },
      away: {
        id: fixture.teams.away.id,
        name: fixture.teams.away.name,
        logo: fixture.teams.away.logo,
      },
    }));

    // Group by league
    const byLeague: Record<string, typeof fixtures> = {};
    fixtures.forEach((f: { league: { name: string } }) => {
      const leagueName = f.league.name;
      if (!byLeague[leagueName]) byLeague[leagueName] = [];
      byLeague[leagueName].push(f);
    });

    return NextResponse.json({ fixtures, byLeague });
  } catch (error) {
    console.error("Football API error:", error);
    return NextResponse.json({ error: "Failed to fetch fixtures" }, { status: 500 });
  }
}
