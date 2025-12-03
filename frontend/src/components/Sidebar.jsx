// ============================================================
// Sidebar.jsx (FINAL UPDATED VERSION)
// ------------------------------------------------------------
// CONTROL CENTER UI
//
// Contains:
// ✔ Simulation Mode Toggle
// ✔ Voice Alerts Toggle
// ✔ Command Buttons (FORCE_* / STOP_ALL / AUTO)
// ✔ Live Analytics bars
// ✔ Alerts list (warning center)
// ✔ Violation logs with snapshot previews
//
// Clean UI + smooth layout + minimalistic professional design
// ============================================================

import React from 'react';
import {
  Lock,
  Volume2,
  VolumeX,
  StopCircle,
  PlayCircle,
  BarChart3,
  ShieldAlert,
  Power,
} from 'lucide-react';

export default function Sidebar({
  analytics,
  violations,
  alerts,
  sendCommand,
  voiceEnabled,
  setVoiceEnabled,
  simulateMode,
  setSimulateMode,
}) {
  // ------------------------------------------------------------
  // Calculate percentage for analytics bar
  // ------------------------------------------------------------
  const total = Object.values(analytics || {}).reduce((a, b) => a + b, 0);

  const getPercent = v => (total === 0 ? 0 : Math.min(100, (v / total) * 100));

  return (
    <aside className='w-full md:w-80 rounded-2xl p-4 flex flex-col backdrop-blur-xl border transition-all duration-500 bg-slate-900/70 border-slate-800 shadow-2xl'>
      {/* ============================================================
          SECTION 1 — ADMIN PANEL
      ============================================================ */}
      <div className='p-4 rounded-xl border mb-4 bg-slate-950/50 border-slate-800'>
        {/* Header Row */}
        <div className='flex items-center justify-between mb-3'>
          <h2 className='text-xs font-bold text-slate-400 uppercase tracking-[0.25em] flex items-center gap-2'>
            <Lock size={14} /> Admin Controls
          </h2>

          {/* Voice Toggle */}
          <button
            onClick={() => setVoiceEnabled(!voiceEnabled)}
            className={`flex items-center gap-1 px-2 py-1 rounded-full text-[10px] border ${
              voiceEnabled
                ? 'bg-green-900/50 border-green-500 text-green-200'
                : 'bg-slate-800/60 border-slate-600 text-slate-300'
            }`}>
            {voiceEnabled ? (
              <>
                <Volume2 size={12} /> VOICE ON
              </>
            ) : (
              <>
                <VolumeX size={12} /> VOICE OFF
              </>
            )}
          </button>
        </div>

        {/* Simulation Mode Toggle */}
        <button
          onClick={() => setSimulateMode(!simulateMode)}
          className={`w-full mb-3 py-2.5 rounded-lg text-[10px] font-bold border flex items-center justify-center gap-2 transition ${
            simulateMode
              ? 'bg-yellow-900/60 border-yellow-500 text-yellow-100'
              : 'bg-slate-800/60 border-slate-600 text-slate-300'
          }`}>
          <Power size={14} />
          {simulateMode ? 'SIMULATION MODE: ON' : 'SIMULATION MODE: OFF'}
        </button>

        {/* FORCE buttons */}
        <div className='grid grid-cols-2 gap-2 mb-2'>
          {['NORTH', 'EAST', 'SOUTH', 'WEST'].map(dir => (
            <button
              key={dir}
              onClick={() => sendCommand(`FORCE_${dir}`)}
              className='text-[10px] py-2.5 rounded-lg transition font-bold border bg-slate-800 border-slate-700 text-slate-200 hover:bg-indigo-600 hover:border-indigo-500 hover:text-white'>
              FORCE {dir}
            </button>
          ))}
        </div>

        {/* STOP_ALL + AUTO */}
        <div className='flex gap-2'>
          <button
            onClick={() => sendCommand('STOP_ALL')}
            className='flex-1 bg-red-900/40 hover:bg-red-700 border border-red-800 text-red-200 hover:text-white text-[10px] py-2.5 rounded-lg transition font-bold flex items-center justify-center gap-2'>
            <StopCircle size={14} /> ALL STOP
          </button>

          <button
            onClick={() => sendCommand('AUTO')}
            className='flex-1 bg-green-900/40 hover:bg-green-700 border border-green-800 text-green-200 hover:text-white text-[10px] py-2.5 rounded-lg transition font-bold flex items-center justify-center gap-2'>
            <PlayCircle size={14} /> AUTO
          </button>
        </div>
      </div>

      {/* ============================================================
          SECTION 2 — ANALYTICS
      ============================================================ */}
      <div className='p-4 rounded-xl border mb-4 bg-slate-950/50 border-slate-800'>
        <h2 className='text-xs font-bold text-slate-400 uppercase tracking-[0.25em] mb-3 flex items-center gap-2'>
          <BarChart3 size={14} /> Live Composition
        </h2>

        <div className='space-y-3'>
          {Object.entries(analytics || {}).map(([key, val]) => (
            <div key={key}>
              {/* Label Row */}
              <div className='flex justify-between text-[10px] mb-1'>
                <span className='uppercase text-slate-400'>{key}</span>
                <span className='text-slate-200 font-mono'>{val}</span>
              </div>

              {/* Bar */}
              <div className='w-full h-1.5 bg-slate-800 rounded-full overflow-hidden'>
                <div
                  className='h-full bg-indigo-500 transition-all duration-700'
                  style={{ width: `${getPercent(val)}%` }}></div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ============================================================
          SECTION 3 — ALERT CENTER
      ============================================================ */}
      <div className='p-3 rounded-xl border mb-4 max-h-40 overflow-y-auto bg-slate-950/40 border-slate-800 custom-scroll'>
        <h2 className='text-xs font-bold text-yellow-400 uppercase tracking-[0.25em] mb-2 flex items-center gap-2 sticky top-0 bg-slate-900/10 backdrop-blur z-10'>
          <ShieldAlert size={14} /> Alert Center
        </h2>

        {alerts && alerts.length > 0 ? (
          alerts.map(a => (
            <div
              key={a.id}
              className='mb-2 text-[11px] bg-black/40 border border-yellow-500/30 rounded-lg px-2 py-1'>
              {a.message}
            </div>
          ))
        ) : (
          <div className='text-[10px] text-slate-500 italic'>
            No active alerts
          </div>
        )}
      </div>

      {/* ============================================================
          SECTION 4 — VIOLATION LOG
      ============================================================ */}
      <div className='flex-1 overflow-y-auto min-h-[160px] rounded-xl border p-2 custom-scroll bg-slate-950/40 border-slate-800'>
        <h2 className='text-xs font-bold text-red-400 uppercase tracking-[0.25em] mb-3 sticky top-0 bg-slate-900/90 p-2 rounded-lg backdrop-blur z-10 flex gap-2'>
          <ShieldAlert size={14} /> Violations
        </h2>

        {violations.length === 0 ? (
          <div className='text-center text-[10px] text-slate-600 py-6 italic'>
            No violations recorded
          </div>
        ) : (
          violations.map(v => (
            <div
              key={v.id}
              className='mb-2 bg-slate-900/80 p-2 rounded border border-red-900/40 flex gap-3 items-center'>
              {/* Snapshot */}
              <div className='w-12 h-12 bg-slate-800 rounded overflow-hidden flex-shrink-0'>
                {v.img ? (
                  <img
                    src={`data:image/jpeg;base64,${v.img}`}
                    className='w-full h-full object-cover'
                    alt='violation'
                  />
                ) : (
                  <div className='w-full h-full flex items-center justify-center text-[9px] text-slate-500'>
                    No Image
                  </div>
                )}
              </div>

              {/* Info */}
              <div>
                <div className='text-[10px] font-bold text-red-300 uppercase'>
                  {v.dir} Violation
                </div>
                <div className='text-[10px] text-slate-500 font-mono'>
                  {v.time}
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </aside>
  );
}
