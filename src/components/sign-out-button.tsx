"use client";

import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";

export function SignOutButton() {
  const router = useRouter();
  const supabase = createClient();

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push("/");
  };

  return (
    <button onClick={handleSignOut} className="w-full py-2 text-sm text-[var(--red)]">
      Sign out
    </button>
  );
}
