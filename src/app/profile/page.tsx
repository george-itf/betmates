import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { ProfileForm } from "@/components/profile-form";
import { SignOutButton } from "@/components/sign-out-button";
import { IconArrowLeft } from "@/components/icons";

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
        <Link href="/dashboard" className="flex items-center gap-1 text-[var(--accent)] font-medium text-sm">
          <IconArrowLeft className="w-4 h-4" />
          <span>Back</span>
        </Link>
        <h1 className="font-bold text-sm uppercase tracking-wide">Profile</h1>
        <div className="w-16" />
      </div>

      <div className="p-4 max-w-lg mx-auto space-y-4">
        {/* Email */}
        <div className="card">
          <p className="section-header">Email</p>
          <p className="font-medium">{user.email}</p>
        </div>

        {/* Display name */}
        <div className="card">
          <p className="section-header">Display Name</p>
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
