// ============================================================
// Header.jsx  (FINAL UPDATED)
// ------------------------------------------------------------
// Top bar of the dashboard.
//
// Shows:
// ✅ App Branding (TRAFFIC GUARD ULTRA)
// ✅ System Mode Indicator (LIVE / SIMULATION / OFFLINE)
// ✅ Emergency / Manual / Normal status icon
// ✅ Day / Night chip
// ✅ Weather chip (CLEAR / RAIN / NIGHT)
// ============================================================

import React from 'react';
import {
  Activity,
  Siren,
  Lock,
  Moon,
  Sun,
  CloudRain,
  Cloud,
} from 'lucide-react';

export default function Header({
  connected, // true → WebSocket backend connected
  simulateMode, // true → simulation mode ON
  isEmergency, // true → current state is EMERGENCY
  isManual, // true → logic.mode === 'MANUAL'
  isNight, // from env.is_night
  weatherMode, // 'CLEAR' | 'RAIN' | 'NIGHT'
}) {
  // ------------------------------------------------------------
  // Decide weather icon + label
  // ------------------------------------------------------------
  const renderWeatherIcon = () => {
    if (weatherMode === 'RAIN') {
      return (
        <>
          <CloudRain size={14} className='text-cyan-400' />
          <span>RAIN</span>
        </>
      );
    }
    if (weatherMode === 'NIGHT') {
      return (
        <>
          <Moon size={14} className='text-indigo-300' />
          <span>NIGHT</span>
        </>
      );
    }
    return (
      <>
        <Cloud size={14} className='text-slate-300' />
        <span>CLEAR</span>
      </>
    );
  };

  // ------------------------------------------------------------
  // Status Icon:
  // EMERGENCY > MANUAL > NORMAL
  // ------------------------------------------------------------
  const renderStatusIcon = () => {
    if (isEmergency) {
      return <Siren className='text-white w-6 h-6' />;
    }
    if (isManual) {
      return <Lock className='text-white w-6 h-6' />;
    }
    return <Activity className='text-white w-6 h-6' />;
  };

  // ------------------------------------------------------------
  // Connection Mode Chip:
  // - LIVE: backend connected + not in simulation
  // - SIMULATION: simulateMode === true
  // - OFFLINE: backend disconnected and sim off
  // ------------------------------------------------------------
  let modeLabel = 'OFFLINE';
  let modeClasses = 'bg-slate-900/60 text-slate-300 border border-slate-600/70';
  let dotClasses = 'bg-slate-500 shadow-[0_0_8px_rgba(148,163,184,0.9)]';

  if (simulateMode) {
    modeLabel = 'SIMULATION';
    modeClasses =
      'bg-yellow-900/40 text-yellow-200 border border-yellow-500/60';
    dotClasses = 'bg-yellow-400 shadow-[0_0_8px_rgba(250,204,21,0.9)]';
  } else if (connected) {
    modeLabel = 'LIVE';
    modeClasses = 'bg-green-900/40 text-green-300 border border-green-500/60';
    dotClasses = 'bg-green-400 shadow-[0_0_8px_rgba(74,222,128,0.9)]';
  }

  return (
    <header className='flex flex-col md:flex-row justify-between items-center p-4 rounded-2xl border mb-2 backdrop-blur-xl shadow-2xl transition-all duration-500 bg-slate-900/70 border-slate-700/70'>
      {/* ============================================================
        LEFT : LOGO + TITLE + STATUS ICON
      ============================================================ */}
      <div className='flex items-center gap-4 w-full md:w-auto justify-between md:justify-start mb-3 md:mb-0'>
        {/* Colored Status Icon Block */}
        <div
          className={`p-3 rounded-xl shadow-lg transition-all duration-500 ${
            isEmergency
              ? 'bg-red-600 animate-pulse'
              : isManual
              ? 'bg-purple-600'
              : 'bg-indigo-600'
          }`}>
          {renderStatusIcon()}
        </div>

        {/* Title + Subtitle */}
        <div className='text-left'>
          <h1 className='text-xl md:text-2xl font-black tracking-tight text-white'>
            TRAFFIC
            <span className='text-indigo-400'> GUARD</span>{' '}
            <span className='text-slate-400 font-light'>ULTRA</span>
          </h1>

          <p className='text-[11px] text-slate-400 uppercase tracking-[0.25em] font-semibold'>
            Adaptive Traffic Management Dashboard
          </p>
        </div>
      </div>

      {/* ============================================================
        RIGHT : ENVIRONMENT CHIPS + CONNECTION STATUS
      ============================================================ */}
      <div className='flex items-center gap-3 w-full md:w-auto justify-end flex-wrap md:flex-nowrap'>
        {/* Night / Day Chip */}
        <div className='flex items-center gap-2 px-3 py-1.5 rounded-full border text-[11px] font-semibold bg-slate-800/60 border-slate-600 text-slate-200'>
          {isNight ? (
            <Moon size={14} className='text-indigo-400' />
          ) : (
            <Sun size={14} className='text-yellow-400' />
          )}
          <span>{isNight ? 'NIGHT' : 'DAY'}</span>
        </div>

        {/* Weather Chip */}
        <div className='flex items-center gap-2 px-3 py-1.5 rounded-full border text-[11px] font-semibold bg-slate-800/60 border-slate-600 text-slate-200'>
          {renderWeatherIcon()}
        </div>

        {/* Connection / Mode Chip */}
        <div
          className={`text-xs font-bold px-3 py-1 rounded-full flex items-center gap-2 ${modeClasses}`}>
          {/* Status dot */}
          <span className={`w-2 h-2 rounded-full ${dotClasses}`} />

          {/* Label text */}
          {modeLabel}
        </div>
      </div>
    </header>
  );
}
