// ============================================================
// PlaybackBar.jsx
// ------------------------------------------------------------
// Session playback controller:
// - Play/Pause (live vs history)
// - Slider to scrub through history
// ============================================================

import React from 'react';
import { Play, Pause, History } from 'lucide-react';

export default function PlaybackBar({
  history,
  isPlayback,
  playbackIndex,
  onTogglePlayback,
  onSeek,
}) {
  const total = history.length;

  const current =
    total > 0 && history[playbackIndex]
      ? new Date(history[playbackIndex].timestamp)
      : null;

  const label =
    current &&
    current.toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });

  return (
    <div className='w-full rounded-2xl border bg-slate-950/70 border-slate-800 px-3 py-2 flex flex-col gap-2 shadow-inner'>
      <div className='flex items-center justify-between text-[11px] text-slate-400'>
        <div className='flex items-center gap-2 uppercase tracking-[0.2em]'>
          <History size={12} />
          <span>Playback</span>
        </div>
        <div className='text-[10px] text-slate-500'>
          {isPlayback
            ? label
              ? `Playback @ ${label}`
              : 'Playback'
            : 'Live Stream'}
        </div>
      </div>

      <div className='flex items-center gap-2'>
        <button
          onClick={onTogglePlayback}
          className={`flex items-center justify-center w-8 h-8 rounded-full border text-xs ${
            isPlayback
              ? 'bg-emerald-700/70 border-emerald-400 text-emerald-50'
              : 'bg-slate-800 border-slate-600 text-slate-200'
          }`}>
          {isPlayback ? <Pause size={14} /> : <Play size={14} />}
        </button>

        <input
          type='range'
          min={0}
          max={Math.max(0, total - 1)}
          value={total === 0 ? 0 : playbackIndex}
          disabled={!isPlayback || total === 0}
          onChange={e => onSeek(Number(e.target.value))}
          className='flex-1 accent-emerald-400 disabled:opacity-40'
        />
      </div>
    </div>
  );
}
