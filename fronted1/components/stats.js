"use client"; // needed because of animations

import React from "react";

const stats = [
  {
    number: "50,000+",
    label: "Files Processed",
    icon: "📊",
    color: "text-blue-400",
    animate: "animate-excel-data-flow",
  },
  {
    number: "1,25,000+",
    label: "Charts Created",
    icon: "📈",
    color: "text-purple-400",
    animate: "animate-chart-morph",
  },
  {
    number: "15,000+",
    label: "Happy Users",
    icon: "👥",
    color: "text-pink-400",
    animate: "animate-particle-dance",
  },
  {
    number: "99%",
    label: "Satisfaction Rate",
    icon: "⭐",
    color: "text-green-400",
    animate: "animate-glow",
  },
];

const Stats = () => {
  return (
    <div className="relative bg-gradient-to-r from-gray-900 to-gray-800 text-white py-20 px-4 overflow-hidden">
      {/* Optional Canvas background */}
      <canvas className="absolute inset-0 w-full h-full opacity-10 pointer-events-none" />

      {/* Gradient Overlay */}
      <div className="absolute inset-0 bg-gradient-to-r from-blue-500/10 via-purple-500/10 to-pink-500/10 z-0" />

      {/* Content */}
      <div className="relative z-10 max-w-6xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-extrabold mb-4">Trusted by Data Professionals</h2>
          <p className="text-lg text-gray-300">
            Join thousands who've transformed their data analysis with beautiful animations
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
          {stats.map((stat, index) => (
            <div
              key={index}
              className="bg-white/5 rounded-2xl p-6 text-center hover:shadow-xl transition hover:scale-[1.02] duration-300"
            >
              <div className={`text-3xl font-bold mb-2 ${stat.color}`}>{stat.number}</div>
              <p className="text-gray-300 mb-2">{stat.label}</p>
              <div className={`text-2xl ${stat.animate}`}>{stat.icon}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Stats;
