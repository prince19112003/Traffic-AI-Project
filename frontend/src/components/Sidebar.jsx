import React from 'react';
import {
  Lock,
  StopCircle,
  PlayCircle,
  BarChart3,
  ShieldAlert,
} from 'lucide-react';

export default function Sidebar({ analytics, violations, sendCommand }) {
  const totalVehicles = Object.values(analytics).reduce((a, b) => a + b, 0);
  const getPercent = val => (totalVehicles ? (val / totalVehicles) * 100 : 0);

  return (
    <aside className='w-80 bg-slate-900/40 border border-slate-800 rounded-2xl p-4 flex flex-col backdrop-blur-md shadow-2xl gap-4'>
      {/* Manual Control Panel */}
      <div className='bg-slate-950/50 p-4 rounded-xl border border-slate-800'>
        <h2 className='text-xs font-bold text-slate-400 uppercase tracking-widest mb-3 flex items-center gap-2'>
          <Lock size={14} /> Admin Controls
        </h2>
        <div className='grid grid-cols-2 gap-2 mb-2'>
          {['NORTH', 'EAST', 'WEST', 'SOUTH'].map(d => (
            <button
              key={d}
              onClick={() => sendCommand(`FORCE_${d}`)}
              className='bg-slate-800 hover:bg-purple-900 border border-slate-700 hover:border-purple-500 text-[10px] py-2 rounded transition text-slate-200'>
              FORCE {d}
            </button>
          ))}
        </div>
        <div className='flex gap-2'>
          <button
            onClick={() => sendCommand('STOP_ALL')}
            className='flex-1 bg-red-900/30 hover:bg-red-900 border border-red-800 text-red-200 text-[10px] py-2 rounded transition flex items-center justify-center gap-2'>
            <StopCircle size={14} /> ALL STOP
          </button>
          <button
            onClick={() => sendCommand('AUTO')}
            className='flex-1 bg-green-900/30 hover:bg-green-900 border border-green-800 text-green-200 text-[10px] py-2 rounded transition flex items-center justify-center gap-2'>
            <PlayCircle size={14} /> AUTO
          </button>
        </div>
      </div>

      {/* Live Analytics */}
      <div className='bg-slate-950/50 p-4 rounded-xl border border-slate-800'>
        <h2 className='text-xs font-bold text-slate-400 uppercase tracking-widest mb-3 flex items-center gap-2'>
          <BarChart3 size={14} /> Live Composition
        </h2>
        <div className='space-y-3'>
          {Object.entries(analytics).map(([key, val]) => (
            <div key={key}>
              <div className='flex justify-between text-xs mb-1'>
                <span className='uppercase text-slate-400'>{key}</span>
                <span className='text-slate-200 font-mono'>{val}</span>
              </div>
              <div className='w-full h-1.5 bg-slate-800 rounded-full overflow-hidden'>
                <div
                  className='h-full bg-indigo-500 transition-all duration-500'
                  style={{ width: `${getPercent(val)}%` }}></div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Violations Log */}
      <div className='flex-1 overflow-y-auto min-h-0 bg-slate-950/30 rounded-xl border border-slate-800 p-2 custom-scrollbar'>
        <h2 className='text-xs font-bold text-red-400 uppercase tracking-widest mb-3 sticky top-0 bg-slate-900/90 p-2 rounded backdrop-blur z-10 flex gap-2'>
          <ShieldAlert size={14} /> Alerts Log
        </h2>
        {violations.map(v => (
          <div
            key={v.id}
            className='mb-2 bg-slate-900 p-2 rounded border border-red-900/30 flex gap-3'>
            <div className='w-12 h-12 bg-slate-800 rounded overflow-hidden flex-shrink-0'>
              <img
                src={`data:image/jpeg;base64,${v.img}`}
                className='w-full h-full object-cover'
                alt='violation'
              />
            </div>
            <div>
              <div className='text-[10px] font-bold text-red-300 uppercase'>
                {v.dir} Violation
              </div>
              <div className='text-[10px] text-slate-500 font-mono'>
                {v.time}
              </div>
            </div>
          </div>
        ))}
      </div>
    </aside>
  );
}
