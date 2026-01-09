import Link from "next/link";

export default function Home() {
  return (
    <main className="min-h-screen flex flex-col safe-t safe-b">
      <div className="flex-1 flex flex-col items-center justify-center px-5 py-10">
        <div className="w-full max-w-sm">
          {/* Logo */}
          <div className="text-center mb-8">
            <h1 className="text-xl font-bold">MatchPool</h1>
            <p className="text-[var(--text-secondary)] mt-1 text-sm">Track bets with your mates</p>
          </div>

          {/* Features */}
          <div className="card mb-6">
            <div className="list-item">
              <span className="text-[var(--text-secondary)]">Weekly buy-in</span>
              <span className="font-medium">£5/week</span>
            </div>
            <div className="list-item">
              <span className="text-[var(--text-secondary)]">Season length</span>
              <span className="font-medium">6 weeks</span>
            </div>
            <div className="list-item">
              <span className="text-[var(--text-secondary)]">Winner takes</span>
              <span className="font-medium text-[var(--accent)]">The pot</span>
            </div>
          </div>

          <Link href="/login" className="btn btn-primary w-full">
            Get started
          </Link>
          
          <p className="text-center text-xs text-[var(--text-secondary)] mt-3">
            Free to use. No card required.
          </p>
        </div>
      </div>
    </main>
  );
}
