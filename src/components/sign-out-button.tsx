"use client";

import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { IconLogOut } from "@/components/icons";

export function SignOutButton() {
  const router = useRouter();
  const supabase = createClient();

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push("/");
  };

  return (
    <button onClick={handleSignOut} className="btn btn-danger w-full">
      <IconLogOut className="w-4 h-4" />
      <span>Sign Out</span>
    </button>
  );
}
