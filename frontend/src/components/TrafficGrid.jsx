import React from 'react';
import { AlertOctagon, Car } from 'lucide-react';

export default function TrafficGrid({ feeds, counts, logic, env }) {
  const { obstacle_zone, is_night } = env || {};
  const { active_dir, state, timer, mode } = logic;

  const isEmergency = state === 'EMERGENCY';
  const isManual = mode === 'MANUAL';

  // Helper for Border Colors
  const getBorderColor = dir => {
    if (obstacle_zone === dir)
      return 'border-orange-500 shadow-[0_0_50px_rgba(249,115,22,0.9)] animate-pulse';
    if (isEmergency && active_dir === dir)
      return 'border-blue-500 shadow-[0_0_40px_rgba(59,130,246,0.9)] animate-pulse';
    if (isManual && active_dir === dir)
      return 'border-purple-500 shadow-[0_0_30px_rgba(168,85,247,0.6)]';
    if (active_dir !== dir) return 'border-slate-800 opacity-60 grayscale';
    if (state === 'GREEN')
      return 'border-green-500 shadow-[0_0_30px_rgba(34,197,94,0.6)]';
    if (state === 'YELLOW')
      return 'border-yellow-400 shadow-[0_0_30px_rgba(250,204,21,0.6)]';
    return 'border-gray-700';
  };

  return (
    <div className='flex-1 grid grid-cols-2 gap-4 relative min-h-0'>
      {['north', 'east', 'west', 'south'].map(dir => (
        <div
          key={dir}
          className={`relative bg-black rounded-2xl overflow-hidden border-4 transition-all duration-500 group aspect-video ${getBorderColor(
            dir
          )}`}>
          {/* Zone Label */}
          <div className='absolute top-3 left-3 z-10 bg-black/70 backdrop-blur px-3 py-1 rounded-lg border border-white/10 text-xs font-bold uppercase text-slate-300'>
            {dir} Zone
          </div>

          {/* Vehicle Count Badge */}
          <div className='absolute top-3 right-3 z-10 bg-black/60 backdrop-blur px-2 py-1 rounded-lg border border-white/10 flex items-center gap-2 shadow-sm'>
            <Car size={14} className='text-indigo-400' />
            <span className='text-sm font-mono font-bold text-white leading-none'>
              {counts[dir] || 0}
            </span>
          </div>

          {/* Obstacle Warning Overlay */}
          {obstacle_zone === dir && (
            <div className='absolute top-14 right-3 z-20 bg-orange-600 text-white px-3 py-1 rounded-lg font-bold text-xs animate-pulse flex items-center gap-2 shadow-lg'>
              <AlertOctagon size={16} /> STALLED VEHICLE
            </div>
          )}

          {feeds[dir] ? (
            <img
              src={`data:image/jpeg;base64,${feeds[dir]}`}
              className={`w-full h-full object-cover transition duration-500 ${
                is_night
                  ? 'brightness-75 contrast-125 grayscale-[0.3]'
                  : 'opacity-90'
              }`}
              alt={`${dir} feed`}
            />
          ) : (
            // Empty State
            <div className='w-full h-full flex flex-col items-center justify-center text-slate-700 bg-slate-950'>
              <div className='w-10 h-10 border-4 border-slate-800 border-t-indigo-500 rounded-full animate-spin mb-4'></div>
              <span className='text-xs tracking-widest animate-pulse font-bold'>
                SIGNAL LOST
              </span>
            </div>
          )}
        </div>
      ))}

      {/* CENTRAL TIMER HUD */}
      <div className='absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50 pointer-events-none'>
        <div
          className={`w-32 h-32 md:w-40 md:h-40 rounded-full border-8 bg-slate-900/95 backdrop-blur flex flex-col items-center justify-center shadow-2xl relative transition-colors duration-300
            ${
              obstacle_zone
                ? 'border-orange-500 animate-shake'
                : isEmergency
                ? 'border-blue-500'
                : isManual
                ? 'border-purple-500'
                : state === 'GREEN'
                ? 'border-green-500'
                : 'border-yellow-500'
            }`}>
          <span className='text-[10px] font-black uppercase text-slate-500 mb-1 tracking-widest'>
            {obstacle_zone
              ? 'WARNING'
              : isEmergency
              ? 'PRIORITY'
              : isManual
              ? 'LOCKED'
              : 'TIMER'}
          </span>

          {obstacle_zone ? (
            <AlertOctagon size={64} className='text-orange-500 animate-pulse' />
          ) : (
            <span
              className={`text-5xl font-mono font-bold ${
                isEmergency
                  ? 'text-blue-400'
                  : isManual
                  ? 'text-purple-400'
                  : 'text-white'
              }`}>
              {timer}
            </span>
          )}

          <span
            className={`text-xs mt-1 font-bold uppercase ${
              obstacle_zone
                ? 'text-orange-400'
                : isEmergency
                ? 'text-blue-300'
                : 'text-indigo-300'
            }`}>
            {obstacle_zone
              ? 'OBSTACLE'
              : isEmergency
              ? 'AMBULANCE'
              : active_dir}
          </span>
        </div>
      </div>
    </div>
  );
}
