import React, { useEffect, useState, useRef } from 'react';
import Header from './components/Header';
import TrafficGrid from './components/TrafficGrid';
import Sidebar from './components/Sidebar';

export default function App() {
  const [data, setData] = useState({
    feeds: {},
    counts: { north: 0, south: 0, east: 0, west: 0 },
    logic: { active_dir: 'north', state: 'RED', timer: 0, mode: 'AUTO' },
    analytics: { car: 0, bike: 0, bus: 0, truck: 0 },
    env: { obstacle_zone: null, is_night: false },
  });
  const [connected, setConnected] = useState(false);
  const [violations, setViolations] = useState([]);
  const [cyberpunkMode, setCyberpunkMode] = useState(false);
  const wsRef = useRef(null);

  useEffect(() => {
    const ws = new WebSocket('ws://localhost:8765');
    wsRef.current = ws;

    ws.onopen = () => setConnected(true);
    ws.onclose = () => setConnected(false);
    ws.onmessage = event => {
      try {
        const parsed = JSON.parse(event.data);
        if (parsed.feeds) setData(prev => ({ ...prev, ...parsed }));
        if (parsed.violation)
          setViolations(prev => [parsed.violation, ...prev].slice(0, 10));
      } catch (e) {}
    };

    return () => ws.close();
  }, []);

  const sendCommand = cmd => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ command: cmd }));
    }
  };

  const { is_night } = data.env || {};

  // Dynamic Background & Responsive Layout Class
  const bgClass = cyberpunkMode
    ? 'bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-gray-900 via-[#050505] to-black text-cyan-100'
    : is_night
    ? 'bg-[#020202] text-slate-400'
    : 'bg-slate-950 text-slate-200';

  return (
    <div
      className={`min-h-screen ${bgClass} font-sans p-3 md:p-6 flex flex-col md:flex-row gap-6 overflow-x-hidden transition-colors duration-1000`}>
      {/* Left Side: Header + Camera Grid */}
      <div className='flex-1 flex flex-col gap-6'>
        <Header
          connected={connected}
          isEmergency={data.logic.state === 'EMERGENCY'}
          isManual={data.logic.mode === 'MANUAL'}
          isNight={is_night}
          cyberpunkMode={cyberpunkMode}
          setCyberpunkMode={setCyberpunkMode}
        />

        <TrafficGrid
          feeds={data.feeds}
          counts={data.counts}
          logic={data.logic}
          env={data.env}
          cyberpunkMode={cyberpunkMode}
        />
      </div>

      {/* Right Side: Sidebar (Stacks at bottom on mobile) */}
      <Sidebar
        analytics={data.analytics}
        violations={violations}
        sendCommand={sendCommand}
        cyberpunkMode={cyberpunkMode}
      />
    </div>
  );
}




// // -----------merged version 2 -------------------






// import React, { useEffect, useState, useRef } from 'react';
// import { ShieldAlert, Activity, Siren, BarChart3, Lock, StopCircle, PlayCircle, Sun, Moon, AlertOctagon, Car, Zap } from 'lucide-react';

// // --- COMPONENTS START ---

// // 1. Header Component
// function Header({ connected, isEmergency, isManual, isNight, cyberpunkMode, setCyberpunkMode }) {
//   return (
//     <header className={`flex flex-col md:flex-row justify-between items-center p-4 rounded-2xl border mb-4 backdrop-blur-xl shadow-2xl transition-all duration-500
//       ${cyberpunkMode 
//         ? 'bg-black/80 border-cyan-500/50 shadow-[0_0_20px_rgba(6,182,212,0.2)]' 
//         : 'bg-slate-900/70 border-white/10'
//       }`}>
      
//       <div className="flex items-center gap-4 w-full md:w-auto justify-between md:justify-start">
//         {/* Status Icon Box */}
//         <div className={`p-3 rounded-xl shadow-lg transition-all duration-500 ${
//           isEmergency ? 'bg-red-600 animate-pulse' : 
//           isManual ? 'bg-purple-600' : 
//           cyberpunkMode ? 'bg-cyan-600 shadow-[0_0_15px_cyan]' : 'bg-indigo-600'
//         }`}>
//           {isEmergency ? <Siren className="text-white w-6 h-6 animate-spin" /> : 
//            isManual ? <Lock className="text-white w-6 h-6" /> : 
//            <Activity className="text-white w-6 h-6" />}
//         </div>
        
