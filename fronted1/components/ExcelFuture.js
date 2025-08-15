"use client";
import React from "react";

const features = [
  {
    icon: "📊",
    title: "Excel Import",
    description: "Seamlessly upload .xls and .xlsx files with animated column detection",
    list: [
      "Drag & drop interface",
      "Automatic data validation",
      "Real-time preview",
      "Large file support",
    ],
  },
  {
    icon: "📈",
    title: "Interactive Charts",
    description: "Create stunning visualizations with our charting engine and animations",
    list: [
      "15+ chart types (2D & 3D)",
      "Real-time customization",
      "Responsive design",
      "Interactive legends",
    ],
  },
  {
    icon: "💾",
    title: "Export & Share",
    description: "Export visualizations with animated previews in multiple formats",
    list: [
      "PNG, JPEG, PDF exports",
      "CSV data downloads",
      "High-resolution output",
      "Batch export options",
    ],
  },
  {
    icon: "🗂️",
    title: "Data History",
    description: "Track and manage all your data with timeline animations",
    list: [
      "Upload history tracking",
      "Saved chart library",
      "Version control",
      "Quick access dashboard",
    ],
  },
  {
    icon: "🌐",
    title: "3D Visualizations",
    description: "Advanced 3D charts with smooth transitions",
    list: [
      "3D Column & Surface charts",
      "Geographic Power Maps",
      "Interactive 3D controls",
      "Time-based animations",
    ],
  },
  {
    icon: "🤖",
    title: "AI Insights",
    description: "AI-powered analysis with animated feedback",
    list: [
      "Smart chart suggestions",
      "Trend analysis",
      "Data insights",
      "Automated recommendations",
    ],
  },
];

const ExcelFuture = () => {
  return (
    <section className="relative overflow-hidden bg-gradient-to-b from-gray-50 to-white py-20 px-4">
      <canvas className="absolute inset-0 w-full h-full opacity-10 pointer-events-none" />

      <div className="relative max-w-6xl mx-auto z-10 text-center mb-16">
        <h2 className="text-4xl font-extrabold text-gray-900 mb-4">
          Complete Excel Analytics Solution with Beautiful Animations
        </h2>
        <p className="text-lg text-gray-600 max-w-2xl mx-auto">
          From data import to AI-powered insights, we provide everything you need for professional data analysis with stunning visual effects
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 max-w-6xl mx-auto z-10 relative">
        {features.map((feature, idx) => (
          <div
            key={idx}
            className="relative bg-white border border-gray-100 rounded-2xl shadow-lg p-6 hover:translate-y-[-8px] transition-all duration-300 hover:shadow-xl group"
          >
            <div className="flex items-center justify-center w-16 h-16 mx-auto mb-4 rounded-xl bg-gradient-to-r from-blue-500 to-indigo-500 text-white text-2xl animate-bounce">
              {feature.icon}
            </div>
            <h3 className="text-xl font-bold text-gray-800 text-center mb-2">{feature.title}</h3>
            <p className="text-gray-600 text-sm text-center mb-4">{feature.description}</p>
            <ul className="text-sm text-gray-500 space-y-2 text-center">
              {feature.list.map((item, i) => (
                <li
                  key={i}
                  className="opacity-0 animate-fadeInUp animation-delay"
                  style={{ animationDelay: `${(i + 1) * 100}ms`, animationFillMode: "forwards" }}
                >
                  {item}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </section>
  );
};

export default ExcelFuture;
