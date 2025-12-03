// ============================================================
// StatusBar.jsx  (FINAL UPDATED VERSION)
// ------------------------------------------------------------
// Displays real-time system state:
//
// ✔ Current MODE (AUTO / MANUAL / ECO / PRIORITY)
// ✔ Rain Mode / Obstacle / Predicted Violation Badges
// ✔ System Status Line (text message from backend)
// ✔ Next Direction + Timer
//
// Priority Order (highest → lowest):
//   1. Obstacle Zone
//   2. Predicted Violation
//   3. Emergency Mode
//   4. ECO Mode
//   5. Rain Mode
//   6. Normal Default
//
// Clean, responsive UI with glowing colors.
// ============================================================

import React from 'react';
import { Activity, TrafficCone, AlertTriangle } from 'lucide-react';

export default function StatusBar({ logic, env }) {
  // Extract backend logic state
  const { mode, status, next_dir, timer, predicted_violation_dir } =
    logic || {};

  // Extract environment flags
  const { weather_mode, obstacle_zone } = env || {};

  // ------------------------------------------------------------
  // Dynamic background color priority mapping
  // ------------------------------------------------------------
  let barColor =
    'bg-slate-900/70 border-slate-700 text-slate-200 shadow-[0_0_10px_rgba(15,23,42,0.7)]';

  if (obstacle_zone) {
    barColor =
      'bg-orange-900/80 border-orange-500/70 text-orange-100 shadow-[0_0_20px_rgba(249,115,22,0.7)]';
  } else if (predicted_violation_dir) {
    barColor =
      'bg-yellow-900/80 border-yellow-500/70 text-yellow-100 shadow-[0_0_20px_rgba(250,204,21,0.7)]';
  } else if (mode === 'PRIORITY') {
    barColor =
      'bg-red-900/80 border-red-500/70 text-red-100 shadow-[0_0_25px_rgba(239,68,68,0.7)]';
  } else if (mode === 'ECO') {
    barColor =
      'bg-emerald-900/80 border-emerald-500/70 text-emerald-100 shadow-[0_0_20px_rgba(16,185,129,0.7)]';
  } else if (weather_mode === 'RAIN') {
    barColor =
      'bg-cyan-900/70 border-cyan-500/70 text-cyan-100 shadow-[0_0_20px_rgba(34,211,238,0.7)]';
  }

  return (
    <div
      className={`w-full rounded-2xl px-4 py-2 border flex flex-col md:flex-row items-start md:items-center justify-between gap-2 text-xs md:text-[11px] backdrop-blur-md ${barColor}`}>
      {/* ============================================================
        LEFT SIDE: MODE + Badges (Obstacle, Rain, Predict)
      ============================================================ */}
      <div className='flex items-center gap-2 flex-wrap'>
        {/* MODE BADGE */}
        <span className='inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-black/30 border border-white/10 uppercase tracking-[0.2em] font-bold'>
          <Activity size={11} /> {mode}
        </span>

        {/* RAIN MODE */}
        {weather_mode === 'RAIN' && (
          <span className='inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-cyan-800/60 border border-cyan-400/60 uppercase tracking-[0.2em]'>
            Rain Mode
          </span>
        )}

        {/* OBSTACLE */}
        {obstacle_zone && (
          <span className='inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-orange-800/60 border border-orange-400/60 uppercase tracking-[0.2em]'>
            <TrafficCone size={11} /> Obstacle: {obstacle_zone.toUpperCase()}
          </span>
        )}

        {/* PREDICTED VIOLATION */}
        {predicted_violation_dir && (
          <span className='inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-yellow-800/60 border border-yellow-400/60 uppercase tracking-[0.2em]'>
            <AlertTriangle size={11} /> Predict:{' '}
            {predicted_violation_dir.toUpperCase()}
          </span>
        )}
      </div>

      {/* ============================================================
        CENTER: SYSTEM STATUS MESSAGE
      ============================================================ */}
      <div className='flex-1 text-[11px] text-slate-100 md:text-center font-mono'>
        {status || 'System Running'}
      </div>

      {/* ============================================================
        RIGHT: NEXT SIGNAL + TIMER
      ============================================================ */}
      <div className='flex items-center gap-2 text-[11px] font-mono'>
        {/* Next direction */}
        <span className='px-2 py-0.5 rounded-full bg-black/30 border border-white/10 uppercase'>
          Next: {next_dir ? next_dir.toUpperCase() : '---'}
        </span>

        {/* Countdown Timer */}
        <span className='px-2 py-0.5 rounded-full bg-black/30 border border-white/10'>
          T-
          {typeof timer === 'number' ? Math.max(0, Math.floor(timer)) : timer}s
        </span>
      </div>
    </div>
  );
}
