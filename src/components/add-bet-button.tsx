"use client";

import Link from "next/link";

interface AddBetButtonProps {
  leagueId: string;
  seasonId: string;
}

export function AddBetButton({ leagueId, seasonId }: AddBetButtonProps) {
  return (
    <div className="fixed bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-[var(--background)] via-[var(--background)] to-transparent safe-bottom">
      <div className="max-w-lg mx-auto">
        <Link
          href={`/league/${leagueId}/bet/new?season=${seasonId}`}
          className="btn btn-primary w-full flex items-center justify-center gap-2 text-center"
        >
          <span className="text-xl">+</span>
          <span>add bet</span>
        </Link>
      </div>
    </div>
  );
}
