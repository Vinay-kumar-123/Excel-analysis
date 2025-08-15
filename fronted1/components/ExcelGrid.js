// components/ExcelGrid.jsx
"use client"; // ✅ Needed for animations

import React from "react";

const ExcelGrid = () => {
  return (
    <div className="relative max-w-2xl mx-auto px-4 py-8 mb-20 overflow-visible">
      {/* 🟢 Excel Grid */}
      <div className="grid grid-cols-4 gap-1 p-4 bg-white rounded-lg shadow-md border border-gray-200">
        {/* Header */}
        {["A", "B", "C", "D"].map((label, index) => (
          <div
            key={`header-${index}`}
            className="h-8 bg-gray-100 border border-gray-300 flex items-center justify-center text-xs font-semibold text-gray-600 rounded"
          >
            {label}
          </div>
        ))}

        {/* Rows */}
        {[
          ["Sales", "1250", "", "3400"],
          ["Profit", "890", "Growth", "15%"],
          ["Sales", "1250", "Revenue", "3400"],
          ["Profit", "890", "Growth", "15%"],
        ].map((row, rowIndex) =>
          row.map((cell, cellIndex) => (
            <div
              key={`cell-${rowIndex}-${cellIndex}`}
              className={`h-8 ${
                cell === ""
                  ? "bg-white border border-gray-300"
                  : "bg-green-50 text-emerald-700 border border-emerald-300"
              } flex items-center justify-center text-xs font-medium rounded transition-all`}
            >
              {cell}
            </div>
          ))
        )}
      </div>

      {/* 🟢 Formula Bar */}
      <div className="mt-4 bg-gray-50 border border-gray-300 p-2 rounded-lg flex items-center gap-2">
        <span className="text-xs font-semibold text-gray-600">fx</span>
        <div className="flex-1 bg-white border border-gray-300 rounded px-2 py-1 font-mono text-xs text-gray-700">
          =SUM(A1:D4)
        </div>
      </div>

      {/* 🟢 Floating Icons */}
      <div className="absolute inset-0 pointer-events-none">
        {[0, 500, 1000, 1500, 2000, 2500].map((delay, index) => (
          <div
            key={index}
            className="absolute text-emerald-500 text-xl opacity-20 animate-floating"
            style={{
              left: `${10 + index * 15}%`,
              top: `${10 + (index % 3) * 10}%`,
              animationDelay: `${delay}ms`,
            }}
          >
            📊
          </div>
        ))}
      </div>
    </div>
  );
};

export default ExcelGrid;
