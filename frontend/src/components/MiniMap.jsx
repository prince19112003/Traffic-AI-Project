// ============================================================
// MiniMap.jsx  (ADVANCED VERSION)
// ------------------------------------------------------------
// Intersection MiniMap with:
// ✔ Path-level routing (road strips per direction)
// ✔ Moving vehicles (small dots animating along each lane)
// ✔ Live blinking signals (RED / YELLOW / GREEN)
// ✔ Active direction glow highlight
// Works directly with:
//   - logic.signal_map
//   - logic.active_dir
//   - counts.{north,east,south,west}
// ============================================================

import React from 'react';
import { ArrowUp, ArrowRight, ArrowDown, ArrowLeft } from 'lucide-react';

export default function MiniMap({ logic, counts }) {
  if (!logic) return null;

  const { signal_map = {}, active_dir } = logic || {};

  // ------------------------------------------------------------
  // Get raw signal for dir
  // ------------------------------------------------------------
  const getSignal = dir => (signal_map[dir] || 'RED').toUpperCase();

  // ------------------------------------------------------------
  // Color class for signal DOT (small circle near junction)
  // ------------------------------------------------------------
  const getSignalDotClass = dir => {
    const sig = getSignal(dir);
    if (sig === 'GREEN') return 'bg-green-400';
    if (sig === 'YELLOW') return 'bg-yellow-300';
    return 'bg-red-400';
  };

  // ------------------------------------------------------------
  // Road "glow" + activity depending on active & signal
  // ------------------------------------------------------------
  const getLaneGlow = dir => {
    const sig = getSignal(dir);
    const isActive = active_dir === dir;

    if (sig === 'GREEN' && isActive)
      return 'shadow-[0_0_20px_rgba(34,197,94,0.9)]';
    if (sig === 'GREEN') return 'shadow-[0_0_12px_rgba(34,197,94,0.6)]';

    if (sig === 'YELLOW' && isActive)
      return 'shadow-[0_0_18px_rgba(250,204,21,0.9)]';
    if (sig === 'YELLOW') return 'shadow-[0_0_10px_rgba(250,204,21,0.6)]';

    if (isActive) return 'shadow-[0_0_14px_rgba(248,113,113,0.8)]';

    return 'shadow-[0_0_6px_rgba(15,23,42,0.9)]';
  };

  // ------------------------------------------------------------
  // Live blinking on signal dot (custom animate-blink-soft)
  // ------------------------------------------------------------
  const getBlinkClass = dir => {
    const sig = getSignal(dir);
    if (sig === 'GREEN' || sig === 'YELLOW') return 'animate-blink-soft';
    return '';
  };

  // ------------------------------------------------------------
  // Vehicle count helper (for center stats)
  // ------------------------------------------------------------
  const n = counts?.north ?? 0;
  const e = counts?.east ?? 0;
  const s = counts?.south ?? 0;
  const w = counts?.west ?? 0;
  const total = (n || 0) + (e || 0) + (s || 0) + (w || 0);

  return (
    <div className='w-full rounded-2xl border bg-slate-950/60 border-slate-800 p-3 shadow-inner'>
      {/* Header row */}
      <div className='flex justify-between items-center mb-2 text-[11px] text-slate-400 uppercase tracking-[0.25em]'>
        <span>Intersection Map</span>
        <span className='text-[10px]'>
          Active: {active_dir ? active_dir.toUpperCase() : '---'}
        </span>
      </div>

      {/* 3x3 mini grid for intersection */}
      <div className='grid grid-cols-3 grid-rows-3 gap-1 h-36'>
        {/* ================= NORTH LANE ================= */}
        <div className='col-start-2 row-start-1 flex flex-col items-center justify-end'>
          {/* Arrow for orientation */}
          <ArrowUp size={12} className='text-slate-500 mb-1' />

          {/* Vertical road strip */}
          <div
            className={`
              relative w-3 h-14 rounded-full bg-slate-800/90 overflow-hidden 
              border border-slate-700/60 transition-all duration-300 
              ${getLaneGlow('north')}
            `}>
            {/* Moving vehicle inside road (only if some vehicles exist) */}
            {n > 0 && (
              <div
                className={`
                  mini-vehicle mini-vehicle-north
                  ${
                    getSignal('north') === 'GREEN'
                      ? 'bg-emerald-300'
                      : 'bg-slate-300'
                  }
                `}
              />
            )}
          </div>

          {/* Signal dot near junction */}
          <div
            className={`
              mt-1 w-3 h-3 rounded-full border border-slate-200/40 
              ${getSignalDotClass('north')} ${getBlinkClass('north')}
            `}
          />
        </div>

        {/* ================= WEST LANE ================= */}
        <div className='col-start-1 row-start-2 flex items-center justify-end pr-1'>
          {/* Road strip: horizontal */}
          <div
            className={`
              relative h-3 w-14 rounded-full bg-slate-800/90 overflow-hidden 
              border border-slate-700/60 transition-all duration-300 
              ${getLaneGlow('west')}
            `}>
            {w > 0 && (
              <div
                className={`
                  mini-vehicle mini-vehicle-west
                  ${
                    getSignal('west') === 'GREEN'
                      ? 'bg-emerald-300'
                      : 'bg-slate-300'
                  }
                `}
              />
            )}
          </div>

          {/* Signal dot */}
          <div
            className={`
              ml-1 w-3 h-3 rounded-full border border-slate-200/40 
              ${getSignalDotClass('west')} ${getBlinkClass('west')}
            `}
          />

          {/* Orientation arrow */}
          <ArrowLeft size={12} className='text-slate-500 ml-1' />
        </div>

        {/* ================= CENTER JUNCTION ================= */}
        <div className='col-start-2 row-start-2 flex flex-col items-center justify-center bg-slate-900/80 rounded-xl border border-slate-700 shadow-[0_0_18px_rgba(15,23,42,0.9)]'>
          <span className='text-[9px] text-slate-400 uppercase tracking-widest mb-1'>
            JUNCTION
          </span>

          {/* counts row 1 */}
          <span className='text-[10px] text-slate-300 font-mono'>
            N:{n} &nbsp; E:{e}
          </span>

          {/* counts row 2 */}
          <span className='text-[10px] text-slate-300 font-mono'>
            S:{s} &nbsp; W:{w}
          </span>

          {/* total */}
          <span className='mt-1 text-[9px] text-slate-500 font-mono'>
            TOTAL: {total}
          </span>
        </div>

        {/* ================= EAST LANE ================= */}
        <div className='col-start-3 row-start-2 flex items-center justify-start pl-1'>
          {/* Signal dot */}
          <div
            className={`
              mr-1 w-3 h-3 rounded-full border border-slate-200/40 
              ${getSignalDotClass('east')} ${getBlinkClass('east')}
            `}
          />

          {/* Road strip */}
          <div
            className={`
              relative h-3 w-14 rounded-full bg-slate-800/90 overflow-hidden 
              border border-slate-700/60 transition-all duration-300 
              ${getLaneGlow('east')}
            `}>
            {e > 0 && (
              <div
                className={`
                  mini-vehicle mini-vehicle-east
                  ${
                    getSignal('east') === 'GREEN'
                      ? 'bg-emerald-300'
                      : 'bg-slate-300'
                  }
                `}
              />
            )}
          </div>

          {/* Orientation arrow */}
          <ArrowRight size={12} className='text-slate-500 ml-1' />
        </div>

        {/* ================= SOUTH LANE ================= */}
        <div className='col-start-2 row-start-3 flex flex-col items-center justify-start'>
          {/* Signal dot */}
          <div
            className={`
              mb-1 w-3 h-3 rounded-full border border-slate-200/40 
              ${getSignalDotClass('south')} ${getBlinkClass('south')}
            `}
          />

          {/* Road strip */}
          <div
            className={`
              relative w-3 h-14 rounded-full bg-slate-800/90 overflow-hidden 
              border border-slate-700/60 transition-all duration-300 
              ${getLaneGlow('south')}
            `}>
            {s > 0 && (
              <div
                className={`
                  mini-vehicle mini-vehicle-south
                  ${
                    getSignal('south') === 'GREEN'
                      ? 'bg-emerald-300'
                      : 'bg-slate-300'
                  }
                `}
              />
            )}
          </div>

          {/* Orientation arrow */}
          <ArrowDown size={12} className='text-slate-500 mt-1' />
        </div>
      </div>
    </div>
  );
}
