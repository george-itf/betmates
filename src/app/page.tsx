import Link from "next/link";

export default function Home() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center p-6 safe-top safe-bottom">
      <div className="max-w-md w-full text-center space-y-8">
        {/* Logo/Title */}
        <div className="space-y-2">
          <h1 className="text-4xl font-bold">betmates</h1>
          <p className="text-[var(--muted)]">
            track bets with your mates
          </p>
        </div>

        {/* Features */}
        <div className="space-y-4 text-left">
          <div className="card">
            <div className="flex items-start gap-3">
              <span className="text-2xl">🏆</span>
              <div>
                <h3 className="font-medium">compete in seasons</h3>
                <p className="text-sm text-[var(--muted)]">
                  6-week leagues, winner takes the pot
                </p>
              </div>
            </div>
          </div>

          <div className="card">
            <div className="flex items-start gap-3">
              <span className="text-2xl">📸</span>
              <div>
                <h3 className="font-medium">screenshot your slips</h3>
                <p className="text-sm text-[var(--muted)]">
                  we'll read them automatically
                </p>
              </div>
            </div>
          </div>

          <div className="card">
            <div className="flex items-start gap-3">
              <span className="text-2xl">🤝</span>
              <div>
                <h3 className="font-medium">group bets</h3>
                <p className="text-sm text-[var(--muted)]">
                  vote on legs, share the winnings
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* CTA */}
        <div className="space-y-3 pt-4">
          <Link href="/login" className="btn btn-primary block text-center">
            get started
          </Link>
          <p className="text-sm text-[var(--muted)]">
            no account needed, just your email
          </p>
        </div>
      </div>
    </main>
  );
}
