"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import Spinner from "@/components/ui/Spinner";

export default function AdminLoginPage() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const res = await fetch("/api/admin/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password }),
    });

    if (!res.ok) {
      toast.error("Invalid password");
      setLoading(false);
      return;
    }

    router.push("/admin");
  };

  return (
    <div className="min-h-screen bg-[var(--background)] flex items-center justify-center px-4 pb-[env(safe-area-inset-bottom)]">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          {/* Brand icon */}
          <div className="w-16 h-16 rounded-2xl bg-teal/10 flex items-center justify-center mx-auto mb-4">
            <svg
              className="w-8 h-8 text-teal"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth={1.5}
            >
              <rect x="2" y="4" width="20" height="16" rx="2" />
              <path d="M2 8h20" />
              <rect x="14" y="10" width="5" height="4" rx="0.5" strokeDasharray="2 1" />
              <line x1="4" y1="14" x2="10" y2="14" />
              <line x1="4" y1="16.5" x2="8" y2="16.5" />
            </svg>
          </div>
          <h1 className="font-heading text-3xl font-medium text-teal">
            PostYourCard
          </h1>
          <p className="text-sand-600 text-base mt-1">Admin access</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-sand-600 mb-1.5 uppercase tracking-wide">
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoFocus
              className="w-full px-4 py-3 rounded-xl border-2 border-sand-200 bg-white text-gray-900
                placeholder:text-sand-400 focus:outline-none focus:border-teal text-sm
                transition-colors min-h-[48px]"
              placeholder="Enter admin password"
            />
          </div>

          <button
            type="submit"
            disabled={loading || !password}
            className="w-full py-3.5 px-6 rounded-xl font-medium text-white bg-teal transition-all
              disabled:opacity-60 disabled:cursor-not-allowed
              enabled:hover:bg-teal-600 enabled:active:scale-[0.98] enabled:shadow-lg enabled:shadow-teal/20
              flex items-center justify-center gap-2 min-h-[48px]"
          >
            {loading && <Spinner className="w-4 h-4" />}
            {loading ? "Signing in..." : "Sign in"}
          </button>
        </form>

        <p className="text-center text-base text-sand-400 mt-8">
          PostYourCard Admin Panel
        </p>
      </div>
    </div>
  );
}
