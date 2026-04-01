"use client";
import React, { useState } from 'react';
import { Lock, Volume2, VolumeX, StopCircle, PlayCircle, BarChart3, ShieldAlert, Power, ChevronDown, ChevronUp, Activity, Settings } from 'lucide-react';

const SectionHeader = ({ title, icon: Icon, isOpen, toggle, color = 'text-slate-400' }) => (
  <button onClick={toggle} className='w-full flex items-center justify-between p-3 rounded-xl hover:bg-slate-800/40 transition-colors mb-1 group'>
    <div className={`flex items-center gap-2 text-xs font-bold uppercase tracking-[0.2em] transition-colors ${isOpen ? color : 'text-slate-500 group-hover:text-slate-300'}`}>
      <Icon size={16} />{title}
    </div>
    <div className='text-slate-600'>{isOpen ? <ChevronUp size={14} /> : <ChevronDown size={14} />}</div>
  </button>
);

export default function Sidebar({ analytics, violations, alerts, sendCommand, voiceEnabled, setVoiceEnabled, simulateMode, setSimulateMode, setShowAdmin, engineStatus }) {
  const [openSections, setOpenSections] = useState({ admin: true, analytics: true, alerts: true, violations: true });
  const toggleSection = (section) => setOpenSections(prev => ({ ...prev, [section]: !prev[section] }));
  const total = Object.values(analytics || {}).reduce((a, b) => a + b, 0);
  const getPercent = v => (total === 0 ? 0 : Math.min(100, (v / total) * 100));

  return (
    <aside className='w-full md:w-80 rounded-2xl p-3 flex flex-col gap-2 backdrop-blur-xl border transition-all duration-500 bg-slate-900/70 border-slate-800 shadow-2xl overflow-y-auto custom-scroll'>
      <div className='p-3 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-between mb-2 shadow-inner'>
        <div className='flex items-center gap-2 text-indigo-400'>
          <Activity size={14} className='animate-[pulse_1.5s_infinite]' />
          <span className='text-[10px] font-bold uppercase tracking-wider'>System Engine</span>
        </div>
        <span className='text-[10px] font-mono text-indigo-300 bg-indigo-500/20 px-2 py-0.5 rounded-full border border-indigo-500/30'>
          {engineStatus ? `${engineStatus.cpu_usage}% CPU` : "READY"}
        </span>
      </div>

      <div className='border-b border-slate-800/50 pb-2 mb-2'>
        <SectionHeader title="Admin Mode" icon={Lock} isOpen={openSections.admin} toggle={() => toggleSection('admin')} color="text-blue-400" />
        {openSections.admin && (
          <div className='px-2 space-y-3 pb-2'>
            <div className='flex gap-2'>
              <button onClick={() => setSimulateMode(!simulateMode)} className={`flex-1 py-2 rounded-lg text-[10px] font-bold border flex items-center justify-center gap-2 ${simulateMode ? 'bg-yellow-900/40 border-yellow-500 text-yellow-100' : 'bg-slate-800/60 border-slate-700 text-slate-400'}`}><Power size={12} /> {simulateMode ? 'SIM ON' : 'SIM OFF'}</button>
              <button onClick={() => setVoiceEnabled(!voiceEnabled)} className={`flex-1 py-2 rounded-lg text-[10px] font-bold border flex items-center justify-center gap-2 ${voiceEnabled ? 'bg-emerald-900/40 border-emerald-500 text-emerald-100' : 'bg-slate-800/60 border-slate-700 text-slate-400'}`}>{voiceEnabled ? <Volume2 size={12} /> : <VolumeX size={12} />} {voiceEnabled ? 'VOICE' : 'MUTE'}</button>
            </div>
            <div className='grid grid-cols-2 gap-2'>
              {['NORTH', 'EAST', 'SOUTH', 'WEST'].map(dir => (
                <button key={dir} onClick={() => sendCommand(`FORCE_${dir}`)} className='text-[9px] py-1.5 rounded-lg bg-slate-800/80 hover:bg-indigo-600 border border-slate-700 hover:border-indigo-500 font-bold uppercase'>{dir}</button>
              ))}
            </div>
            <button onClick={() => setShowAdmin(true)} className='w-full py-2 rounded-lg bg-indigo-600/10 hover:bg-indigo-600 border border-indigo-500/20 text-indigo-300 hover:text-white text-[10px] font-bold flex items-center justify-center gap-2'><Settings size={12} /> CONFIGURE SYSTEM</button>
          </div>
        )}
      </div>

      {/* Simplified Analytics, Alerts and Violations for size limits */}
      <div className='border-b border-slate-800/50 pb-2 mb-2'>
        <SectionHeader title="Security Alerts" icon={ShieldAlert} isOpen={openSections.alerts} toggle={() => toggleSection('alerts')} color="text-yellow-400" />
        {openSections.alerts && (
          <div className='px-2 pb-2 space-y-2 max-h-40 overflow-y-auto custom-scroll'>
            {alerts?.length > 0 ? alerts.map((a,i) => (
              <div key={i} className='p-2 bg-yellow-400/5 border border-yellow-400/10 rounded-lg text-[10px] text-yellow-200/70'>{a.message}</div>
            )) : <div className='text-[10px] text-slate-600 italic'>No anomalies detected...</div>}
          </div>
        )}
      </div>
    </aside>
  );
}