//         {/* Title & Mode Text */}
//         <div className="text-right md:text-left">
//           <h1 className={`text-xl md:text-2xl font-black tracking-tighter ${cyberpunkMode ? 'text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-purple-500' : 'text-white'}`}>
//             TRAFFIC<span className={cyberpunkMode ? 'text-cyan-400' : 'text-indigo-400'}>GUARD</span> ULTRA
//           </h1>
//           <div className="flex gap-2 items-center justify-end md:justify-start">
//             <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${
//               cyberpunkMode ? 'bg-purple-900/50 text-purple-300 border border-purple-500' : 'bg-slate-800 text-slate-400'
//             }`}>
//               {isManual ? 'MANUAL OVERRIDE' : 'AI AUTONOMOUS'}
//             </span>
//           </div>
//         </div>
//       </div>
      
//       {/* Controls */}
//       <div className="flex gap-3 items-center mt-4 md:mt-0 w-full md:w-auto justify-end">
//         {/* Cyberpunk Toggle */}
//         <button 
//           onClick={() => setCyberpunkMode(!cyberpunkMode)}
//           className={`flex items-center gap-2 px-3 py-1.5 rounded-full border transition-all duration-300 ${
//             cyberpunkMode 
//             ? 'bg-cyan-900/30 border-cyan-400 text-cyan-300 shadow-[0_0_10px_cyan]' 
//             : 'bg-slate-800/50 border-slate-600 text-slate-300 hover:bg-slate-700'
//           }`}
//         >
//           <Zap size={14} className={cyberpunkMode ? "fill-cyan-300" : ""} />
//           <span className="text-xs font-bold hidden sm:block">CYBERPUNK</span>
//         </button>

//         {/* Environmental Status */}
//         <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full border ${
//           cyberpunkMode ? 'bg-black/50 border-purple-500/50' : 'bg-slate-800/50 border-slate-700'
//         }`}>
//            {isNight ? <Moon size={14} className="text-indigo-400"/> : <Sun size={14} className="text-yellow-400"/>}
//            <span className={`text-xs font-bold ${cyberpunkMode ? 'text-purple-300' : 'text-slate-300'}`}>
//              {isNight ? 'NIGHT' : 'DAY'}
//            </span>
//         </div>
        
//         {/* Connection Dot */}
//         <div className={`w-3 h-3 rounded-full shadow-lg ${
//             connected 
//             ? 'bg-green-500 shadow-[0_0_10px_lime]' 
//             : 'bg-red-500 shadow-[0_0_10px_red]'
//         }`} title={connected ? "Connected" : "Offline"}></div>
//       </div>
//     </header>
//   );
// }

// // 2. TrafficGrid Component
// function TrafficGrid({ feeds, counts, logic, env, cyberpunkMode }) {
//   const { obstacle_zone, is_night } = env || {};
//   const { active_dir, state, timer } = logic;
  
//   const isEmergency = state === 'EMERGENCY';
//   const isManual = logic.mode === 'MANUAL';

//   // Helper for Border Colors
//   const getBorderColor = (dir) => {
//     if (obstacle_zone === dir) return 'border-orange-500 shadow-[0_0_50px_rgba(249,115,22,0.6)] animate-pulse scale-[1.02] z-10';
//     if (isEmergency && active_dir === dir) return 'border-red-500 shadow-[0_0_40px_rgba(239,68,68,0.8)] animate-pulse';
    
//     if (active_dir === dir) {
//        if (state === 'GREEN') return cyberpunkMode ? 'border-cyan-400 shadow-[0_0_30px_cyan]' : 'border-emerald-500 shadow-[0_0_25px_rgba(16,185,129,0.5)]';
//        if (state === 'YELLOW') return 'border-yellow-400 shadow-[0_0_25px_rgba(250,204,21,0.5)]';
//     }
    
//     return cyberpunkMode ? 'border-slate-800 opacity-40 grayscale' : 'border-slate-800 opacity-50 grayscale';
//   };

//   return (
//     <div className="grid grid-cols-1 md:grid-cols-2 gap-4 relative min-h-[50vh] md:min-h-0">
//       {['north', 'east', 'west', 'south'].map(dir => (
//         <div key={dir} className={`relative rounded-2xl overflow-hidden border-[3px] transition-all duration-500 group aspect-video bg-black ${getBorderColor(dir)}`}>
           
