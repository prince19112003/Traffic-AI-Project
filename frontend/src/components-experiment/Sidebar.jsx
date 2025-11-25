import React from 'react';
import {
  Lock,
  StopCircle,
  PlayCircle,
  BarChart3,
  ShieldAlert,
} from 'lucide-react';

export default function Sidebar({
  analytics,
  violations,
  sendCommand,
  cyberpunkMode,
}) {
  const totalVehicles = Object.values(analytics).reduce((a, b) => a + b, 0);
  const getPercent = val => (totalVehicles ? (val / totalVehicles) * 100 : 0);

  return (
    <aside
      className={`w-full md:w-80 rounded-2xl p-5 flex flex-col gap-5 backdrop-blur-xl border transition-all duration-500 ${
        cyberpunkMode
          ? 'bg-black/60 border-cyan-500/30 shadow-[0_0_30px_rgba(0,0,0,0.5)]'
          : 'bg-slate-900/60 border-slate-700 shadow-2xl'
      }`}>
      {/* Manual Control Panel */}
      <div
        className={`p-4 rounded-xl border ${
          cyberpunkMode
            ? 'bg-black/40 border-purple-500/30'
            : 'bg-slate-800/40 border-slate-700'
        }`}>
        <h2
          className={`text-xs font-bold uppercase tracking-widest mb-4 flex items-center gap-2 ${
            cyberpunkMode ? 'text-purple-400' : 'text-slate-400'
          }`}>
          <Lock size={14} /> Command Center
        </h2>
        <div className='grid grid-cols-2 gap-2 mb-3'>
          {['NORTH', 'EAST', 'WEST', 'SOUTH'].map(d => (
            <button
              key={d}
              onClick={() => sendCommand(`FORCE_${d}`)}
              className={`text-[10px] py-2.5 rounded-lg transition font-bold border ${
                cyberpunkMode
                  ? 'bg-purple-900/20 border-purple-500/50 text-purple-200 hover:bg-purple-500 hover:text-white'
                  : 'bg-slate-700 border-slate-600 text-slate-300 hover:bg-indigo-600 hover:text-white hover:border-indigo-500'
              }`}>
              FORCE {d}
            </button>
          ))}
        </div>
        <div className='flex gap-2'>
          <button
            onClick={() => sendCommand('STOP_ALL')}
            className='flex-1 bg-red-500/10 hover:bg-red-600 border border-red-500/50 hover:border-red-500 text-red-400 hover:text-white text-[10px] py-2.5 rounded-lg transition font-bold flex items-center justify-center gap-2'>
            <StopCircle size={14} /> ALL STOP
          </button>
          <button
            onClick={() => sendCommand('AUTO')}
            className='flex-1 bg-green-500/10 hover:bg-green-600 border border-green-500/50 hover:border-green-500 text-green-400 hover:text-white text-[10px] py-2.5 rounded-lg transition font-bold flex items-center justify-center gap-2'>
            <PlayCircle size={14} /> AUTO MODE
          </button>
        </div>
      </div>

      {/* Live Analytics */}
      <div
        className={`p-4 rounded-xl border ${
          cyberpunkMode
            ? 'bg-black/40 border-cyan-500/30'
            : 'bg-slate-800/40 border-slate-700'
        }`}>
        <h2
          className={`text-xs font-bold uppercase tracking-widest mb-4 flex items-center gap-2 ${
            cyberpunkMode ? 'text-cyan-400' : 'text-slate-400'
          }`}>
          <BarChart3 size={14} /> Live Traffic Data
        </h2>
        <div className='space-y-3'>
          {Object.entries(analytics).map(([key, val]) => (
            <div key={key}>
              <div className='flex justify-between text-[10px] mb-1 font-bold'>
                <span className='uppercase text-slate-500'>{key}</span>
                <span
                  className={
                    cyberpunkMode ? 'text-cyan-300' : 'text-slate-200'
                  }>
                  {val}
                </span>
              </div>
              <div className='w-full h-1.5 bg-slate-700/50 rounded-full overflow-hidden'>
                <div
                  className={`h-full transition-all duration-1000 ease-out ${
                    cyberpunkMode
                      ? 'bg-gradient-to-r from-cyan-500 to-purple-500'
                      : 'bg-indigo-500'
                  }`}
                  style={{ width: `${getPercent(val)}%` }}></div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Violations Log */}
      <div
        className={`flex-1 overflow-y-auto min-h-[200px] rounded-xl border p-2 custom-scrollbar ${
          cyberpunkMode
            ? 'bg-black/40 border-red-500/20'
            : 'bg-slate-800/30 border-slate-700'
        }`}>
        <h2 className='text-xs font-bold text-red-400 uppercase tracking-widest mb-3 sticky top-0 p-2 rounded backdrop-blur z-10 flex gap-2'>
          <ShieldAlert size={14} /> Violations
        </h2>
        {violations.length === 0 && (
          <div className='text-center text-[10px] text-slate-600 py-8 italic'>
            No violations recorded
          </div>
        )}
        {violations.map(v => (
          <div
            key={v.id}
            className={`mb-2 p-2 rounded border flex gap-3 transition hover:scale-[1.02] ${
              cyberpunkMode
                ? 'bg-red-900/10 border-red-500/30'
                : 'bg-slate-900/50 border-red-900/30'
            }`}>
            <div className='w-10 h-10 bg-black rounded-lg overflow-hidden flex-shrink-0 border border-white/10'>
              <img
                src={`data:image/jpeg;base64,${v.img}`}
                className='w-full h-full object-cover'
              />
            </div>
            <div>
              <div className='text-[10px] font-bold text-red-400 uppercase tracking-wide'>
                {v.dir} JUMP
              </div>
              <div className='text-[9px] text-slate-500 font-mono'>
                {v.time}
              </div>
            </div>
          </div>
        ))}
      </div>
    </aside>
  );
}
