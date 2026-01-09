import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { ProfileForm } from "@/components/profile-form";
import { SignOutButton } from "@/components/sign-out-button";

export default async function ProfilePage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  return (
    <main className="min-h-screen p-4 safe-top safe-bottom">
      <div className="max-w-lg mx-auto space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <Link href="/dashboard" className="text-[var(--muted)]">
            ← back
          </Link>
          <h1 className="font-bold">profile</h1>
          <div className="w-12" />
        </div>

        {/* Avatar */}
        <div className="flex flex-col items-center gap-4">
          <div className="w-24 h-24 rounded-full bg-[var(--card)] flex items-center justify-center text-3xl font-bold">
            {profile?.display_name?.[0]?.toUpperCase() || "?"}
          </div>
          <p className="text-[var(--muted)]">{user.email}</p>
        </div>

        {/* Profile Form */}
        <ProfileForm
          userId={user.id}
          currentName={profile?.display_name || ""}
        />

        {/* Sign Out */}
        <div className="pt-4 border-t border-[var(--border)]">
          <SignOutButton />
        </div>
      </div>
    </main>
  );
}
