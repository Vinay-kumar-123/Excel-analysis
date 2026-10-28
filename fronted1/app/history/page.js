"use client";

import React, { Suspense } from "react";
import { useSelector } from "react-redux";
import AuthGuard from "@/components/AuthGuard";
import AnalysisHistory from "@/components/AnalysisHistory";

function HistoryPageContent() {
  const user = useSelector((state) => state.auth?.user);
  const userId = String(user?._id || user?.id || "anonymous");

  return (
    <main className="min-h-screen bg-slate-50/50 pt-24 pb-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
      <AnalysisHistory userId={userId} />
    </main>
  );
}

export default function HistoryPage() {
  return (
    <AuthGuard requiredMessage="Please log in to view and manage your saved analysis history.">
      <Suspense
        fallback={
          <div className="min-h-screen flex items-center justify-center">
            <div className="w-10 h-10 border-4 border-amber-500 border-t-transparent rounded-full animate-spin"></div>
          </div>
        }
      >
        <HistoryPageContent />
      </Suspense>
    </AuthGuard>
  );
}
