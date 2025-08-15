"use client"; // Add this if using app directory in Next.js 13+

import React from "react";
import HeroeSection from "./HeroesSection";
import ExcelGrid from "./ExcelGrid";
import WaveBackground from "./waveBackground";
import Stats from "./stats";
import ExcelFuture from "./ExcelFuture";

const Heroes = () => {
  return (
    <main className="bg-white overflow-hidden">
      <div className="relative min-h-screen">
        <canvas
          className="absolute top-0 left-0 w-full h-full z-0 layer1"
          width="3040"
          height="1956"
        ></canvas>

        <canvas
          className="absolute top-0 left-0 w-full h-full z-0 layer2"
          width="719"
          height="1056"
        ></canvas>

        <div className="gradient-background absolute inset-0 z-0"></div>

        <div className="relative z-10">
          <HeroeSection />
          <ExcelGrid />
          <WaveBackground />
        </div>
      </div>

      <div className="relative z-10">
        <Stats />
        <ExcelFuture />
      </div>
    </main>
  );
};

export default Heroes;
