"use client";
import React from "react";
import PlotlyWrapper from "./PlotlyWrapper";

export default function PowerMapChart3D({
  locations = [],
  values = [],
  text = [],
  title = "Geographic Power Map (3D Globe)",
  measureLabel = "Value",
  locationMode = "country names",
}) {
  const plotData = [
    {
      type: "choropleth",
      locationmode: locationMode,
      locations,
      z: values,
      text: text.length > 0 ? text : locations,
      hovertemplate: "%{location}<br>%{z:,.2f}<extra></extra>",
      colorscale: "Blues",
      reversescale: true,
      colorbar: {
        title: measureLabel,
        thickness: 12,
      },
      marker: {
        line: { color: "rgb(180,180,180)", width: 0.5 },
      },
    },
  ];

  const layout = {
    title: { text: title, font: { size: 16 } },
    geo: {
      projection: { type: "orthographic" }, // 3D Globe Projection!
      showocean: true,
      oceancolor: "rgb(230, 245, 255)",
      showland: true,
      landcolor: "rgb(243, 244, 246)",
      showlakes: true,
      lakecolor: "rgb(230, 245, 255)",
      showcountries: true,
    },
    autosize: true,
  };

  return (
    <div className="bg-white p-5 rounded-2xl shadow-md border border-gray-100 flex flex-col h-full min-h-[440px]">
      <div className="flex items-center justify-between mb-2">
        <h3 className="font-semibold text-gray-700 text-lg">{title}</h3>
        <span className="text-xs bg-cyan-50 text-cyan-700 px-2.5 py-1 rounded-full font-medium">
          3D Globe Power Map
        </span>
      </div>
      <div className="flex-1 w-full min-h-[380px]">
        <PlotlyWrapper data={plotData} layout={layout} />
      </div>
    </div>
  );
}
