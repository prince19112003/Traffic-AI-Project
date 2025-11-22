import React, { useEffect, useState, useRef } from 'react';

/**
 * AdaptiveTrafficUI.jsx (Modified for Live Base64 Streaming)
 * * Changes:
 * - Removed <video> tag, added <img> for MJPEG stream via WebSocket.
 * - Handles 'telemetry' message type containing both counts and image.
 */

export default function AdaptiveTrafficUI({
  wsUrl = 'ws://localhost:8765',
  initialCounts = { north: 0, east: 0, south: 0, west: 0 },
}) {
  const [clock, setClock] = useState(new Date());
  const [connected, setConnected] = useState(false);
  const [signals, setSignals] = useState({
    north: 'RED',
    east: 'RED',
    south: 'RED',
    west: 'RED',
  });
  const [counts, setCounts] = useState(initialCounts);
  const [log, setLog] = useState([]);
  const [videoFrame, setVideoFrame] = useState(null); // State for live image
  const wsRef = useRef(null);

  // --- Clock ---
  useEffect(() => {
    const t = setInterval(() => setClock(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  // --- WebSocket ---
  useEffect(() => {
    if (!wsUrl) return;
    let ws;
    try {
      ws = new WebSocket(wsUrl);
      wsRef.current = ws;

      ws.onopen = () => {
        setConnected(true);
        pushLog('WebSocket connected.');
      };
      ws.onclose = () => {
        setConnected(false);
        pushLog('WebSocket disconnected.');
      };
      ws.onerror = e => {
        console.error(e);
        pushLog('WebSocket error (check console)');
      };
      ws.onmessage = ev => {
        handleWsMessage(ev.data);
      };
    } catch (err) {
      pushLog('WS init error: ' + err.message);
    }

    return () => {
      try {
        ws && ws.close();
      } catch {}
    };
  }, [wsUrl]);

  // --- Helpers ---
  function pushLog(text) {
    setLog(l =>
      [new Date().toLocaleTimeString() + ' — ' + text, ...l].slice(0, 10)
    ); // Kept log short
  }

  function handleWsMessage(raw) {
    try {
      const msg = JSON.parse(raw);

      // 1. Telemetry: Contains Image + Counts (Sync update)
      if (msg.type === 'telemetry') {
        if (msg.image) {
          setVideoFrame(`data:image/jpeg;base64,${msg.image}`);
        }
        if (msg.counts) {
          setCounts(c => ({ ...c, ...msg.counts }));
        }
        // Optional: Log count updates occasionally to avoid spam
        // pushLog(`Update: N:${msg.counts.north} E:${msg.counts.east}...`);
      }
      // 2. Signals: Traffic Light Updates
      else if (msg.type === 'signals') {
        setSignals(s => ({ ...s, ...msg }));
        pushLog(`Signals update received`);
      }
      // 3. Other messages
      else if (msg.type === 'info') {
        pushLog(msg.message);
      }
    } catch (e) {
      // Silent fail for partial JSON frames
    }
  }

  // --- Test Buttons ---
  function sendTestCommand(cmd) {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ command: cmd }));
      pushLog(`Sent command: ${cmd}`);
    }
  }

  // --- Styling Helpers ---
  function lightClass(state) {
    return (
      {
        RED: 'bg-red-500 shadow-red-800 shadow-lg',
        YELLOW: 'bg-yellow-400 shadow-yellow-600 shadow-lg',
        GREEN: 'bg-green-500 shadow-green-700 shadow-lg',
      }[state] || 'bg-gray-600'
    );
  }

  function totalCount() {
    return counts.north + counts.east + counts.south + counts.west;
  }

  // --- Mini Light Component ---
  function MiniLight({ label, state }) {
    return (
      <div className='flex items-center gap-3'>
        <div className='w-12 text-sm font-bold drop-shadow-md'>{label}</div>
        <div className='w-14 h-10 rounded-md bg-black/80 border border-gray-600 p-1 flex flex-col justify-between items-center shadow-xl'>
          <div
            className={`w-2.5 h-2.5 rounded-full ${
              state === 'RED' ? 'bg-red-500' : 'bg-gray-800'
            }`}></div>
          <div
            className={`w-2.5 h-2.5 rounded-full ${
              state === 'YELLOW' ? 'bg-yellow-400' : 'bg-gray-800'
            }`}></div>
          <div
            className={`w-2.5 h-2.5 rounded-full ${
              state === 'GREEN' ? 'bg-green-500' : 'bg-gray-800'
            }`}></div>
        </div>
      </div>
    );
  }

  return (
    <div className='min-h-screen bg-[#0f172a] text-slate-100 p-4 md:p-6 font-sans'>
      {/* Header */}
      <header className='max-w-7xl mx-auto mb-6 flex items-center justify-between'>
        <div>
          <h1 className='text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-indigo-500'>
            🚦 TrafficAI Vision
          </h1>
          <p className='text-sm text-slate-400'>
            Live YOLOv8 Analysis & Control
          </p>
        </div>
        <div className='flex items-center gap-4'>
          <div
            className={`px-3 py-1 rounded-full text-xs font-bold border ${
              connected
                ? 'bg-green-900/30 border-green-500 text-green-400'
                : 'bg-red-900/30 border-red-500 text-red-400'
            }`}>
            {connected ? '● ONLINE' : '○ OFFLINE'}
          </div>
          <div className='font-mono text-xl hidden md:block'>
            {clock.toLocaleTimeString()}
          </div>
        </div>
      </header>

      <main className='max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-6'>
        {/* LEFT: Video Feed (Live Stream) */}
        <section className='lg:col-span-8 space-y-4'>
          <div className='relative w-full aspect-video bg-black rounded-2xl overflow-hidden border border-slate-700 shadow-2xl'>
            {/* LIVE IMAGE */}
            {videoFrame ? (
              <img
                src={videoFrame}
                alt='Live Stream'
                className='w-full h-full object-contain'
              />
            ) : (
              <div className='absolute inset-0 flex items-center justify-center text-slate-500 flex-col gap-2'>
                <span className='text-4xl'>📷</span>
                <span>Waiting for stream...</span>
              </div>
            )}

            {/* Overlays */}
            <div className='absolute top-4 left-4 bg-black/70 backdrop-blur p-3 rounded-lg border border-white/10'>
              <div className='text-xs text-slate-400 uppercase tracking-wider'>
                Total Vehicles
              </div>
              <div className='text-2xl font-mono font-bold text-white'>
                {totalCount()}
              </div>
            </div>

            {/* Signal Overlays Positioned on Screen */}
            <div className='absolute top-2 left-1/2 -translate-x-1/2'>
              <MiniLight label='N' state={signals.north} />
            </div>
            <div className='absolute bottom-2 left-1/2 -translate-x-1/2'>
              <MiniLight label='S' state={signals.south} />
            </div>
            <div className='absolute left-2 top-1/2 -translate-y-1/2'>
              <MiniLight label='W' state={signals.west} />
            </div>
            <div className='absolute right-2 top-1/2 -translate-y-1/2'>
              <MiniLight label='E' state={signals.east} />
            </div>
          </div>

          {/* Density Bars */}
          <div className='grid grid-cols-4 gap-2'>
            {['north', 'east', 'south', 'west'].map(dir => (
              <div
                key={dir}
                className='bg-slate-800/50 p-3 rounded-xl border border-slate-700'>
                <div className='flex justify-between text-xs text-slate-400 uppercase mb-1'>
                  <span>{dir}</span>
                  <span>{counts[dir]}</span>
                </div>
                <div className='w-full bg-slate-700 h-2 rounded-full overflow-hidden'>
                  <div
                    className='bg-indigo-500 h-full transition-all duration-500'
                    style={{
                      width: `${Math.min(counts[dir] * 5, 100)}%`,
                    }}></div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* RIGHT: Controls & Logs */}
        <aside className='lg:col-span-4 space-y-4'>
          {/* Signal Status Card */}
          <div className='bg-slate-800/50 border border-slate-700 rounded-2xl p-5'>
            <h3 className='text-lg font-bold mb-4 flex items-center gap-2'>
              <span>🚥</span> Signal Logic
            </h3>
            <div className='grid grid-cols-2 gap-4'>
              {Object.entries(signals).map(([key, val]) => (
                <div
                  key={key}
                  className='flex items-center justify-between bg-slate-900 p-3 rounded-lg'>
                  <span className='uppercase text-xs font-bold text-slate-400'>
                    {key}
                  </span>
                  <span
                    className={`text-xs px-2 py-1 rounded font-bold ${
                      val === 'GREEN'
                        ? 'bg-green-900 text-green-400'
                        : val === 'YELLOW'
                        ? 'bg-yellow-900 text-yellow-400'
                        : 'bg-red-900 text-red-400'
                    }`}>
                    {val}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Backend Controls */}
          <div className='bg-slate-800/50 border border-slate-700 rounded-2xl p-5'>
            <h3 className='text-lg font-bold mb-3'>🛠 Controls</h3>
            <div className='flex gap-2'>
              <button
                onClick={() => sendTestCommand('reset')}
                className='flex-1 bg-slate-700 hover:bg-slate-600 py-2 rounded-lg text-sm transition'>
                Reset Counts
              </button>
              <button
                onClick={() => sendTestCommand('snap')}
                className='flex-1 bg-indigo-600 hover:bg-indigo-500 py-2 rounded-lg text-sm transition'>
                Snapshot
              </button>
            </div>
            <div className='mt-4'>
              <div className='text-xs text-slate-500 mb-1'>Connection URL</div>
              <code className='block w-full bg-black/30 p-2 rounded text-xs text-slate-300 break-all'>
                {wsUrl}
              </code>
            </div>
          </div>

          {/* Logs */}
          <div className='bg-black/40 border border-slate-700 rounded-2xl p-4 h-48 overflow-y-auto font-mono text-xs'>
            {log.map((l, i) => (
              <div
                key={i}
                className='mb-1 text-slate-400 border-b border-slate-800/50 pb-1 last:border-0'>
                {l}
              </div>
            ))}
          </div>
        </aside>
      </main>
    </div>
  );
}
