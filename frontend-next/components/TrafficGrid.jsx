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
    <div className='flex-1 relative grid grid-cols-1 md:grid-cols-2 gap-3 min-h-0'>
      {directions.map(dir => {
        const hasFeed = Boolean(feeds?.[dir]);
        const sig = getSignalState(dir);
        const timerInfo = getTimerInfo(dir);
        const isSelected = active_dir === dir;

        return (
          <div
            key={dir}
            className={`
              relative bg-black rounded-2xl overflow-hidden 
              border-[3px] transition-all duration-700
              ${isSelected ? 'border-indigo-500 shadow-lg shadow-indigo-500/20' : 'border-slate-800'}
              ${obstacle_zone === dir ? 'border-orange-500 animate-pulse' : ''}
              aspect-video group
            `}>
            {/* ... Rest of your component elements ... */}
            {/* OVERLAY: UPPER LEFT (Direction & Status) */}
            <div className='absolute top-2 left-2 z-20 flex gap-2'>
              <div className='bg-black/80 backdrop-blur-md px-2.5 py-1 rounded-lg border border-slate-700 flex items-center gap-2'>
                <Radio size={12} className={hasFeed ? 'text-emerald-500 animate-pulse' : 'text-red-500'} />
                <span className='text-[10px] font-black uppercase text-slate-200 tracking-tighter'>{dir} FEED</span>
              </div>
              {isSelected && (
                <div className='bg-emerald-500 px-2 py-1 rounded-md text-[10px] font-black text-black animate-bounce'>
                  ACTIVE
                </div>
              )}
            </div>

            {/* OVERLAY: UPPER RIGHT (Vehicle Count) */}
            <div className='absolute top-2 right-2 z-20 flex items-center gap-2 bg-black/60 backdrop-blur px-2 py-1 rounded-lg border border-white/10'>
              <Car size={14} className='text-indigo-400' />
              <span className='text-xs font-mono font-bold text-white'>{counts?.[dir] || 0}</span>
            </div>

            {/* OVERLAY: SIGNAL LAMPS & TIMER */}
            <div className='absolute bottom-2 left-2 z-20 flex items-center gap-2 bg-black/80 backdrop-blur-xl p-1.5 rounded-xl border border-white/10 shadow-2xl'>
              <div className='flex gap-1.5 px-2'>
                <div className={`w-3 h-3 rounded-full border border-black shadow-inner ${sig === 'RED' ? 'bg-red-500 shadow-[0_0_12px_rgba(239,68,68,0.8)]' : 'bg-red-950'}`} />
                <div className={`w-3 h-3 rounded-full border border-black shadow-inner ${sig === 'YELLOW' ? 'bg-yellow-400 shadow-[0_0_12px_rgba(250,204,21,0.8)]' : 'bg-yellow-950'}`} />
                <div className={`w-3 h-3 rounded-full border border-black shadow-inner ${sig === 'GREEN' ? 'bg-emerald-500 shadow-[0_0_12px_rgba(16,185,129,0.8)]' : 'bg-emerald-950'}`} />
              </div>
              <div className='w-[1px] h-4 bg-slate-700' />
              <div className={`text-sm font-black font-mono transition-colors min-w-[32px] text-center ${timerInfo.color}`}>
                {timerInfo.text}
              </div>
            </div>

            {/* VIDEO FEED */}
            {hasFeed ? (
              <img
                src={`data:image/jpeg;base64,${feeds[dir]}`}
                className={`w-full h-full object-cover transition-all duration-1000 ${is_night ? 'brightness-75' : ''}`}
                alt={dir}
              />
            ) : (
              <div className='w-full h-full bg-slate-900 flex flex-col items-center justify-center p-6 text-center'>
                <AlertTriangle size={48} className='text-red-500 opacity-20 mb-4' />
                <h4 className='text-xs font-black text-red-300 uppercase tracking-widest mb-1'>Signal Lost</h4>
                <p className='text-[9px] text-slate-500 uppercase mb-4'>Encoder sync failure</p>
                <button 
                  onClick={() => reconnectCamera(dir)}
                  className='px-4 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white text-[10px] font-bold rounded-lg transition-transform active:scale-95 shadow-lg shadow-indigo-600/20'>
                  FORCE RECONNECT
                </button>
              </div>
            )}
            <div className='absolute inset-0 pointer-events-none opacity-[0.03] bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%),linear-gradient(90deg,rgba(255,0,0,0.06),rgba(0,255,0,0.02),rgba(0,0,255,0.06))] bg-[length:100%_4px,3px_100%]' />
          </div>
        );
      })}
    </div>
  );
}
