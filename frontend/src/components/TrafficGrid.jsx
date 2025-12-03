// ============================================================
// TrafficGrid.jsx (FINAL)
// ------------------------------------------------------------
// 2x2 Grid showing:
// ✔ Live camera feeds
// ✔ "No Footage" placeholders
// ✔ Reconnect button
// ✔ Signal-based dynamic borders
// ✔ GO / WAIT timer
// ✔ Subtle scale animation
// And acts as parent container for CenterSignalHUD (absolute center)
// ============================================================

import React from 'react';
import { Car, AlertOctagon, RefreshCw } from 'lucide-react';

export default function TrafficGrid({ feeds, counts, logic, env }) {
  // Extract environment
  const { obstacle_zone, is_night } = env || {};

  // Extract traffic logic
  const { active_dir, state, timer, mode, signal_map = {} } = logic || {};

  // Emergency mode flag
  const isEmergency = state === 'EMERGENCY';

  // Fixed traffic directions
  const directions = ['north', 'east', 'south', 'west'];

  // Backend reconnect API
  const reconnectCamera = dir => {
    try {
      fetch(`http://localhost:8766/reconnect?dir=${dir}`);
      console.log(`[RECONNECT] Triggered for: ${dir}`);
    } catch (e) {
      console.warn('Reconnect failed:', e);
    }
  };

  // Get traffic signal color for a direction
  const getSignalForDir = dir => {
    const raw = signal_map[dir] || 'RED';
    if (raw === 'EMERGENCY') return 'RED';
    return raw;
  };

  // Timer label + value for each zone
  const getTimerDisplay = dir => {
    if (mode === 'MANUAL') return { label: 'LOCKED', val: '---' };
    if (mode === 'ECO') return { label: 'ECO', val: 'SLEEP' };
    if (!active_dir) return { label: 'WAIT', val: '---' };

    const activeIdx = directions.indexOf(active_dir);
    const idx = directions.indexOf(dir);

    if (activeIdx === idx)
      return { label: 'GO', val: `${Math.max(0, Math.floor(timer))}s` };

    // Rough wait-time estimation
    const diff = (idx - activeIdx + 4) % 4;
    const wait = Math.max(0, Math.floor(timer) + (diff - 1) * 30);

    return { label: 'WAIT', val: `~${wait}s` };
  };

  // Border color based on signal + obstacle + emergency
  const getBorderColor = dir => {
    const sig = getSignalForDir(dir);

    if (obstacle_zone === dir)
      return 'border-orange-500 shadow-orange-500/40 animate-pulse';

    if (isEmergency && active_dir === dir)
      return 'border-red-500 shadow-red-500/40 animate-pulse';

    if (sig === 'GREEN') return 'border-green-500 shadow-green-500/30';
    if (sig === 'YELLOW') return 'border-yellow-400 shadow-yellow-400/30';

    return 'border-slate-700';
  };

  // Badge style for signal state
  const getSignalBadge = dir => {
    const sig = getSignalForDir(dir);

    if (obstacle_zone === dir)
      return { text: 'OBSTACLE', cls: 'bg-orange-900/70 border-orange-500' };

    if (sig === 'GREEN')
      return { text: 'GREEN', cls: 'bg-green-900/70 border-green-500' };

    if (sig === 'YELLOW')
      return { text: 'YELLOW', cls: 'bg-yellow-900/70 border-yellow-500' };

    return { text: 'RED', cls: 'bg-red-900/70 border-red-500' };
  };

  // Colored tint for "no footage"
  const getPlaceholderTint = dir => {
    switch (dir) {
      case 'north':
        return 'from-sky-900/40 via-slate-900 to-slate-950';
      case 'east':
        return 'from-amber-900/40 via-slate-900 to-slate-950';
      case 'south':
        return 'from-emerald-900/40 via-slate-900 to-slate-950';
      case 'west':
        return 'from-fuchsia-900/40 via-slate-900 to-slate-950';
      default:
        return 'from-slate-900 via-slate-800 to-slate-900';
    }
  };

  // ============================================================
  // MAIN GRID RENDER
  // Also acts as parent container for HUD (absolute center)
  // ============================================================

  return (
    <div className='flex-1 relative grid grid-cols-1 md:grid-cols-2 gap-4 min-h-0'>
      {directions.map(dir => {
        const hasFeed = Boolean(feeds[dir]);
        const badge = getSignalBadge(dir);
        const timerInfo = getTimerDisplay(dir);

        return (
          <div
            key={dir}
            className={`
              relative bg-black rounded-2xl overflow-hidden 
              border-4 transition-all duration-500 group 
              md:aspect-video aspect-[4/3] hover:scale-[1.01] 
              ${getBorderColor(dir)}
            `}>
            {/* Direction Label */}
            <div className='absolute top-3 left-3 bg-black/70 px-3 py-1 rounded-lg border text-xs text-slate-300 z-10 uppercase'>
              {dir} Zone
            </div>

            {/* Vehicle Count */}
            <div className='absolute top-3 right-3 bg-black/60 px-2 py-1 rounded-lg border flex items-center gap-2 z-10'>
              <Car size={14} className='text-indigo-400' />
              <span className='text-sm font-mono text-white'>
                {counts[dir] || 0}
              </span>
            </div>

            {/* Signal + Timer */}
            <div className='absolute bottom-3 left-3 z-10 flex items-center gap-2'>
              {/* Signal badge */}
              <div
                className={`px-2 py-1 rounded-lg border text-[10px] font-bold uppercase 
                flex items-center gap-1 ${badge.cls}`}>
                {badge.text}
              </div>

              {/* Timer */}
              <div
                className={`
                  px-2 py-1 rounded-lg border text-[10px] font-mono
                  ${
                    timerInfo.label === 'GO'
                      ? 'bg-green-900/40 border-green-700 text-green-100'
                      : 'bg-slate-900/80 text-slate-300'
                  }
                `}>
                {timerInfo.label}: <b>{timerInfo.val}</b>
              </div>
            </div>

            {/* CAMERA FEED */}
            {hasFeed ? (
              <img
                src={`data:image/jpeg;base64,${feeds[dir]}`}
                className={`
                  w-full h-full object-cover opacity-0 transition-all duration-700
                  ${is_night ? 'brightness-75 grayscale-[0.2]' : ''}
                  group-hover:brightness-110
                `}
                onLoad={e => e.currentTarget.classList.add('opacity-100')}
                alt={`${dir} feed`}
              />
            ) : (
              // NO FOOTAGE PlaceHolder
              <div
                className={`w-full h-full flex flex-col items-center justify-center relative 
                  bg-gradient-to-b ${getPlaceholderTint(dir)} text-slate-400`}>
                {/* Grid background */}
                <div
                  className='absolute inset-0 opacity-10 pointer-events-none'
                  style={{
                    backgroundImage:
                      'linear-gradient(rgba(255,255,255,0.08) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.08) 1px, transparent 1px)',
                    backgroundSize: '22px 22px',
                  }}
                />

                {/* Warning Icon */}
                <AlertOctagon
                  size={40}
                  className='text-red-500 opacity-80 mb-2 relative z-10'
                />

                <span className='text-sm text-red-300 font-bold tracking-widest relative z-10'>
                  NO FOOTAGE
                </span>

                <span className='text-[10px] text-slate-300 uppercase relative z-10'>
                  Camera Not Connected
                </span>

                {/* Reconnect Button */}
                <button
                  onClick={() => reconnectCamera(dir)}
                  className='mt-4 px-3 py-1.5 flex items-center gap-2 
                    text-[10px] bg-indigo-700 hover:bg-indigo-600 
                    text-white rounded-lg shadow relative z-10'>
                  <RefreshCw size={12} /> Reconnect Camera
                </button>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
