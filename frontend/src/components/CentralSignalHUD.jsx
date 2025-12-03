// ============================================================
// CentralSignalHUD.jsx (FINAL)
// ------------------------------------------------------------
// ✔ ALWAYS stays in the exact center of TrafficGrid
// ✔ Speedometer-style design
// ✔ Pulse effect whenever signal changes
// ✔ Shows ACTIVE direction + countdown
// ============================================================

import React, { useEffect, useRef } from 'react';

export default function CentralSignalHUD({ logic }) {
  const { active_dir, state, timer } = logic || {};

  const pulseRef = useRef(null);

  // Pulse effect on signal or direction change
  useEffect(() => {
    if (!pulseRef.current) return;

    pulseRef.current.classList.remove('animate-pulse');
    void pulseRef.current.offsetWidth; // reflow
    pulseRef.current.classList.add('animate-pulse');
  }, [active_dir, state]);

  // UI Color based on signal
  const getColor = () => {
    if (state === 'GREEN') return 'text-green-400 border-green-500';
    if (state === 'YELLOW') return 'text-yellow-400 border-yellow-500';
    return 'text-red-400 border-red-500';
  };

  return (
    <div
      className='
        absolute left-1/2 top-1/2 
        -translate-x-1/2 -translate-y-1/2
        z-[9999] pointer-events-none
        flex flex-col items-center gap-2
      '>
      {/* Speedometer-style ring */}
      <div
        ref={pulseRef}
        className={`
          w-24 h-24 rounded-full border-3 
          flex items-center justify-center 
          backdrop-blur-lg bg-black/40
          shadow-[0_0_20px_rgba(255,255,255,0.2)]
          ${getColor()}
        `}>
        <div className='text-center'>
          {/* Active direction */}
          <div className='text-xs font-bold uppercase tracking-widest'>
            {active_dir || '---'}
          </div>

          {/* Timer */}
          <div className='text-2xl font-black mt-1'>
            {Math.max(0, Math.floor(timer))}
          </div>

          {/* Signal state */}
          <div className='text-[10px] uppercase opacity-80'>{state}</div>
        </div>
      </div>
    </div>
  );
}
