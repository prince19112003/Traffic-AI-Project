"use client";
import React from 'react';
import { Car, AlertTriangle, RefreshCw, Radio } from 'lucide-react';

export default function TrafficGrid({ feeds, counts, logic, env }) {
  const { obstacle_zone, is_night } = env || {};
  const { active_dir, state: system_state, timer, mode, signal_map = {} } = logic || {};
  const directions = ['north', 'east', 'south', 'west'];

  const reconnectCamera = dir => {
    fetch(`http://localhost:8766/reconnect?dir=${dir}`).catch(() => {});
  };

  const getSignalState = dir => signal_map[dir] || 'RED';

  const getTimerInfo = dir => {
    if (mode === 'MANUAL') return { text: 'LOCK', color: 'text-slate-400' };
    if (mode === 'ECO') return { text: 'ECO', color: 'text-indigo-400' };
    
    if (active_dir === dir) {
      const val = Math.max(0, Math.floor(timer));
      return { text: `${val}s`, color: 'text-emerald-400 animate-pulse' };
    }
    return { text: 'WAIT', color: 'text-slate-500' };
  };

  return (
    <div className='flex-1 relative grid grid-cols-1 md:grid-cols-2 gap-3 min-h-0 overflow-y-auto custom-scroll pr-1'>
      {directions.map(dir => {
        const hasFeed = Boolean(feeds?.[dir]);
        const sig = getSignalState(dir);
        const timerInfo = getTimerInfo(dir);
        const isSelected = active_dir === dir;

        return (
          <div
            key={dir}
            className={`
              relative bg-slate-900 rounded-2xl overflow-hidden 
              border transition-all duration-700 glass-panel
              ${isSelected ? 'border-indigo-500/50 ring-1 ring-indigo-500/20' : 'border-white/5'}
              aspect-video group
            `}>
            
            {/* WINDOW HEADER */}
            <div className='absolute top-0 inset-x-0 z-30 glass-header px-3 py-2 flex items-center justify-between'>
              <div className='flex items-center gap-2'>
                <Radio size={12} className={hasFeed ? 'text-emerald-500 animate-pulse' : 'text-red-500'} />
                <span className='text-[10px] font-black uppercase text-slate-200 tracking-widest'>{dir} MONITOR</span>
              </div>
              <div className='flex items-center gap-3'>
                <div className='flex items-center gap-1.5 bg-black/40 px-2 py-0.5 rounded border border-white/5'>
                  <Car size={10} className='text-indigo-400' />
                  <span className='text-[10px] font-mono font-bold text-slate-300'>{counts?.[dir] || 0}</span>
                </div>
                {isSelected && (
                  <div className='bg-emerald-500/20 px-2 py-0.5 rounded text-[9px] font-black text-emerald-400 border border-emerald-500/30'>
                    ACTIVE
                  </div>
                )}
              </div>
            </div>

            {/* OVERLAY: SIGNAL LAMPS & LED COUNTDOWN */}
            <div className='absolute bottom-3 left-3 z-30 flex items-center gap-3 bg-black/80 backdrop-blur-md p-2 rounded-xl border border-white/10 shadow-[0_0_20px_rgba(0,0,0,0.5)]'>
              <div className='flex gap-2 px-1'>
                <div className={`w-3 h-3 rounded-full ${sig === 'RED' ? 'bg-red-500 shadow-[0_0_12px_rgba(239,68,68,0.7)]' : 'bg-red-950'}`} />
                <div className={`w-3 h-3 rounded-full ${sig === 'YELLOW' ? 'bg-yellow-400 shadow-[0_0_12px_rgba(250,204,21,0.7)]' : 'bg-yellow-950'}`} />
                <div className={`w-3 h-3 rounded-full ${sig === 'GREEN' ? 'bg-emerald-500 shadow-[0_0_12px_rgba(16,185,129,0.7)]' : 'bg-emerald-950'}`} />
              </div>
              <div className='w-[1px] h-4 bg-white/10' />
              <div className={`flex flex-col items-center justify-center min-w-[34px] leading-none`}>
                <span className={`text-[12px] font-black font-mono tracking-tighter ${timerInfo.color}`}>
                  {timerInfo.text}
                </span>
                <span className='text-[7px] font-bold text-slate-500 uppercase mt-0.5 tracking-widest'>SEC</span>
              </div>
            </div>

            {/* VIDEO FEED */}
            {hasFeed ? (
              <img
                src={`data:image/jpeg;base64,${feeds[dir]}`}
                className={`w-full h-full object-cover transition-all duration-1000 pt-8 ${is_night ? 'brightness-75' : ''}`}
                alt={dir}
              />
            ) : (
              <div className='w-full h-full bg-slate-900/50 flex flex-col items-center justify-center p-6 text-center pt-8'>
                <AlertTriangle size={36} className='text-red-500 opacity-20 mb-3' />
                <h4 className='text-[10px] font-black text-red-300 uppercase tracking-widest mb-1'>Offline</h4>
                <button 
                  onClick={() => reconnectCamera(dir)}
                  className='mt-4 px-4 py-1.5 bg-indigo-600/10 hover:bg-indigo-600 border border-indigo-500/20 text-indigo-300 hover:text-white text-[9px] font-bold rounded-lg transition-all active-press'>
                  RECONNECT
                </button>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