//            {/* Zone Label */}
//            <div className={`absolute top-3 left-3 z-10 backdrop-blur-md px-3 py-1 rounded-lg border text-xs font-bold uppercase tracking-wider
//              ${cyberpunkMode ? 'bg-black/60 border-cyan-500/30 text-cyan-300' : 'bg-black/60 border-white/10 text-slate-200'}`}>
//                {dir}
//            </div>

//            {/* Vehicle Count */}
//            <div className={`absolute top-3 right-3 z-10 backdrop-blur-md px-3 py-1.5 rounded-lg border flex items-center gap-2 shadow-sm
//              ${cyberpunkMode ? 'bg-black/60 border-purple-500/30 text-purple-300' : 'bg-black/60 border-white/10 text-white'}`}>
//              <Car size={14} className={cyberpunkMode ? "text-purple-400" : "text-indigo-400"} />
//              <span className="text-sm font-mono font-bold leading-none">{counts[dir] || 0}</span>
//            </div>
           
//            {/* Obstacle Warning */}
//            {obstacle_zone === dir && (
//              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-20 bg-orange-600/90 text-white px-4 py-2 rounded-xl font-bold text-sm animate-bounce flex items-center gap-2 shadow-xl backdrop-blur border border-orange-400">
//                <AlertOctagon size={20} /> OBSTACLE DETECTED
//              </div>
//            )}

//            {feeds[dir] ? (
//               <img 
//                 src={`data:image/jpeg;base64,${feeds[dir]}`} 
//                 className={`w-full h-full object-cover transition duration-700 ${is_night ? 'brightness-90 contrast-125' : 'opacity-90'}`} 
//                 alt={`${dir} feed`}
//               />
//            ) : (
//               <div className="w-full h-full flex flex-col items-center justify-center text-slate-700 bg-[#050505]">
//                 <div className={`w-12 h-12 border-4 rounded-full animate-spin mb-4 ${cyberpunkMode ? 'border-slate-800 border-t-cyan-500' : 'border-slate-800 border-t-indigo-500'}`}></div>
//                 <span className="text-[10px] tracking-[0.3em] animate-pulse font-bold opacity-50">NO SIGNAL</span>
//               </div>
//            )}
//         </div>
//       ))}

//       {/* CENTRAL TIMER HUD (Floating) */}
//       <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-30 pointer-events-none">
//          <div className={`w-36 h-36 md:w-44 md:h-44 rounded-full border-[6px] backdrop-blur-xl flex flex-col items-center justify-center shadow-2xl relative transition-all duration-500
//             ${obstacle_zone ? 'bg-orange-900/80 border-orange-500 animate-pulse' : 
//               isEmergency ? 'bg-red-900/80 border-red-500 animate-pulse' : 
//               state === 'GREEN' ? (cyberpunkMode ? 'bg-black/80 border-cyan-400 shadow-[0_0_50px_rgba(6,182,212,0.4)]' : 'bg-slate-900/90 border-emerald-500') : 
//               (cyberpunkMode ? 'bg-black/80 border-yellow-400' : 'bg-slate-900/90 border-yellow-500')}`}>
            
//             <span className={`text-[10px] font-black uppercase mb-1 tracking-widest ${cyberpunkMode ? 'text-cyan-200' : 'text-slate-400'}`}>
//               {obstacle_zone ? 'WARNING' : isEmergency ? 'PRIORITY' : isManual ? 'LOCKED' : 'TIMER'}
//             </span>
            
//             {obstacle_zone ? (
//               <AlertOctagon size={56} className="text-orange-400 animate-pulse" />
//             ) : (
//               <span className={`text-6xl font-mono font-black tracking-tighter ${
//                 isEmergency ? 'text-red-400' : 
//                 state === 'YELLOW' ? 'text-yellow-400' : 
//                 (cyberpunkMode ? 'text-cyan-400 drop-shadow-[0_0_10px_rgba(6,182,212,0.8)]' : 'text-white')
//               }`}>
//                 {timer}
//               </span>
//             )}
            
//             <div className={`mt-2 px-3 py-0.5 rounded text-[10px] font-bold uppercase tracking-widest
//               ${obstacle_zone ? 'bg-orange-500/20 text-orange-200' : 
//                 cyberpunkMode ? 'bg-cyan-900/30 text-cyan-300 border border-cyan-500/30' : 'bg-slate-800 text-slate-400'}`}>
//               {obstacle_zone ? 'OBSTACLE' : isEmergency ? 'AMBULANCE' : active_dir}
//             </div>
//          </div>
//       </div>
//     </div>
//   );
// }

