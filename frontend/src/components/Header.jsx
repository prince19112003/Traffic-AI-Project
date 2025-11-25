import React from 'react';
import { Activity, Siren, Lock, Moon, Sun } from 'lucide-react';

export default function Header({ connected, isEmergency, isManual, isNight }) {
  return (
    <header className='flex justify-between items-center bg-slate-900/60 p-4 rounded-2xl border border-slate-800/60 mb-4 backdrop-blur-md shadow-lg'>
      <div className='flex items-center gap-4'>
        {/* Status Icon Box */}
        <div
          className={`p-3 rounded-xl shadow-lg transition-all duration-500 ${
            isEmergency
              ? 'bg-blue-600 animate-bounce'
              : isManual
              ? 'bg-purple-600'
              : 'bg-indigo-600'
          }`}>
          {isEmergency ? (
            <Siren className='text-white w-6 h-6' />
          ) : isManual ? (
            <Lock className='text-white w-6 h-6' />
          ) : (
            <Activity className='text-white w-6 h-6' />
          )}
        </div>

        {/* Title & Mode Text */}
        <div>
          <h1 className='text-2xl font-bold text-white tracking-tight'>
            Traffic<span className='text-indigo-400'>Guard</span>{' '}
            <span className='text-slate-500 font-light'>Ultra</span>
          </h1>
          <div className='flex gap-2 items-center'>
            <p className='text-[10px] text-slate-400 uppercase tracking-[0.2em] font-bold'>
              {isManual ? 'MANUAL OVERRIDE' : 'AUTONOMOUS MODE'}
            </p>
            {isNight && (
              <span className='text-[10px] bg-indigo-900 text-indigo-300 px-2 rounded-full flex items-center gap-1'>
                <Moon size={10} /> NIGHT VISION
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Right Side Statuses */}
      <div className='flex gap-4 items-center'>
        <div className='flex items-center gap-2 bg-slate-800/50 px-3 py-1 rounded-full border border-slate-700'>
          {isNight ? (
            <Moon size={16} className='text-indigo-400' />
          ) : (
            <Sun size={16} className='text-yellow-400' />
          )}
          <span className='text-xs font-bold text-slate-300'>
            {isNight ? 'NIGHT' : 'DAY'}
          </span>
        </div>

        <div
          className={`text-xs font-bold px-3 py-1 rounded-full ${
            connected
              ? 'bg-green-900/50 text-green-400 border border-green-800'
              : 'bg-red-900/50 text-red-400'
          }`}>
          {connected ? '● LIVE' : '○ OFFLINE'}
        </div>
      </div>
    </header>
  );
}
