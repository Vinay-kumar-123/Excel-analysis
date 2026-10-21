"use client";

import Link from "next/link";
import React from "react";
import { useSelector } from "react-redux";

const HeroSection = () => {
  const { user } = useSelector((state) => state.auth);
  const uploadHref = user ? "/upload" : "/login?redirect=/upload";

  return (
    <section className="relative pt-32 pb-24 px-6 overflow-hidden">
      {/* Subtle radial background */}
      <div className="absolute inset-0 bg-gradient-to-br from-slate-50 via-blue-50/40 to-indigo-50/60 -z-10" />
      <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-blue-100/30 rounded-full blur-3xl -z-10 translate-x-1/3 -translate-y-1/3" />
      <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-indigo-100/30 rounded-full blur-3xl -z-10 -translate-x-1/3 translate-y-1/3" />

      <div className="max-w-5xl mx-auto text-center">
        {/* Badge */}
        <div className="inline-flex items-center gap-2 bg-blue-50 border border-blue-100 text-blue-700 text-xs font-semibold px-4 py-1.5 rounded-full mb-8 tracking-wide uppercase">
          <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse inline-block" />
          Powered by Gemini AI
        </div>

        {/* Headline */}
        <h1 className="text-5xl sm:text-6xl font-extrabold text-slate-900 leading-tight tracking-tight mb-6">
          Turn Your Excel Data
          <br />
          <span className="bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 bg-clip-text text-transparent">
            Into Visual Intelligence
          </span>
        </h1>

        {/* Subheading */}
        <p className="text-lg sm:text-xl text-slate-500 max-w-2xl mx-auto leading-relaxed mb-10">
          Upload any <span className="font-semibold text-slate-700">.xls</span> or{" "}
          <span className="font-semibold text-slate-700">.xlsx</span> file and instantly get
          interactive 2D &amp; 3D charts, AI-powered summaries, and exportable reports.
        </p>

        {/* CTA Buttons */}
        <div className="flex flex-wrap justify-center gap-4">
          <Link href={uploadHref}>
            <button className="inline-flex items-center gap-2 px-7 py-3.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold shadow-lg shadow-blue-200 hover:shadow-blue-300 transition-all duration-200 cursor-pointer text-base">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
              </svg>
              Upload &amp; Analyze
            </button>
          </Link>
          {!user && (
            <Link href="/signup">
              <button className="inline-flex items-center gap-2 px-7 py-3.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-semibold shadow-sm transition-all duration-200 cursor-pointer text-base">
                Get Started Free
                <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </Link>
          )}
        </div>

        {/* Trust line */}
        <p className="mt-8 text-sm text-slate-400">
          No credit card required &nbsp;·&nbsp; Instant results &nbsp;·&nbsp; Export in seconds
        </p>
      </div>

      {/* Hero dashboard mockup */}
      <div className="mt-16 max-w-4xl mx-auto">
        <div className="bg-white border border-slate-200 rounded-2xl shadow-2xl shadow-slate-200/60 overflow-hidden">
          {/* Window chrome */}
          <div className="flex items-center gap-2 px-4 py-3 bg-slate-50 border-b border-slate-200">
            <span className="w-3 h-3 rounded-full bg-red-400" />
            <span className="w-3 h-3 rounded-full bg-yellow-400" />
            <span className="w-3 h-3 rounded-full bg-green-400" />
            <span className="ml-3 text-xs text-slate-400 font-mono">excel-analytics.app / dashboard</span>
          </div>

          {/* Mock dashboard content */}
          <div className="p-6 grid grid-cols-3 gap-4">
            {/* Stat cards */}
            {[
              { label: "Total Revenue", value: "$128,400", change: "+14.2%", color: "text-emerald-600", bg: "bg-emerald-50" },
              { label: "Records Processed", value: "48,239", change: "+6.8%", color: "text-blue-600", bg: "bg-blue-50" },
              { label: "Profit Margin", value: "38.5%", change: "+2.1%", color: "text-purple-600", bg: "bg-purple-50" },
            ].map((card) => (
              <div key={card.label} className="bg-white border border-slate-100 rounded-xl p-4 shadow-sm">
                <p className="text-xs text-slate-400 font-medium mb-1">{card.label}</p>
                <p className="text-2xl font-bold text-slate-800">{card.value}</p>
                <span className={`text-xs font-semibold ${card.color} ${card.bg} px-2 py-0.5 rounded-full mt-1 inline-block`}>
                  {card.change}
                </span>
              </div>
            ))}

            {/* Mini bar chart */}
            <div className="col-span-2 bg-white border border-slate-100 rounded-xl p-4 shadow-sm">
              <p className="text-xs text-slate-400 font-medium mb-3">Monthly Sales</p>
              <div className="flex items-end gap-2 h-16">
                {[40, 65, 50, 80, 55, 90, 70, 85, 60, 95, 75, 100].map((h, i) => (
                  <div
                    key={i}
                    className="flex-1 rounded-t-sm bg-gradient-to-t from-blue-500 to-indigo-400 opacity-80"
                    style={{ height: `${h}%` }}
                  />
                ))}
              </div>
              <div className="flex justify-between mt-1">
                {["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"].map((m) => (
                  <span key={m} className="text-[9px] text-slate-300">{m}</span>
                ))}
              </div>
            </div>

            {/* AI insight snippet */}
            <div className="bg-gradient-to-br from-indigo-50 to-purple-50 border border-indigo-100 rounded-xl p-4 shadow-sm">
              <div className="flex items-center gap-1.5 mb-2">
                <span className="w-2 h-2 rounded-full bg-purple-500 animate-pulse" />
                <p className="text-xs font-semibold text-purple-700">AI Insight</p>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed">
                Revenue peaked in Q4. November shows a{" "}
                <span className="font-semibold text-indigo-700">23% uplift</span> — consider
                increasing inventory ahead of the holiday cycle.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
