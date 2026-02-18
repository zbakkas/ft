"use client";

import { getGatewayUrl } from "@/lib/gateway";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useState } from "react";

export default function ResetPasswordPage() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token") || "";
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [message, setMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage("");

    if (!token) {
      setMessage("Invalid reset link. Please request a new one.");
      return;
    }

    if (password.length < 8) {
      setMessage("Password must be at least 8 characters.");
      return;
    }

    if (password !== confirmPassword) {
      setMessage("Passwords do not match.");
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch(getGatewayUrl("/api/v1/auth/reset-password"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ token, password }),
      });

      const data = await res.json();
      if (!res.ok) {
        setMessage(data?.code || "An error occurred. Please try again.");
        return;
      }

      setIsSuccess(true);
      setMessage("Password reset successful. You can sign in now.");
      setPassword("");
      setConfirmPassword("");
    } catch (error) {
      setMessage("An error occurred. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      className="min-h-screen w-full bg-black flex items-center justify-center px-4 py-10"
      style={{ fontFamily: "'Orbitron', 'Courier New', monospace" }}
    >
      <div className="w-full max-w-lg">
        <div className="relative overflow-hidden border-4 border-gray-600 bg-gradient-to-br from-gray-900 to-black p-6 sm:p-8 shadow-[0_0_30px_rgba(255,255,255,0.12)]">
          <div className="pointer-events-none absolute inset-0 opacity-10">
            <div
              className="w-full h-full"
              style={{
                backgroundImage:
                  "repeating-linear-gradient(45deg, transparent, transparent 10px, rgba(255,255,255,0.12) 10px, rgba(255,255,255,0.12) 12px)",
              }}
            />
          </div>

          <div className="relative">
            <h1 className="text-2xl sm:text-3xl font-semibold text-white">Reset Password</h1>
            <p className="text-sm text-gray-300 mt-2">
              Enter a new password to regain access to your account.
            </p>

            {message && (
              <div className="mt-4 border border-gray-600 rounded-lg px-3 py-2 bg-gray-900 text-gray-200">
                {message}
              </div>
            )}

            {!isSuccess && (
              <form onSubmit={handleSubmit} className="space-y-4 mt-6">
                <input
                  type="password"
                  placeholder="New password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full border-2 border-gray-600 bg-black/60 text-white rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-white"
                />
                <input
                  type="password"
                  placeholder="Confirm new password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full border-2 border-gray-600 bg-black/60 text-white rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-white"
                />
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full border-2 border-white/70 hover:border-white text-white rounded-lg px-3 py-2 bg-black transition-all duration-200 hover:shadow-[0_0_18px_rgba(255,255,255,0.35)] disabled:opacity-60"
                >
                  {isSubmitting ? "Resetting..." : "Reset Password"}
                </button>
              </form>
            )}

            <div className="mt-6 text-center">
              <Link href="/" className="text-gray-300 hover:text-white hover:underline">
                Return to home
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
