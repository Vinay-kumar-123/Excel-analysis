"use client";

import Link from "next/link";
import React from "react";
import { Line } from "react-chartjs-2";
import { FaChartLine } from "react-icons/fa";

const HeroSection = () => {
  return (
    <div className="relative bg-gray-50 overflow-hidden py-16 px-4">
      {/* Animation + Icon */}
      <div className="relative w-32 h-32 mx-auto mb-8">
        {/* Ping Circles */}
        <div className="absolute inset-0 rounded-full bg-gradient-to-br from-blue-500 to-blue-700 opacity-30 animate-ping" />
        <div className="absolute inset-0 rounded-full bg-gradient-to-br from-blue-500 to-blue-700 opacity-30 animate-ping delay-150" />
        <div className="absolute inset-0 rounded-full bg-gradient-to-br from-blue-500 to-blue-700 opacity-30 animate-ping delay-300" />

        {/* Pulse Circle */}
        <div className="absolute inset-0 rounded-full bg-gradient-to-br from-blue-500 to-blue-700 shadow-lg animate-pulse z-10" />

        {/* Icon Layer */}
        <div className="absolute inset-0 flex items-center justify-center z-20">
          <div className="w-12 h-12 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 opacity-20 animate-pulse absolute" />
          <div className="w-12 h-12 flex items-center justify-center relative z-10">
            <FaChartLine className="w-8 h-8 text-orange-400 animate-bounce" />
          </div>
        </div>
      </div>

      {/* Title */}
      <h1 className="text-4xl font-extrabold text-gray-900 text-center">
        <span>Transform Your Excel Data</span>
        <br />
        <span className="bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 bg-clip-text text-transparent">
          Into Powerful Insights
        </span>
      </h1>

      {/* Description */}
      <p className="max-w-2xl mx-auto mt-6 text-lg text-gray-600 text-center leading-relaxed">
        Upload Excel files, create stunning 3D visualizations, get AI-powered
        insights, and export in multiple formats.
      </p>

      {/* Buttons */}
      <div className="mt-10 flex flex-wrap justify-center gap-4 text-lg">
        <Link href="/upload">
          <button className="px-6 py-3 rounded-xl bg-gradient-to-r from-blue-600 via-purple-600 to-pink-500 text-white font-medium shadow-lg hover:scale-105 transition-transform  cursor-pointer">
            Start Free Trial
          </button>
        </Link>
        <Link href="/signup">
          <button className="px-6 py-3 rounded-xl bg-gradient-to-r from-gray-500 to-gray-700 text-white font-medium shadow-lg hover:scale-105 transition-transform  cursor-pointer">
            Sign In
          </button>
        </Link>
      </div>
    </div>
  );
};

export default HeroSection;
