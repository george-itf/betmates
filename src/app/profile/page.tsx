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
    <main className="min-h-screen bg-[var(--bg)] safe-t safe-b">
      {/* Header */}
      <div className="header flex items-center justify-between">
        <Link href="/dashboard" className="text-[var(--accent)] font-medium">← Back</Link>
        <h1 className="font-bold">Profile</h1>
        <div className="w-16" />
      </div>

      <div className="p-4 max-w-lg mx-auto">
        {/* Email */}
        <div className="card mb-4">
          <p className="text-sm text-[var(--text-secondary)]">Email</p>
          <p className="font-medium">{user.email}</p>
        </div>

        {/* Display name */}
        <div className="card mb-4">
          <h3 className="font-semibold mb-4">Display name</h3>
          <ProfileForm userId={user.id} currentName={profile?.display_name || ""} />
        </div>

        {/* Sign out */}
        <div className="card">
          <SignOutButton />
        </div>
      </div>
    </main>
  );
}
