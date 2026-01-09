"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import Link from "next/link";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");

  const supabase = createClient();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    });

    if (error) {
      setError(error.message);
      setLoading(false);
    } else {
      setSent(true);
      setLoading(false);
    }
  };

  if (sent) {
    return (
      <main className="min-h-screen flex flex-col items-center justify-center p-6 safe-top safe-bottom">
        <div className="max-w-md w-full text-center space-y-6">
          <div className="text-5xl">📧</div>
          <h1 className="text-2xl font-bold">check your email</h1>
          <p className="text-[var(--muted)]">
            we sent a magic link to <span className="text-white">{email}</span>
          </p>
          <p className="text-sm text-[var(--muted)]">
            click the link to sign in - no password needed
          </p>
          <button
            onClick={() => setSent(false)}
            className="text-[var(--accent)] text-sm"
          >
            use a different email
          </button>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen flex flex-col items-center justify-center p-6 safe-top safe-bottom">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center space-y-2">
          <Link href="/" className="text-2xl font-bold">
            betmates
          </Link>
          <p className="text-[var(--muted)]">sign in with your email</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <input
              type="email"
              placeholder="your@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              disabled={loading}
            />
          </div>

          {error && (
            <p className="text-[var(--danger)] text-sm text-center">{error}</p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="btn btn-primary w-full disabled:opacity-50"
          >
            {loading ? "sending..." : "send magic link"}
          </button>
        </form>

        <p className="text-center text-sm text-[var(--muted)]">
          we'll email you a link - no password needed
        </p>
      </div>
    </main>
  );
}
