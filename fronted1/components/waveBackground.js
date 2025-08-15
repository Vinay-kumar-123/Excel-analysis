'use client';

import React from 'react';

const WaveBackground = () => {
  return (
    <div className="absolute inset-0 overflow-hidden">
      <svg className="absolute bottom-0 left-0 w-full h-64" viewBox="0 0 1200 120" preserveAspectRatio="none">
        <defs>
          <linearGradient id="wave-gradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#3B82F6" stopOpacity="0.1" />
            <stop offset="50%" stopColor="#8B5CF6" stopOpacity="0.2" />
            <stop offset="100%" stopColor="#EC4899" stopOpacity="0.1" />
          </linearGradient>
        </defs>

        <path
          d="M0,60 C300,120 600,0 900,60 C1050,90 1150,30 1200,60 L1200,120 L0,120 Z"
          fill="url(#wave-gradient)"
          className="animate-wave-slow"
        />
        <path
          d="M0,80 C300,20 600,100 900,40 C1050,10 1150,70 1200,40 L1200,120 L0,120 Z"
          fill="url(#wave-gradient)"
          className="animate-wave-medium"
        />
        <path
          d="M0,100 C300,60 600,140 900,100 C1050,130 1150,90 1200,100 L1200,120 L0,120 Z"
          fill="url(#wave-gradient)"
          className="animate-wave-fast"
        />
      </svg>
    </div>
  );
};

export default WaveBackground;
