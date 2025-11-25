import React from 'react';
import { ShieldAlert, Activity, Siren, BarChart3, Lock, StopCircle, PlayCircle, Sun, Moon, AlertOctagon, Car, Zap } from 'lucide-react';


export default function Header({ connected, isEmergency, isManual, isNight, cyberpunkMode, setCyberpunkMode }) {
return (
<header className={`flex flex-col md:flex-row justify-between items-center p-4 rounded-2xl border mb-4 backdrop-blur-xl shadow-2xl transition-all duration-500
${cyberpunkMode ? 'bg-black/80 border-cyan-500/50 shadow-[0_0_20px_rgba(6,182,212,0.2)]' : 'bg-slate-900/70 border-white/10'}`}>
<div className="flex items-center gap-4 w-full md:w-auto justify-between md:justify-start">
<div className={`p-3 rounded-xl shadow-lg transition-all duration-500 ${
isEmergency ? 'bg-red-600 animate-pulse' : isManual ? 'bg-purple-600' : cyberpunkMode ? 'bg-cyan-600 shadow-[0_0_15px_cyan]' : 'bg-indigo-600'
}`}>
{isEmergency ? <Siren className="text-white w-6 h-6 animate-spin" /> : isManual ? <Lock className="text-white w-6 h-6" /> : <Activity className="text-white w-6 h-6" />}
</div>


<div className="text-right md:text-left">
<h1 className={`text-xl md:text-2xl font-black tracking-tighter ${
cyberpunkMode ? 'text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-purple-500' : 'text-white'
}`}>
TRAFFIC<span className={cyberpunkMode ? 'text-cyan-400' : 'text-indigo-400'}>GUARD</span> ULTRA
</h1>


<span className={`text-[10px] font-bold px-2 py-0.5 rounded ${
cyberpunkMode ? 'bg-purple-900/50 text-purple-300 border border-purple-500' : 'bg-slate-800 text-slate-400'
}`}>
{isManual ? 'MANUAL OVERRIDE' : 'AI AUTONOMOUS'}
</span>
</div>
</div>


<div className="flex gap-3 items-center mt-4 md:mt-0 w-full md:w-auto justify-end">
<button
onClick={() => setCyberpunkMode(!cyberpunkMode)}
className={`flex items-center gap-2 px-3 py-1.5 rounded-full border transition-all duration-300 ${
cyberpunkMode ? 'bg-cyan-900/30 border-cyan-400 text-cyan-300 shadow-[0_0_10px_cyan]' : 'bg-slate-800/50 border-slate-600 text-slate-300 hover:bg-slate-700'
}`}
>
<Zap size={14} />
<span className="text-xs font-bold hidden sm:block">CYBERPUNK</span>
</button>


<div className={`flex items-center gap-2 px-3 py-1.5 rounded-full border ${
cyberpunkMode ? 'bg-black/50 border-purple-500/50' : 'bg-slate-800/50 border-slate-700'
}`}>
{isNight ? <Moon size={14} className="text-indigo-400" /> : <Sun size={14} className="text-yellow-400" />}
<span className={`text-xs font-bold ${cyberpunkMode ? 'text-purple-300' : 'text-slate-300'}`}>
{isNight ? 'NIGHT' : 'DAY'}
</span>
</div>


<div className={`w-3 h-3 rounded-full shadow-lg ${connected ? 'bg-green-500 shadow-[0_0_10px_lime]' : 'bg-red-500 shadow-[0_0_10px_red]'}`}></div>
</div>
</header>
);
}





