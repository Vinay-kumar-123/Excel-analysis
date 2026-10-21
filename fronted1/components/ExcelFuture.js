"use client";
import React from "react";

const features = [
  {
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
      </svg>
    ),
    iconColor: "text-blue-600 bg-blue-50",
    title: "Excel Import",
    description: "Upload .xls and .xlsx files with instant parsing, multi-sheet detection, and real-time preview.",
    list: ["Drag & drop interface", "Automatic data validation", "Multi-sheet support", "Large file handling"],
  },
  {
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
      </svg>
    ),
    iconColor: "text-indigo-600 bg-indigo-50",
    title: "Interactive Charts",
    description: "Generate 15+ chart types in 2D and 3D with responsive layouts and live customization.",
    list: ["Bar, Line, Pie, Scatter", "3D Surface & Bubble", "Real-time axis controls", "Interactive legends"],
  },
  {
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
      </svg>
    ),
    iconColor: "text-violet-600 bg-violet-50",
    title: "Export & Share",
    description: "Download charts as PNG or JPEG and export your data as CSV with one click.",
    list: ["PNG & JPEG chart export", "CSV data download", "High-resolution output", "Copy to clipboard"],
  },
  {
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
      </svg>
    ),
    iconColor: "text-sky-600 bg-sky-50",
    title: "Data History",
    description: "Your uploaded data persists across sessions so you can pick up right where you left off.",
    list: ["Session persistence", "Quick dataset reload", "Multi-sheet navigation", "Clean data table view"],
  },
  {
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9" />
      </svg>
    ),
    iconColor: "text-teal-600 bg-teal-50",
    title: "3D Visualizations",
    description: "Explore data spatially with fully interactive 3D charts powered by Plotly.js.",
    list: ["3D Bar & Surface", "3D Scatter & Bubble", "Rotate, zoom & pan", "Geographic Power Map"],
  },
  {
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
      </svg>
    ),
    iconColor: "text-purple-600 bg-purple-50",
    title: "AI Insights",
    description: "Ask plain-English questions about your data and get structured analysis from Gemini AI.",
    list: ["Executive summaries", "Trend detection", "Anomaly highlights", "Actionable recommendations"],
  },
];

const ExcelFuture = () => {
  return (
    <section className="bg-slate-50 py-24 px-6 border-t border-slate-100">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-16">
          <span className="inline-block text-xs font-semibold uppercase tracking-widest text-blue-600 bg-blue-50 border border-blue-100 px-4 py-1.5 rounded-full mb-4">
            Everything You Need
          </span>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 mb-4">
            A Complete Analytics Platform
          </h2>
          <p className="text-slate-500 text-base max-w-2xl mx-auto">
            From raw Excel file to executive-ready AI report — all in one place, with no setup required.
          </p>
        </div>

        {/* Feature grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature, idx) => (
            <div
              key={idx}
              className="bg-white border border-slate-200 rounded-2xl p-6 hover:shadow-md hover:-translate-y-1 transition-all duration-250 group"
            >
              {/* Icon */}
              <div className={`w-11 h-11 rounded-xl ${feature.iconColor} flex items-center justify-center mb-5 group-hover:scale-110 transition-transform duration-200`}>
                {feature.icon}
              </div>

              <h3 className="text-base font-bold text-slate-800 mb-2">{feature.title}</h3>
              <p className="text-sm text-slate-500 mb-4 leading-relaxed">{feature.description}</p>

              <ul className="space-y-1.5">
                {feature.list.map((item, i) => (
                  <li key={i} className="flex items-center gap-2 text-sm text-slate-600">
                    <svg className="w-3.5 h-3.5 text-emerald-500 shrink-0" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default ExcelFuture;
