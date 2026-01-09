import Link from "next/link";

export default function Home() {
  return (
    <main className="min-h-screen flex flex-col justify-center px-5 py-12 safe-t safe-b">
      <div className="max-w-xs mx-auto w-full">
        <h1 className="text-lg font-medium mb-8">betmates</h1>
        
        <div className="text-sm text-[var(--muted)] space-y-3 mb-10">
          <p>Track bets with friends.</p>
          <p>Weekly buy-in, 6-week seasons, winner takes the pot.</p>
          <p>Screenshot your slips or enter manually.</p>
        </div>

        <Link 
          href="/login" 
          className="block w-full text-center py-2.5 bg-[var(--white)] text-[var(--bg)] rounded text-sm font-medium"
        >
          Sign in
        </Link>
      </div>
    </main>
  );
}
