"use client";
import React, { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import { Lock, LogIn, ArrowRight } from "lucide-react";
import { toast } from "react-toastify";

export default function AuthGuard({ children, requiredMessage }) {
  const router = useRouter();
  const pathname = usePathname();
  const { user } = useSelector((state) => state.auth);

  // Track whether Redux client-side rehydration has occurred
  const [isHydrated, setIsHydrated] = useState(false);

  useEffect(() => {
    // Redux Persist rehydrates synchronously on client mount
    setIsHydrated(true);
  }, []);

  const defaultMessage =
    requiredMessage ||
    "Please log in to upload your data, visualize it, and access AI analytics.";

  useEffect(() => {
    if (isHydrated && !user) {
      toast.info(defaultMessage, {
        toastId: "auth-guard-redirect", // Prevent duplicate toasts
      });
      // Redirect to login with the intended destination
      const redirectUrl = `/login?redirect=${encodeURIComponent(pathname)}`;
      router.replace(redirectUrl);
    }
  }, [isHydrated, user, pathname, router, defaultMessage]);

  // While waiting for client hydration, render a clean loading state to prevent flash of content
  if (!isHydrated) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-6 pt-24">
        <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mb-3"></div>
        <p className="text-xs text-gray-500 font-medium">Verifying authentication session...</p>
      </div>
    );
  }

  // If not authenticated, render clear login-required screen while redirecting
  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4 pt-20">
        <div className="max-w-md w-full bg-white rounded-3xl p-8 shadow-xl border border-gray-100 text-center">
          <div className="w-16 h-16 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-5 shadow-sm">
            <Lock className="w-8 h-8" />
          </div>

          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Authentication Required
          </h2>

          <p className="text-gray-600 text-sm leading-relaxed mb-6 font-medium">
            {defaultMessage}
          </p>

          <Link
            href={`/login?redirect=${encodeURIComponent(pathname)}`}
            className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl shadow-md transition cursor-pointer"
          >
            <LogIn className="w-4 h-4" />
            Log In to Continue
            <ArrowRight className="w-4 h-4" />
          </Link>

          <div className="mt-4 text-xs text-gray-500">
            Don't have an account?{" "}
            <Link href="/signup" className="text-blue-600 font-semibold hover:underline">
              Sign up for free
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Authenticated: Render children
  return <>{children}</>;
}
