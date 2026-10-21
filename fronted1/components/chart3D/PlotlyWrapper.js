"use client";
import React from "react";
import dynamic from "next/dynamic";

// Dynamically import Plotly with SSR disabled to prevent 'window is not defined' errors
const Plot = dynamic(() => import("react-plotly.js"), {
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center w-full h-80 bg-gray-50 rounded-xl animate-pulse">
      <div className="flex flex-col items-center gap-2">
        <div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
        <p className="text-xs text-gray-500 font-medium">Initializing 3D Visualizer...</p>
      </div>
    </div>
  ),
});

export default function PlotlyWrapper({ data, layout, config, style, className }) {
  const defaultLayout = {
    autosize: true,
    margin: { l: 40, r: 40, b: 40, t: 50 },
    paper_bgcolor: "transparent",
    plot_bgcolor: "transparent",
    ...layout,
  };

  const defaultConfig = {
    responsive: true,
    displayModeBar: true,
    displaylogo: false,
    modeBarButtonsToRemove: ["sendDataToCloud"],
    toImageButtonOptions: {
      format: "png",
      filename: "3d_visualization",
      height: 700,
      width: 900,
      scale: 2,
    },
    ...config,
  };

  return (
    <div className={`w-full h-full min-h-[380px] ${className || ""}`}>
      <Plot
        data={data}
        layout={defaultLayout}
        config={defaultConfig}
        style={{ width: "100%", height: "100%", minHeight: "380px", ...style }}
        useResizeHandler={true}
      />
    </div>
  );
}
