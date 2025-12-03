// ============================================================
// InsightsPanel.jsx
// ------------------------------------------------------------
// Simple analytics summary over recent history:
// - Busiest direction
// - Peak vehicle count
// - Rain mode ratio
// - Last emergency direction
// ============================================================

import React from 'react';

export default function InsightsPanel({ history }) {
  if (!history || history.length === 0) {
    return (
      <div className='p-3 rounded-xl border bg-slate-950/60 border-slate-800 text-[11px] text-slate-500'>
        Not enough data for insights yet.
      </div>
    );
  }

  let dirTotals = { north: 0, east: 0, south: 0, west: 0 };
  let peakCount = 0;
  let rainFrames = 0;
  let lastEmergency = null;

  history.forEach(item => {
    const snap = item.snapshot;
    const c = snap.counts || {};
    const l = snap.logic || {};
    const env = snap.env || {};

    ['north', 'east', 'south', 'west'].forEach(d => {
      const v = c[d] || 0;
      dirTotals[d] += v;
      if (v > peakCount) peakCount = v;
    });

    if (c.rain_trigger) rainFrames += 1;

    if (l.state === 'EMERGENCY' && l.active_dir) {
      lastEmergency = {
        dir: l.active_dir,
        time: new Date(item.timestamp),
      };
    }
  });

  const busiestDir = Object.entries(dirTotals).sort((a, b) => b[1] - a[1])[0];
  const rainRatio = Math.round((rainFrames / history.length) * 100);

  return (
    <div className='p-3 rounded-xl border bg-slate-950/60 border-slate-800 text-[11px] text-slate-200 space-y-2'>
      <div className='text-[10px] uppercase tracking-[0.25em] text-slate-400 mb-1'>
        AI Insights
      </div>

      <div className='flex justify-between'>
        <span className='text-slate-400'>Busiest Lane</span>
        <span className='font-mono text-slate-100'>
          {busiestDir ? busiestDir[0].toUpperCase() : '---'}
        </span>
      </div>

      <div className='flex justify-between'>
        <span className='text-slate-400'>Peak Count</span>
        <span className='font-mono text-slate-100'>{peakCount}</span>
      </div>

      <div className='flex justify-between'>
        <span className='text-slate-400'>Rain Mode Activity</span>
        <span className='font-mono text-slate-100'>{rainRatio}%</span>
      </div>

      <div className='flex justify-between'>
        <span className='text-slate-400'>Last Emergency</span>
        <span className='font-mono text-slate-100'>
          {lastEmergency
            ? `${lastEmergency.dir.toUpperCase()} @ ${lastEmergency.time.toLocaleTimeString()}`
            : 'None'}
        </span>
      </div>
    </div>
  );
}
