import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { ProfileForm } from "@/components/profile-form";
import { SignOutButton } from "@/components/sign-out-button";

export default async function ProfilePage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  return (
    <main className="min-h-screen px-5 py-6 safe-t safe-b">
      <div className="max-w-md mx-auto">
        <header className="flex items-center justify-between mb-6">
          <Link href="/dashboard" className="text-[var(--muted)] text-sm">← Back</Link>
          <h1 className="font-medium">Profile</h1>
          <div className="w-12" />
        </header>

        <div className="mb-6 pb-6 border-b border-[var(--border)]">
          <p className="text-sm text-[var(--muted)]">{user.email}</p>
        </div>

        <ProfileForm userId={user.id} currentName={profile?.display_name || ""} />

        <div className="mt-8 pt-6 border-t border-[var(--border)]">
          <SignOutButton />
        </div>
      </div>
    </main>
  );
}
