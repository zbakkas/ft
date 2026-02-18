"use client";

import { getGatewayUrl } from "@/lib/gateway";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";

export default function VerifyEmailPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams.get("token") || "";
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [message, setMessage] = useState("Verifying your email...");
  const [redirectSeconds, setRedirectSeconds] = useState(4);

  useEffect(() => {
    const verify = async () => {
      if (!token) {
        setStatus("error");
        setMessage("Invalid verification link. Please request a new one.");
        return;
      }

      setStatus("loading");
      try {
        const res = await fetch(
          getGatewayUrl(`/api/v1/auth/otp/verify?token=${token}`),
          {
            method: "GET",
            credentials: "include",
          }
        );
        const data = await res.json();
        if (!res.ok) {
          setStatus("error");
          setMessage(data?.code || "Verification failed. Please try again.");
          return;
        }
        setStatus("success");
        setMessage("Email verified successfully. You can sign in now.");
      } catch (error) {
        setStatus("error");
        setMessage("Verification failed. Please try again.");
      }
    };

    verify();
  }, [token]);

  useEffect(() => {
    if (status !== "success") return undefined;
    setRedirectSeconds(4);
    const intervalId = setInterval(() => {
      setRedirectSeconds((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    const timeoutId = setTimeout(() => {
      router.push("/");
    }, 4000);

    return () => {
      clearInterval(intervalId);
      clearTimeout(timeoutId);
    };
  }, [status, router]);

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
            <h1 className="text-2xl sm:text-3xl font-semibold text-white">Email Verification</h1>
            <p className="text-sm text-gray-300 mt-2">{message}</p>
            {status === "success" && (
              <p className="text-xs text-gray-400 mt-2">
                Redirecting you to home in {redirectSeconds}s...
              </p>
            )}

            <div className="mt-6 text-center">
              <Link href="/" className="text-gray-300 hover:text-white hover:underline">
                Return to home
              </Link>
            </div>

            {status === "error" && (
              <div className="mt-4 text-center">
                <Link href="/" className="text-blue-300 hover:text-blue-200 hover:underline">
                  Request a new verification email
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
