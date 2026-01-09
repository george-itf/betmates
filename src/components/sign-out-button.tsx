"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";

export function SignOutButton() {
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  const handleSignOut = async () => {
    setLoading(true);
    try {
      await supabase.auth.signOut();
      router.push("/");
      router.refresh();
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      onClick={handleSignOut}
      disabled={loading}
      className="btn w-full text-[var(--danger)]"
    >
      {loading ? "signing out..." : "sign out"}
    </button>
  );
}
