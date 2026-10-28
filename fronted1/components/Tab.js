"use client";
import React from "react";
import { BarChart3, Box, Table, Sparkles, History } from "lucide-react";

export default function Tab({ activeTab, onTabChange, counts = {} }) {
  const tabs = [
    {
      id: "2D",
      label: "2D Visualizations",
      icon: BarChart3,
      badge: counts["2D"] || "6 Types",
      color: "text-blue-600",
    },
    {
      id: "3D",
      label: "3D Visualizations",
      icon: Box,
      badge: counts["3D"] || "7 Types",
      color: "text-purple-600",
    },
    {
      id: "SUMMARY",
      label: "Data Summary & Stats",
      icon: Table,
      color: "text-emerald-600",
    },
    {
      id: "AI",
      label: "AI Insights",
      icon: Sparkles,
      badge: "Gemini",
      color: "text-pink-600",
    },
    {
      id: "HISTORY",
      label: "Analysis History",
      icon: History,
      badge: counts.history || undefined,
      color: "text-amber-600",
    },
  ];

  return (
    <div className="w-full flex items-center justify-center p-2">
      <div className="inline-flex p-1.5 bg-gray-100/90 rounded-2xl shadow-inner gap-1 max-w-full overflow-x-auto">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-medium text-sm transition-all duration-200 cursor-pointer whitespace-nowrap ${
                isActive
                  ? "bg-white text-gray-900 shadow-sm font-semibold scale-100"
                  : "text-gray-600 hover:text-gray-900 hover:bg-gray-200/60"
              }`}
            >
              <Icon className={`w-4 h-4 ${isActive ? tab.color : "text-gray-500"}`} />
              <span>{tab.label}</span>
              {tab.badge && (
                <span
                  className={`text-[11px] px-2 py-0.5 rounded-full font-medium ${
                    isActive
                      ? "bg-indigo-100 text-indigo-700"
                      : "bg-gray-200 text-gray-600"
                  }`}
                >
                  {tab.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
