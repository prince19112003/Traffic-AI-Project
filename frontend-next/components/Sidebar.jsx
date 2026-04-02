"use client";
import React, { useState } from 'react';
import { Menu, X, Lock, Volume2, VolumeX, Power, ChevronDown, ChevronUp, Activity, Settings, LayoutDashboard, ShieldAlert, BadgeAlert } from 'lucide-react';

export default function Sidebar({ 
  analytics, alerts, violations, sendCommand, voiceEnabled, setVoiceEnabled, 
  simulateMode, setSimulateMode, setShowAdmin, engineStatus, isCollapsed, toggleSidebar, connected 
}) {
  const [openSections, setOpenSections] = useState({ admin: true, analytics: true, alerts: true, violations: true });
  const toggleSection = (section) => setOpenSections(prev => ({ ...prev, [section]: !prev[section] }));

  if (isCollapsed) {
    return (
      <aside className='w-16 h-full glass-panel flex flex-col items-center py-4 gap-6 transition-all duration-500'>
        <button onClick={toggleSidebar} className='p-2 rounded-xl bg-white/5 hover:bg-white/10 active-press'>
          <Menu size={20} className='text-slate-400' />
        </button>
        <div className='flex flex-col gap-4 mt-8'>
          <Activity size={20} className={`transition-colors ${connected ? 'text-emerald-400 animate-pulse' : 'text-rose-500'}`} />
          <ShieldAlert size={20} className='text-yellow-400' />
          <BadgeAlert size={20} className='text-red-400' />
          <button onClick={() => setShowAdmin(true)} className='p-2 rounded-xl hover:bg-white/5 active-press'>
            <Settings size={20} className='text-slate-500' />
          </button>
        </div>
      </aside>
    );
  }

  return (
    <aside className='w-full md:w-80 h-full glass-panel flex flex-col gap-2 p-3 transition-all duration-500 overflow-y-auto custom-scroll'>
      <div className='flex items-center justify-between p-2 mb-2'>
        <div className='flex items-center gap-2 text-indigo-400 font-black tracking-tighter'>
          <LayoutDashboard size={20} />
          <span className='text-sm'>GUARD CONSOLE</span>
        </div>
        <button onClick={toggleSidebar} className='p-2 rounded-xl bg-white/5 hover:bg-white/10 active-press'>
          <X size={18} className='text-slate-500' />
        </button>
      </div>

      <div className={`p-3 rounded-xl border flex items-center justify-between mb-2 shadow-inner transition-all ${connected ? 'bg-emerald-500/10 border-emerald-500/20 indicator-pulse' : 'bg-red-500/10 border-red-500/20'}`}>
        <div className={`flex items-center gap-2 ${connected ? 'text-emerald-400' : 'text-red-400'}`}>
          <Activity size={14} className={connected ? 'animate-pulse' : ''} />
          <span className='text-[10px] font-black uppercase tracking-widest'>{connected ? 'Engine Online' : 'Engine Offline'}</span>
        </div>
        <span className={`text-[10px] font-mono px-2 py-0.5 rounded-full border ${connected ? 'text-emerald-300 bg-emerald-500/20 border-emerald-500/30' : 'text-red-300 bg-red-500/20 border-red-500/30'}`}>
          {connected ? (engineStatus ? `${engineStatus.cpu_usage}% CPU` : "ACTIVE") : "NOSYNC"}
        </span>
      </div>
      
      {/* ADMIN CONTROLS */}
      <div className='border-b border-white/5 pb-2 mb-2'>
        <button onClick={() => toggleSection('admin')} className='w-full flex items-center justify-between p-2 rounded-xl hover:bg-white/5 transition-all mb-1 group'>
          <div className='flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-blue-400'>
            <Lock size={14} /> Admin Controls
          </div>
          <ChevronDown size={14} className={`text-slate-600 transition-transform ${openSections.admin ? 'rotate-180' : ''}`} />
        </button>
        {openSections.admin && (
          <div className='px-2 space-y-3 pb-2 animate-[fadeIn_0.3s_ease-out]'>
            <div className='flex gap-2'>
              <button onClick={() => setSimulateMode(!simulateMode)} className={`flex-1 py-1.5 rounded-lg text-[9px] font-black border flex items-center justify-center gap-2 active-press transition-all ${simulateMode ? 'bg-yellow-500/20 border-yellow-500/50 text-yellow-200' : 'bg-slate-800/40 border-slate-700/50 text-slate-400'}`}><Power size={12} /> {simulateMode ? 'SIM ON' : 'SIM OFF'}</button>
              <button onClick={() => setVoiceEnabled(!voiceEnabled)} className={`flex-1 py-1.5 rounded-lg text-[9px] font-black border flex items-center justify-center gap-2 active-press transition-all ${voiceEnabled ? 'bg-emerald-500/20 border-emerald-500/50 text-emerald-200' : 'bg-slate-800/40 border-slate-700/50 text-slate-400'}`}>{voiceEnabled ? <Volume2 size={12} /> : <VolumeX size={12} />} {voiceEnabled ? 'VOICE' : 'MUTE'}</button>
            </div>
            <div className='grid grid-cols-2 gap-2'>
              {['NORTH', 'EAST', 'SOUTH', 'WEST'].map(dir => (
                <button key={dir} onClick={() => sendCommand(`FORCE_${dir}`)} className='text-[9px] py-1.5 rounded-lg bg-slate-800/40 hover:bg-indigo-500 border border-white/5 hover:border-indigo-400 font-bold uppercase active-press transition-all'>{dir}</button>
              ))}
            </div>
            <button onClick={() => setShowAdmin(true)} className='w-full py-2 rounded-lg bg-indigo-600/10 hover:bg-indigo-600 border border-indigo-500/20 text-indigo-300 hover:text-white text-[10px] font-black flex items-center justify-center gap-2 active-press transition-all'>
              <Settings size={14} /> CONFIGURE SYSTEM
            </button>
          </div>
        )}
      </div>

      {/* SYSTEM ALERTS */}
      <div className='border-b border-white/5 pb-2 mb-2'>
        <button onClick={() => toggleSection('alerts')} className='w-full flex items-center justify-between p-2 rounded-xl hover:bg-white/5 transition-all mb-1 group'>
          <div className='flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-yellow-400'>
            <ShieldAlert size={14} /> Critical Alerts
          </div>
          <ChevronDown size={14} className={`text-slate-600 transition-transform ${openSections.alerts ? 'rotate-180' : ''}`} />
        </button>
        {openSections.alerts && (
          <div className='px-2 pb-2 space-y-2 max-h-48 overflow-y-auto custom-scroll'>
            {alerts?.length > 0 ? alerts.map((a,i) => (
              <div key={i} className='p-2 bg-red-500/10 border border-red-500/20 rounded-lg text-[10px] text-red-200 flex flex-col gap-1'>
                <div className='flex justify-between font-bold'>
                  <span>VIOLATION</span>
                  <span className='opacity-50'>{new Date().toLocaleTimeString()}</span>
                </div>
                <div className='opacity-80'>{a.message}</div>
              </div>
            )) : <div className='text-[10px] text-slate-600 italic px-2'>No active threats detected...</div>}
          </div>
        )}
      </div>
    </aside>
  );
}
