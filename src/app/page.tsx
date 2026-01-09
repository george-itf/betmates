import Link from "next/link";

export default function Home() {
  return (
    <main className="min-h-screen flex flex-col safe-t safe-b">
      <div className="flex-1 flex flex-col items-center justify-center px-6 py-12">
        <div className="w-full max-w-sm">
          {/* Logo */}
          <div className="text-center mb-10">
            <h1 className="text-2xl font-bold tracking-tight">MATCHPOOL</h1>
            <p className="text-[var(--text-secondary)] mt-2">Track bets with your mates</p>
          </div>

          {/* Features */}
          <div className="card mb-8">
            <div className="list-item">
              <span className="text-[var(--text-secondary)]">Weekly buy-in</span>
              <span className="font-semibold">£5/week</span>
            </div>
            <div className="list-item">
              <span className="text-[var(--text-secondary)]">Season length</span>
              <span className="font-semibold">6 weeks</span>
            </div>
            <div className="list-item">
              <span className="text-[var(--text-secondary)]">Winner takes</span>
              <span className="font-semibold text-[var(--accent)]">The pot</span>
            </div>
          </div>

          {/* CTA */}
          <Link href="/login" className="btn btn-primary w-full">
            Get Started
          </Link>
          
          <p className="text-center text-sm text-[var(--text-secondary)] mt-4">
            Free to use. No card required.
          </p>
        </div>
      </div>
    </main>
  );
}
