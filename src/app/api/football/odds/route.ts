import { NextResponse } from "next/server";

const API_KEY = process.env.API_FOOTBALL_KEY;
const BASE_URL = "https://v3.football.api-sports.io";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const fixtureId = searchParams.get("fixture");

  if (!fixtureId) {
    return NextResponse.json({ error: "Fixture ID required" }, { status: 400 });
  }

  if (!API_KEY) {
    return NextResponse.json({ error: "API key not configured" }, { status: 500 });
  }

  try {
    const response = await fetch(`${BASE_URL}/odds?fixture=${fixtureId}`, {
      headers: {
        "x-apisports-key": API_KEY,
      },
      next: { revalidate: 300 }, // Cache for 5 minutes
    });

    const data = await response.json();

    if (data.errors && Object.keys(data.errors).length > 0) {
      return NextResponse.json({ error: data.errors }, { status: 400 });
    }

    // Get first bookmaker's odds (usually Bet365 or similar)
    const oddsData = data.response?.[0];
    if (!oddsData) {
      return NextResponse.json({ odds: [], markets: [] });
    }

    // Transform odds into usable format
    const bookmaker = oddsData.bookmakers?.[0];
    if (!bookmaker) {
      return NextResponse.json({ odds: [], markets: [] });
    }

    const markets = bookmaker.bets.map((bet: {
      id: number;
      name: string;
      values: Array<{ value: string; odd: string }>;
    }) => ({
      id: bet.id,
      name: bet.name,
      options: bet.values.map((v) => ({
        label: v.value,
        odds: parseFloat(v.odd),
        oddsFractional: decimalToFractional(parseFloat(v.odd)),
      })),
    }));

    // Filter to most popular markets
    const popularMarkets = ["Match Winner", "Goals Over/Under", "Both Teams Score", "Double Chance"];
    const filteredMarkets = markets.filter((m: { name: string }) => 
      popularMarkets.some(pm => m.name.includes(pm))
    );

    return NextResponse.json({ 
      bookmaker: bookmaker.name,
      markets: filteredMarkets.length > 0 ? filteredMarkets : markets.slice(0, 5),
      allMarkets: markets,
    });
  } catch (error) {
    console.error("Football API odds error:", error);
    return NextResponse.json({ error: "Failed to fetch odds" }, { status: 500 });
  }
}

// Convert decimal odds to fractional
function decimalToFractional(decimal: number): string {
  if (decimal <= 1) return "1/1";
  
  const profit = decimal - 1;
  
  // Common fractions
  const fractions: [number, string][] = [
    [0.1, "1/10"], [0.2, "1/5"], [0.25, "1/4"], [0.33, "1/3"], [0.4, "2/5"], [0.5, "1/2"],
    [0.57, "4/7"], [0.6, "3/5"], [0.67, "2/3"], [0.73, "8/11"], [0.8, "4/5"], [0.91, "10/11"],
    [1, "1/1"], [1.1, "11/10"], [1.2, "6/5"], [1.33, "4/3"], [1.4, "7/5"], [1.5, "3/2"],
    [1.6, "8/5"], [1.67, "5/3"], [1.8, "9/5"], [2, "2/1"], [2.25, "9/4"], [2.5, "5/2"],
    [2.75, "11/4"], [3, "3/1"], [3.5, "7/2"], [4, "4/1"], [4.5, "9/2"], [5, "5/1"],
    [6, "6/1"], [7, "7/1"], [8, "8/1"], [9, "9/1"], [10, "10/1"], [12, "12/1"],
    [14, "14/1"], [16, "16/1"], [20, "20/1"], [25, "25/1"], [33, "33/1"], [50, "50/1"],
  ];
  
  // Find closest fraction
  let closest = fractions[0];
  let minDiff = Math.abs(profit - fractions[0][0]);
  
  for (const [val, frac] of fractions) {
    const diff = Math.abs(profit - val);
    if (diff < minDiff) {
      minDiff = diff;
      closest = [val, frac];
    }
  }
  
  return closest[1];
}