// // 3. Sidebar Component
// function Sidebar({ analytics, violations, sendCommand, cyberpunkMode }) {
  
//   const totalVehicles = Object.values(analytics).reduce((a,b)=>a+b, 0);
//   const getPercent = (val) => totalVehicles ? (val/totalVehicles)*100 : 0;

//   return (
//     <aside className={`w-full md:w-80 rounded-2xl p-5 flex flex-col gap-5 backdrop-blur-xl border transition-all duration-500
//       ${cyberpunkMode 
//         ? 'bg-black/60 border-cyan-500/30 shadow-[0_0_30px_rgba(0,0,0,0.5)]' 
//         : 'bg-slate-900/60 border-slate-700 shadow-2xl'
//       }`}>
        
//       {/* Manual Control Panel */}
//       <div className={`p-4 rounded-xl border ${cyberpunkMode ? 'bg-black/40 border-purple-500/30' : 'bg-slate-800/40 border-slate-700'}`}>
//         <h2 className={`text-xs font-bold uppercase tracking-widest mb-4 flex items-center gap-2 ${cyberpunkMode ? 'text-purple-400' : 'text-slate-400'}`}>
//           <Lock size={14} /> Command Center
//         </h2>
//         <div className="grid grid-cols-2 gap-2 mb-3">
//           {['NORTH', 'EAST', 'WEST', 'SOUTH'].map(d => (
//             <button key={d} onClick={() => sendCommand(`FORCE_${d}`)} 
//               className={`text-[10px] py-2.5 rounded-lg transition font-bold border
//               ${cyberpunkMode 
//                 ? 'bg-purple-900/20 border-purple-500/50 text-purple-200 hover:bg-purple-500 hover:text-white' 
//                 : 'bg-slate-700 border-slate-600 text-slate-300 hover:bg-indigo-600 hover:text-white hover:border-indigo-500'
//               }`}>
//               FORCE {d}
//             </button>
//           ))}
//         </div>
//         <div className="flex gap-2">
//           <button onClick={() => sendCommand('STOP_ALL')} className="flex-1 bg-red-500/10 hover:bg-red-600 border border-red-500/50 hover:border-red-500 text-red-400 hover:text-white text-[10px] py-2.5 rounded-lg transition font-bold flex items-center justify-center gap-2">
//             <StopCircle size={14}/> ALL STOP
//           </button>
//           <button onClick={() => sendCommand('AUTO')} className="flex-1 bg-green-500/10 hover:bg-green-600 border border-green-500/50 hover:border-green-500 text-green-400 hover:text-white text-[10px] py-2.5 rounded-lg transition font-bold flex items-center justify-center gap-2">
//             <PlayCircle size={14}/> AUTO MODE
//           </button>
//         </div>
//       </div>

//       {/* Live Analytics */}
//       <div className={`p-4 rounded-xl border ${cyberpunkMode ? 'bg-black/40 border-cyan-500/30' : 'bg-slate-800/40 border-slate-700'}`}>
//          <h2 className={`text-xs font-bold uppercase tracking-widest mb-4 flex items-center gap-2 ${cyberpunkMode ? 'text-cyan-400' : 'text-slate-400'}`}>
//           <BarChart3 size={14} /> Live Traffic Data
//         </h2>
//         <div className="space-y-3">
//           {Object.entries(analytics).map(([key, val]) => (
//             <div key={key}>
//               <div className="flex justify-between text-[10px] mb-1 font-bold">
//                 <span className="uppercase text-slate-500">{key}</span>
//                 <span className={cyberpunkMode ? 'text-cyan-300' : 'text-slate-200'}>{val}</span>
//               </div>
//               <div className="w-full h-1.5 bg-slate-700/50 rounded-full overflow-hidden">
//                 <div className={`h-full transition-all duration-1000 ease-out ${cyberpunkMode ? 'bg-gradient-to-r from-cyan-500 to-purple-500' : 'bg-indigo-500'}`} style={{width: `${getPercent(val)}%`}}></div>
//               </div>
//             </div>
//           ))}
//         </div>
//       </div>

