import React from 'react';
import { AlertOctagon, Car } from 'lucide-react';

export default function TrafficGrid({
  feeds,
  counts,
  logic,
  env,
  cyberpunkMode,
}) {
  const { obstacle_zone, is_night } = env || {};
  const { active_dir, state, timer } = logic;

  const isEmergency = state === 'EMERGENCY';
  const isManual = logic.mode === 'MANUAL';

  // Dynamic Styling Logic
  const getBorderColor = dir => {
    if (obstacle_zone === dir)
      return 'border-orange-500 shadow-[0_0_50px_rgba(249,115,22,0.6)] animate-pulse scale-[1.02] z-10';
    if (isEmergency && active_dir === dir)
      return 'border-red-500 shadow-[0_0_40px_rgba(239,68,68,0.8)] animate-pulse';

    if (active_dir === dir) {
      if (state === 'GREEN')
        return cyberpunkMode
          ? 'border-cyan-400 shadow-[0_0_30px_cyan]'
          : 'border-emerald-500 shadow-[0_0_25px_rgba(16,185,129,0.5)]';
      if (state === 'YELLOW')
        return 'border-yellow-400 shadow-[0_0_25px_rgba(250,204,21,0.5)]';
    }

    return cyberpunkMode
      ? 'border-slate-800 opacity-40 grayscale'
      : 'border-slate-800 opacity-50 grayscale';
  };

  return (
    <div className='grid grid-cols-1 md:grid-cols-2 gap-4 relative min-h-[50vh] md:min-h-0'>
      {['north', 'east', 'west', 'south'].map(dir => (
        <div
          key={dir}
          className={`relative rounded-2xl overflow-hidden border-[3px] transition-all duration-500 group aspect-video bg-black ${getBorderColor(
            dir
          )}`}>
          {/* Zone Label */}
          <div
            className={`absolute top-3 left-3 z-10 backdrop-blur-md px-3 py-1 rounded-lg border text-xs font-bold uppercase tracking-wider ${
              cyberpunkMode
                ? 'bg-black/60 border-cyan-500/30 text-cyan-300'
                : 'bg-black/60 border-white/10 text-slate-200'
            }`}>
            {dir}
          </div>

          {/* Vehicle Count */}
          <div
            className={`absolute top-3 right-3 z-10 backdrop-blur-md px-3 py-1.5 rounded-lg border flex items-center gap-2 shadow-sm ${
              cyberpunkMode
                ? 'bg-black/60 border-purple-500/30 text-purple-300'
                : 'bg-black/60 border-white/10 text-white'
            }`}>
            <Car
              size={14}
              className={cyberpunkMode ? 'text-purple-400' : 'text-indigo-400'}
            />
            <span className='text-sm font-mono font-bold leading-none'>
              {counts[dir] || 0}
            </span>
          </div>

          {/* Obstacle Warning */}
          {obstacle_zone === dir && (
            <div className='absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-20 bg-orange-600/90 text-white px-4 py-2 rounded-xl font-bold text-sm animate-bounce flex items-center gap-2 shadow-xl backdrop-blur border border-orange-400'>
              <AlertOctagon size={20} /> OBSTACLE DETECTED
            </div>
          )}

          {feeds[dir] ? (
            <img
              src={`data:image/jpeg;base64,${feeds[dir]}`}
              className={`w-full h-full object-cover transition duration-700 ${
                is_night ? 'brightness-90 contrast-125' : 'opacity-90'
              }`}
              alt={`${dir} feed`}
            />
          ) : (
            <div className='w-full h-full flex flex-col items-center justify-center text-slate-700 bg-[#050505]'>
              <div
                className={`w-12 h-12 border-4 rounded-full animate-spin mb-4 ${
                  cyberpunkMode
                    ? 'border-slate-800 border-t-cyan-500'
                    : 'border-slate-800 border-t-indigo-500'
                }`}></div>
              <span className='text-[10px] tracking-[0.3em] animate-pulse font-bold opacity-50'>
                NO SIGNAL
              </span>
            </div>
          )}
        </div>
      ))}

      {/* CENTRAL TIMER HUD (Floating) */}
      <div className='absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-30 pointer-events-none'>
        <div
          className={`w-36 h-36 md:w-44 md:h-44 rounded-full border-[6px] backdrop-blur-xl flex flex-col items-center justify-center shadow-2xl relative transition-all duration-500 ${
            obstacle_zone
              ? 'bg-orange-900/80 border-orange-500 animate-pulse'
              : isEmergency
              ? 'bg-red-900/80 border-red-500 animate-pulse'
              : state === 'GREEN'
              ? cyberpunkMode
                ? 'bg-black/80 border-cyan-400 shadow-[0_0_50px_rgba(6,182,212,0.4)]'
                : 'bg-slate-900/90 border-emerald-500'
              : cyberpunkMode
              ? 'bg-black/80 border-yellow-400'
              : 'bg-slate-900/90 border-yellow-500'
          }`}>
          <span
            className={`text-[10px] font-black uppercase mb-1 tracking-widest ${
              cyberpunkMode ? 'text-cyan-200' : 'text-slate-400'
            }`}>
            {obstacle_zone
              ? 'WARNING'
              : isEmergency
              ? 'PRIORITY'
              : isManual
              ? 'LOCKED'
              : 'TIMER'}
          </span>

          {obstacle_zone ? (
            <AlertOctagon size={56} className='text-orange-400 animate-pulse' />
          ) : (
            <span
              className={`text-6xl font-mono font-black tracking-tighter ${
                isEmergency
                  ? 'text-red-400'
                  : state === 'YELLOW'
                  ? 'text-yellow-400'
                  : cyberpunkMode
                  ? 'text-cyan-400 drop-shadow-[0_0_10px_rgba(6,182,212,0.8)]'
                  : 'text-white'
              }`}>
              {timer}
            </span>
          )}

          <div
            className={`mt-2 px-3 py-0.5 rounded text-[10px] font-bold uppercase tracking-widest ${
              obstacle_zone
                ? 'bg-orange-500/20 text-orange-200'
                : cyberpunkMode
                ? 'bg-cyan-900/30 text-cyan-300 border border-cyan-500/30'
                : 'bg-slate-800 text-slate-400'
            }`}>
            {obstacle_zone
              ? 'OBSTACLE'
              : isEmergency
              ? 'AMBULANCE'
              : active_dir}
          </div>
        </div>
      </div>
    </div>
  );
}
