"use client";

import React from "react";

const stats = [
  {
    number: "50,000+",
    label: "Files Processed",
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 10V7m0 10a2 2 0 002 2h2a2 2 0 002-2V7a2 2 0 00-2-2h-2a2 2 0 00-2 2" />
      </svg>
    ),
    iconBg: "bg-blue-500/10 text-blue-400",
  },
  {
    number: "1,25,000+",
    label: "Charts Created",
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z" />
      </svg>
    ),
    iconBg: "bg-purple-500/10 text-purple-400",
  },
  {
    number: "15,000+",
    label: "Happy Users",
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
      </svg>
    ),
    iconBg: "bg-pink-500/10 text-pink-400",
  },
  {
    number: "99%",
    label: "Satisfaction Rate",
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
      </svg>
    ),
    iconBg: "bg-emerald-500/10 text-emerald-400",
  },
];

const Stats = () => {
  return (
    <section className="bg-slate-900 py-20 px-6">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-14">
          <h2 className="text-3xl sm:text-4xl font-extrabold text-white mb-3">
            Trusted by Data Professionals
          </h2>
          <p className="text-slate-400 text-base max-w-xl mx-auto">
            Thousands of analysts and teams use Excel Analytics every day to turn raw data into decisions.
          </p>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
          {stats.map((stat, index) => (
            <div
              key={index}
              className="relative bg-slate-800/60 border border-slate-700/60 rounded-2xl p-6 text-center hover:border-slate-600 hover:bg-slate-800 transition-all duration-300 group"
            >
              <div className={`w-12 h-12 rounded-xl ${stat.iconBg} flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform duration-200`}>
                {stat.icon}
              </div>
              <p className="text-3xl font-extrabold text-white mb-1">{stat.number}</p>
              <p className="text-sm text-slate-400 font-medium">{stat.label}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Stats;