//       {/* Violations Log */}
//       <div className={`flex-1 overflow-y-auto min-h-[200px] rounded-xl border p-2 custom-scrollbar ${cyberpunkMode ? 'bg-black/40 border-red-500/20' : 'bg-slate-800/30 border-slate-700'}`}>
//          <h2 className="text-xs font-bold text-red-400 uppercase tracking-widest mb-3 sticky top-0 p-2 rounded backdrop-blur z-10 flex gap-2">
//            <ShieldAlert size={14} /> Violations
//          </h2>
//          {violations.length === 0 && (
//            <div className="text-center text-[10px] text-slate-600 py-8 italic">No violations recorded</div>
//          )}
//          {violations.map(v => (
//            <div key={v.id} className={`mb-2 p-2 rounded border flex gap-3 transition hover:scale-[1.02] ${cyberpunkMode ? 'bg-red-900/10 border-red-500/30' : 'bg-slate-900/50 border-red-900/30'}`}>
//              <div className="w-10 h-10 bg-black rounded-lg overflow-hidden flex-shrink-0 border border-white/10">
//                 <img src={`data:image/jpeg;base64,${v.img}`} className="w-full h-full object-cover"/>
//              </div>
//              <div>
//                <div className="text-[10px] font-bold text-red-400 uppercase tracking-wide">{v.dir} JUMP</div>
//                <div className="text-[9px] text-slate-500 font-mono">{v.time}</div>
//              </div>
//            </div>
//          ))}
//       </div>
//     </aside>
//   );
// }

// // --- MAIN APP COMPONENT ---

// export default function App() {
//   // --- 1. State Management ---
//   const [data, setData] = useState({
//     feeds: {},
//     counts: { north: 0, south: 0, east: 0, west: 0 },
//     logic: { active_dir: 'north', state: 'RED', timer: 0, mode: 'AUTO' },
//     analytics: { car: 0, bike: 0, bus: 0, truck: 0 },
//     env: { obstacle_zone: null, is_night: false }
//   });
//   const [connected, setConnected] = useState(false);
//   const [violations, setViolations] = useState([]);
//   const [cyberpunkMode, setCyberpunkMode] = useState(false); 
//   const wsRef = useRef(null);

//   // --- 2. WebSocket Logic ---
//   useEffect(() => {
//     // Note: Localhost will fail here in preview but works on local machine
//     const ws = new WebSocket('ws://localhost:8765');
//     wsRef.current = ws;

//     ws.onopen = () => setConnected(true);
//     ws.onclose = () => setConnected(false);
//     ws.onmessage = (event) => {
//       try {
//         const parsed = JSON.parse(event.data);
//         if (parsed.feeds) setData(prev => ({ ...prev, ...parsed }));
//         if (parsed.violation) setViolations(prev => [parsed.violation, ...prev].slice(0, 10));
//       } catch (e) { }
//     };

//     return () => ws.close();
//   }, []);

//   const sendCommand = (cmd) => {
//     if(wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
//       wsRef.current.send(JSON.stringify({ command: cmd }));
//     }
//   };

//   // --- 3. Derived State ---
//   const { is_night } = data.env || {};
  
//   // Dynamic Background Logic (Cyberpunk vs Night vs Day)
//   const bgClass = cyberpunkMode 
//     ? 'bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-gray-900 via-[#050505] to-black text-cyan-100' 
//     : is_night 
//       ? 'bg-[#020202] text-slate-400' 
//       : 'bg-slate-950 text-slate-200';

//   // --- 4. Render Components ---
//   return (
//     <div className={`min-h-screen ${bgClass} font-sans p-3 md:p-6 flex flex-col md:flex-row gap-6 overflow-x-hidden transition-colors duration-1000`}>
      
//       {/* Left Side: Header + Camera Grid */}
//       <div className="flex-1 flex flex-col gap-6">
//         <Header 
//           connected={connected} 
//           isEmergency={data.logic.state === 'EMERGENCY'}
//           isManual={data.logic.mode === 'MANUAL'}
//           isNight={is_night}
//           cyberpunkMode={cyberpunkMode}
//           setCyberpunkMode={setCyberpunkMode}
//         />

//         <TrafficGrid 
//           feeds={data.feeds}
//           counts={data.counts}
//           logic={data.logic}
//           env={data.env}
//           cyberpunkMode={cyberpunkMode}
//         />
//       </div>

//       {/* Right Side: Sidebar (Stacks at bottom on mobile) */}
//       <Sidebar 
//         analytics={data.analytics} 
//         violations={violations} 
//         sendCommand={sendCommand} 
//         cyberpunkMode={cyberpunkMode}
//       />
      
//     </div>
//   );
// }