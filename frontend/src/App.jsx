// ============================================================
// App.jsx  (FINAL CLEAN + FIXED HUD VERSION)
// ------------------------------------------------------------
// Main React entry for "TRAFFIC GUARD ULTRA"
//
// Features:
// ✔ WebSocket LIVE mode + Simulation mode
// ✔ Voice alerts + Beep tones
// ✔ History system + Playback slider
// ✔ Layout toggle (GRID / CARD)
// ✔ MiniMap + StatusBar + CentralSignalHUD
// ✔ Central HUD exactly TrafficGrid ke beech center me
// ============================================================

import React, { useEffect, useRef, useState } from 'react';
import Header from './components/Header';
import StatusBar from './components/StatusBar';
import TrafficGrid from './components/TrafficGrid';
import Sidebar from './components/Sidebar';
import MiniMap from './components/MiniMap';
import PlaybackBar from './components/PlaybackBar';
import CentralSignalHUD from './components/CentralSignalHUD'; // ✅ NEW IMPORT

export default function App() {
  // ============================================================
  // 1. Live Data (Backend Mirror)
  // ============================================================
  const [data, setData] = useState({
    feeds: {},
    counts: {
      north: 5,
      east: 2,
      south: 8,
      west: 1,
      rain_trigger: 0,
      person: 0,
    },
    logic: {
      active_dir: 'north',
      next_dir: 'east',
      state: 'GREEN',
      timer: 20,
      mode: 'AUTO',
      status: 'System Initializing...',
      signal_map: { north: 'GREEN', east: 'RED', south: 'RED', west: 'RED' },
      predicted_violation_dir: null,
    },
    analytics: { car: 120, bike: 45, bus: 12, truck: 5 },
    env: { obstacle_zone: null, is_night: false, weather_mode: 'CLEAR' },
  });

  const [connected, setConnected] = useState(false);
  const [violations, setViolations] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [voiceEnabled, setVoiceEnabled] = useState(true);
  const [simulateMode, setSimulateMode] = useState(false);
  const [layoutMode, setLayoutMode] = useState('GRID');

  // ============================================================
  // 2. Playback History State
  // ============================================================
  const [history, setHistory] = useState([]);
  const [isPlayback, setIsPlayback] = useState(false);
  const [playbackIndex, setPlaybackIndex] = useState(0);
  const MAX_HISTORY = 300;

  const addToHistory = snapshot => {
    setHistory(prev => {
      const next = [...prev, { timestamp: Date.now(), snapshot }];
      return next.length > MAX_HISTORY ? next.slice(-MAX_HISTORY) : next;
    });
  };

  // If playback ON → view from history
  const currentView =
    isPlayback && history[playbackIndex]
      ? history[playbackIndex].snapshot
      : data;

  // ============================================================
  // 3. Refs (Non-rendering state)
  // ============================================================
  const wsRef = useRef(null);
  const simTimerRef = useRef(null);
  const lastAlertIdRef = useRef(null);

  const simStateRef = useRef({
    mode: 'AUTO',
    phaseIdx: 0,
    timer: 15,
    state: 'GREEN',
    activeDir: 'north',
    manualOverride: false,
    counts: { north: 5, east: 2, south: 8, west: 1 },
  });

  // Voice system refs
  const speechQueueRef = useRef([]);
  const isSpeakingRef = useRef(false);

  // Beep detection refs
  const prevStateRef = useRef(data.logic.state);
  const prevDirRef = useRef(data.logic.active_dir);

  // ============================================================
  // 4. Beep Sound Function (Event tones)
  // ============================================================
  const playBeep = (type = 'phase') => {
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx) return;

      const ctx = new AudioCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.frequency.value =
        type === 'emergency' ? 900 : type === 'phase' ? 650 : 500;

      gain.gain.value = 0.12;

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();

      setTimeout(() => {
        osc.stop();
        ctx.close();
      }, 150);
    } catch {
      // ignore audio failure
    }
  };

  // ============================================================
  // 5. Text-To-Speech Queue System
  // ============================================================
  const enqueueSpeech = text => {
    if (!text || !voiceEnabled) return;
    if (!window.speechSynthesis) return;

    speechQueueRef.current.push(text);
    processSpeechQueue();
  };

  const processSpeechQueue = () => {
    if (!voiceEnabled || isSpeakingRef.current) return;

    const next = speechQueueRef.current.shift();
    if (!next) return;

    const utter = new SpeechSynthesisUtterance(next);
    isSpeakingRef.current = true;

    utter.onend = () => {
      isSpeakingRef.current = false;
      processSpeechQueue();
    };

    window.speechSynthesis.speak(utter);
  };

  // ============================================================
  // 6. WebSocket Connection + Simulation Loop
  // ============================================================
  useEffect(() => {
    let ws = null;

    if (!simulateMode) {
      try {
        ws = new WebSocket('ws://localhost:8765');
        wsRef.current = ws;

        ws.onopen = () => setConnected(true);
        ws.onclose = () => setConnected(false);

        ws.onmessage = ev => {
          try {
            const parsed = JSON.parse(ev.data);

            setData(prev => {
              const merged = {
                ...prev,
                feeds: parsed.feeds || prev.feeds,
                counts: parsed.counts || prev.counts,
                logic: parsed.logic || prev.logic,
                analytics: parsed.analytics || prev.analytics,
                env: parsed.env || prev.env,
              };

              if (!isPlayback) addToHistory(merged);
              return merged;
            });

            // Violations
            if (parsed.violation) {
              setViolations(p => [parsed.violation, ...p].slice(0, 15));
            }

            // Alerts + Voice
            if (parsed.alert && parsed.alert.id) {
              if (parsed.alert.id !== lastAlertIdRef.current) {
                lastAlertIdRef.current = parsed.alert.id;
                setAlerts(p => [parsed.alert, ...p].slice(0, 10));

                if (parsed.alert.message) enqueueSpeech(parsed.alert.message);
              }
            }
          } catch {
            // ignore parse errors
          }
        };
      } catch {
        // ignore WS failure, simulateMode can be used
      }
    } else {
      if (wsRef.current?.readyState === WebSocket.OPEN) wsRef.current.close();
      wsRef.current = null;
      setConnected(false);
    }

    // SIMULATION LOOP
    const phases = ['north', 'east', 'south', 'west'];

    simTimerRef.current = setInterval(() => {
      if (!simulateMode) return;

      const sim = simStateRef.current;

      sim.counts.north = Math.max(
        0,
        sim.counts.north + (Math.random() > 0.6 ? 1 : -1)
      );

      const newCounts = {
        north: Math.floor(sim.counts.north),
        east: Math.floor(Math.random() * 8),
        south: Math.floor(Math.random() * 8),
        west: Math.floor(Math.random() * 8),
        rain_trigger: Math.random() > 0.95 ? 1 : 0,
        person: 0,
      };

      const total = Object.values(newCounts).reduce(
        (a, b) => (typeof b === 'number' ? a + b : a),
        0
      );

      if (!sim.manualOverride) {
        sim.mode = total < 10 ? 'ECO' : 'AUTO';
        sim.timer--;

        if (sim.timer <= 0) {
          if (sim.mode === 'ECO') {
            sim.state = 'YELLOW';
            sim.timer = 5;
          } else if (sim.state === 'GREEN') {
            sim.state = 'YELLOW';
            sim.timer = 3;
          } else {
            sim.state = 'GREEN';
            sim.phaseIdx = (sim.phaseIdx + 1) % 4;
            sim.activeDir = phases[sim.phaseIdx];
            sim.timer = Math.floor(Math.random() * 20) + 10;
          }
        }
      }

      const nextDir = phases[(sim.phaseIdx + 1) % 4];

      const signalMap = {
        north: 'RED',
        east: 'RED',
        south: 'RED',
        west: 'RED',
      };
      if (sim.activeDir) signalMap[sim.activeDir] = sim.state;

      const isNight = Date.now() % 60000 > 30000;

      setData(prev => {
        const merged = {
          ...prev,
          counts: newCounts,
          logic: {
            ...prev.logic,
            active_dir: sim.activeDir,
            next_dir: nextDir,
            state: sim.state,
            timer: sim.timer,
            mode: sim.mode,
            signal_map: signalMap,
            status:
              sim.mode === 'ECO'
                ? '🌙 Eco Mode (Simulation)'
                : 'Simulation Running',
          },
          env: {
            ...prev.env,
            is_night: isNight,
            weather_mode: newCounts.rain_trigger
              ? 'RAIN'
              : isNight
              ? 'NIGHT'
              : 'CLEAR',
          },
        };

        if (!isPlayback) addToHistory(merged);
        return merged;
      });
    }, 1000);

    return () => {
      if (ws) ws.close();
      clearInterval(simTimerRef.current);
      if (window.speechSynthesis) window.speechSynthesis.cancel();
    };
  }, [simulateMode, voiceEnabled, isPlayback]);

  // ============================================================
  // 7. Beep Effect When signal/direction changes
  // ============================================================
  useEffect(() => {
    const curState = data.logic.state;
    const curDir = data.logic.active_dir;

    const prevState = prevStateRef.current;
    const prevDir = prevDirRef.current;

    if (!isPlayback) {
      if (curState === 'EMERGENCY' && prevState !== 'EMERGENCY') {
        playBeep('emergency');
      } else if (curDir !== prevDir && curDir) {
        playBeep('phase');
      }
    }

    prevStateRef.current = curState;
    prevDirRef.current = curDir;
  }, [data.logic, isPlayback]);

  // ============================================================
  // 8. Sidebar Command Handler
  // ============================================================
  const sendCommand = cmd => {
    if (
      !simulateMode &&
      wsRef.current &&
      wsRef.current.readyState === WebSocket.OPEN
    ) {
      wsRef.current.send(JSON.stringify({ command: cmd }));
    }

    const sim = simStateRef.current;
    const dirs = ['north', 'east', 'south', 'west'];

    if (cmd === 'AUTO') {
      sim.mode = 'AUTO';
      sim.manualOverride = false;
      sim.state = 'GREEN';
      sim.phaseIdx = 0;
      sim.activeDir = 'north';
      sim.timer = 15;
    } else if (cmd === 'STOP_ALL') {
      sim.mode = 'MANUAL';
      sim.manualOverride = true;
      sim.state = 'RED';
      sim.activeDir = null;
      sim.timer = 999;
    } else if (cmd.startsWith('FORCE_')) {
      const d = cmd.split('_')[1].toLowerCase();
      sim.mode = 'MANUAL';
      sim.manualOverride = true;
      sim.state = 'GREEN';
      sim.timer = 999;
      sim.activeDir = d;
      sim.phaseIdx = dirs.indexOf(d);
    }
  };

  // ============================================================
  // 9. Playback Controls
  // ============================================================
  const togglePlayback = () => {
    setIsPlayback(prev => {
      if (!prev && history.length > 0) setPlaybackIndex(history.length - 1);
      return !prev;
    });
  };

  const seekPlayback = idx => setPlaybackIndex(idx);

  // ============================================================
  // 10. Theme Classes
  // ============================================================
  const { is_night, weather_mode } = currentView.env;
  const bgClass = is_night
    ? 'bg-slate-950 text-slate-200'
    : 'bg-slate-900 text-slate-100';

  const weatherGlow =
    weather_mode === 'RAIN'
      ? 'shadow-[0_0_40px_rgba(34,211,238,0.25)]'
      : weather_mode === 'NIGHT'
      ? 'shadow-[0_0_40px_rgba(129,140,248,0.25)]'
      : '';

  // ============================================================
  // 11. FINAL RENDER
  // ============================================================
  return (
    <div
      className={`min-h-screen ${bgClass} ${weatherGlow} p-3 md:p-6 flex flex-col md:flex-row gap-6 transition-all duration-500`}>
      {/* SIMULATION INDICATOR */}
      {simulateMode && (
        <div className='fixed top-2 left-1/2 -translate-x-1/2 z-[9999] px-4 py-1 rounded-full bg-yellow-900/80 border border-yellow-500/70 text-[11px] text-yellow-100 shadow-lg'>
          ⚠ SIMULATION MODE ACTIVE
        </div>
      )}

      {/* LEFT COLUMN (Header + Status + MiniMap + Playback + Grid + HUD) */}
      <div className='flex-1 flex flex-col gap-4'>
        {/* HEADER */}
        <Header
          connected={connected}
          simulateMode={simulateMode}
          isEmergency={currentView.logic.state === 'EMERGENCY'}
          isManual={currentView.logic.mode === 'MANUAL'}
          isNight={is_night}
          weatherMode={weather_mode}
        />

        {/* STATUS BAR */}
        <StatusBar logic={currentView.logic} env={currentView.env} />

        {/* MINIMAP */}
        <MiniMap logic={currentView.logic} counts={currentView.counts} />

        {/* PLAYBACK BAR */}
        <PlaybackBar
          history={history}
          isPlayback={isPlayback}
          playbackIndex={playbackIndex}
          onTogglePlayback={togglePlayback}
          onSeek={seekPlayback}
        />

        {/* MAIN GRID + HUD WRAPPED TOGETHER */}
        <div className='relative flex-1'>
          {/* GRID */}
          <TrafficGrid
            feeds={currentView.feeds}
            counts={currentView.counts}
            logic={currentView.logic}
            env={currentView.env}
            layoutMode={layoutMode}
          />

          {/* ✅ CENTRAL HUD EXACTLY GRID KE BEECH ME */}
          <CentralSignalHUD logic={currentView.logic} />
        </div>
      </div>

      {/* RIGHT SIDEBAR */}
      <Sidebar
        analytics={currentView.analytics}
        violations={violations}
        alerts={alerts}
        sendCommand={sendCommand}
        voiceEnabled={voiceEnabled}
        setVoiceEnabled={setVoiceEnabled}
        simulateMode={simulateMode}
        setSimulateMode={setSimulateMode}
        history={history}
        layoutMode={layoutMode}
        setLayoutMode={setLayoutMode}
      />
    </div>
  );
}
