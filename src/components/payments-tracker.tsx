"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";

interface Member {
  user_id: string;
  profiles: { display_name: string };
}

interface Payment {
  user_id: string;
  status: string;
}

export function PaymentsTracker({ seasonId, weekNumber, members, payments, buyin }: {
  seasonId: string;
  weekNumber: number;
  members: Member[];
  payments: Payment[];
  buyin: number;
}) {
  const [loading, setLoading] = useState<string | null>(null);
  const router = useRouter();
  const supabase = createClient();

  const paidUserIds = new Set(payments.filter(p => p.status === "paid").map(p => p.user_id));
  const paidCount = paidUserIds.size;
  const totalExpected = members.length * buyin;
  const totalPaid = paidCount * buyin;

  const togglePayment = async (userId: string) => {
    setLoading(userId);
    const isPaid = paidUserIds.has(userId);

    if (isPaid) {
      // Remove payment
      await supabase
        .from("payments")
        .delete()
        .eq("season_id", seasonId)
        .eq("user_id", userId)
        .eq("week_number", weekNumber);
    } else {
      // Add payment
      await supabase
        .from("payments")
        .insert({
          season_id: seasonId,
          user_id: userId,
          week_number: weekNumber,
          amount: buyin,
          status: "paid",
        });
      
      // Update pot amount
      const { data: season } = await supabase
        .from("seasons")
        .select("pot_amount")
        .eq("id", seasonId)
        .single();
      
      await supabase
        .from("seasons")
        .update({ pot_amount: (season?.pot_amount || 0) + buyin })
        .eq("id", seasonId);
    }

    router.refresh();
    setLoading(null);
  };

  return (
    <div>
      <div className="flex justify-between text-sm py-2 border-y border-[var(--border)] mb-3">
        <span>{paidCount}/{members.length} paid</span>
        <span className="text-[var(--green)]">£{totalPaid}/£{totalExpected}</span>
      </div>

      <ul className="border-t border-[var(--border)]">
        {members.map((m) => {
          const isPaid = paidUserIds.has(m.user_id);
          return (
            <li key={m.user_id} className="flex items-center justify-between py-2 border-b border-[var(--border)] text-sm">
              <span>{m.profiles?.display_name}</span>
              <button
                onClick={() => togglePayment(m.user_id)}
                disabled={loading === m.user_id}
                className={`px-3 py-1 rounded text-xs ${
                  isPaid 
                    ? "bg-[var(--green)] text-[var(--bg)]" 
                    : "border border-[var(--border)]"
                }`}
              >
                {loading === m.user_id ? "..." : isPaid ? "Paid" : "Mark paid"}
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
