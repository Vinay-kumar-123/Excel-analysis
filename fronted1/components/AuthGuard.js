"use client";
import React, { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { useDispatch } from "react-redux";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import { Lock, LogIn, ArrowRight } from "lucide-react";
import { toast } from "react-toastify";
import { logoutUser, setUser } from "@/redux/authSlice";
import api from "@/lib/api";

export default function AuthGuard({ children, requiredMessage }) {
  const router = useRouter();
  const pathname = usePathname();
  const dispatch = useDispatch();
  const { user } = useSelector((state) => state.auth);
  const [sessionStatus, setSessionStatus] = useState("checking");
  const [retryCount, setRetryCount] = useState(0);

  const defaultMessage =
    requiredMessage ||
    "Please log in to upload your data, visualize it, and access AI analytics.";

  useEffect(() => {
    let active = true;
    api.get("/api/v1/user/me")
      .then((response) => {
        if (!active) return;
        dispatch(setUser(response.data.user));
        setSessionStatus("authenticated");
      })
      .catch((error) => {
        if (!active) return;
        if (error.response?.status === 401) {
          dispatch(logoutUser());
          setSessionStatus("unauthenticated");
        } else {
          setSessionStatus("unavailable");
        }
      });
    return () => {
      active = false;
    };
  }, [dispatch, retryCount]);

  useEffect(() => {
    if (sessionStatus === "unauthenticated") {
      toast.info(defaultMessage, {
        toastId: "auth-guard-redirect", // Prevent duplicate toasts
      });
      // Redirect to login with the intended destination
      const redirectUrl = `/login?redirect=${encodeURIComponent(pathname)}`;
      router.replace(redirectUrl);
    }
  }, [sessionStatus, pathname, router, defaultMessage]);

  if (sessionStatus === "checking") {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-6 pt-24">
        <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mb-3"></div>
        <p className="text-xs text-gray-500 font-medium">Verifying authentication session...</p>
      </div>
    );
  }

  // If not authenticated, render clear login-required screen while redirecting
  if (sessionStatus === "unavailable" && !user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6 pt-20">
        <div className="max-w-md rounded-2xl border border-amber-200 bg-white p-8 text-center shadow-sm">
          <h2 className="text-lg font-bold text-gray-900">Unable to verify your session</h2>
          <p className="mt-2 text-sm text-gray-600">The server could not be reached. Your login state has not been cleared.</p>
          <button
            type="button"
            onClick={() => {
              setSessionStatus("checking");
              setRetryCount((count) => count + 1);
            }}
            className="mt-5 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (sessionStatus === "unauthenticated") {
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

  // Keep persisted UI usable after transient outages; the API session remains unverified.
  return <>{children}</>;
}
