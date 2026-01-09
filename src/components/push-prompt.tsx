"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { IconX } from "@/components/icons";

// Bell icon for notifications
function IconBell({ className = "icon" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
      <path d="M13.73 21a2 2 0 0 1-3.46 0" />
    </svg>
  );
}

export function PushPrompt() {
  const [show, setShow] = useState(false);
  const [loading, setLoading] = useState(false);
  const supabase = createClient();

  useEffect(() => {
    // Check if push notifications are supported
    if (!("serviceWorker" in navigator) || !("PushManager" in window)) {
      return;
    }

    // Check if already subscribed
    const checkSubscription = async () => {
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.getSubscription();

      // Check localStorage for dismissed state
      const dismissed = localStorage.getItem("push-prompt-dismissed");
      if (dismissed) return;

      // Show prompt if not subscribed
      if (!subscription) {
        setShow(true);
      }
    };

    // Delay the check slightly to avoid flash
    const timeout = setTimeout(checkSubscription, 2000);
    return () => clearTimeout(timeout);
  }, []);

  const subscribe = async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Request notification permission
      const permission = await Notification.requestPermission();
      if (permission !== "granted") {
        setShow(false);
        localStorage.setItem("push-prompt-dismissed", "true");
        return;
      }

      // Get push subscription
      const registration = await navigator.serviceWorker.ready;

      // Generate VAPID public key - this should come from env var in production
      // For now we'll use a placeholder that would need to be set up
      const vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;

      if (!vapidPublicKey) {
        console.warn("VAPID public key not configured");
        setShow(false);
        return;
      }

      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(vapidPublicKey),
      });

      const subscriptionJson = subscription.toJSON();

      // Save to database
      await supabase.from("push_subscriptions").upsert({
        user_id: user.id,
        endpoint: subscriptionJson.endpoint,
        p256dh: subscriptionJson.keys?.p256dh || "",
        auth: subscriptionJson.keys?.auth || "",
      }, {
        onConflict: "user_id,endpoint",
      });

      setShow(false);
    } catch (error) {
      console.error("Push subscription error:", error);
    } finally {
      setLoading(false);
    }
  };

  const dismiss = () => {
    localStorage.setItem("push-prompt-dismissed", "true");
    setShow(false);
  };

  if (!show) return null;

  return (
    <div className="fixed bottom-20 left-4 right-4 z-50 max-w-lg mx-auto">
      <div className="bg-[var(--surface)] border border-[var(--border)] rounded p-4 shadow-lg">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 bg-[var(--accent)] rounded flex items-center justify-center flex-shrink-0">
            <IconBell className="w-5 h-5 text-white" />
          </div>
          <div className="flex-1">
            <p className="font-semibold text-sm">Enable Notifications</p>
            <p className="text-xs text-[var(--text-secondary)] mt-1">
              Get notified for bet deadlines, settlements, and league activity
            </p>
            <div className="flex gap-2 mt-3">
              <button
                onClick={dismiss}
                className="btn btn-secondary text-xs py-2 px-3"
              >
                NOT NOW
              </button>
              <button
                onClick={subscribe}
                disabled={loading}
                className="btn btn-primary text-xs py-2 px-3"
              >
                {loading ? "..." : "ENABLE"}
              </button>
            </div>
          </div>
          <button onClick={dismiss} className="text-[var(--text-secondary)]">
            <IconX className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
}

// Helper function to convert VAPID key
function urlBase64ToUint8Array(base64String: string) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding)
    .replace(/-/g, "+")
    .replace(/_/g, "/");
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}
