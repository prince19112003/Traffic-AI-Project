"use client";
import React, { useState } from 'react';
import { X, Settings, Cpu, TrafficCone, Save, RefreshCcw, ShieldCheck } from 'lucide-react';

export default function AdminPanel({ isOpen, onClose }) {
  const [settings, setSettings] = useState({
    confidence: 0.45,
    minGreen: 15,
    maxGreen: 60,
    emergencyBuffer: 10,
    streamUrl: 'https://sample.video/traffic.mp4'
  });

  if (!isOpen) return null;

  return (
    <div className='fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md animate-[fadeIn_0.5s_ease-out]'>
      <div className='w-full max-w-lg glass-panel p-6 flex flex-col gap-6 relative shadow-[0_0_50px_rgba(79,70,229,0.2)]'>
        {/* HEADER */}
        <div className='flex items-center justify-between border-b border-white/5 pb-4'>
          <div className='flex items-center gap-3 text-indigo-400'>
            <Settings className='animate-[spin_10s_linear_infinite]' />
            <h2 className='text-lg font-black uppercase tracking-tighter'>System Configuration</h2>
          </div>
          <button onClick={onClose} className='p-2 rounded-xl bg-white/5 hover:bg-red-500/20 hover:text-red-400 transition-all active-press'>
            <X size={20} />
          </button>
        </div>

        {/* AI SETTINGS */}
        <div className='space-y-4'>
          <div className='flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-slate-500'>
            <Cpu size={14} /> AI Processing Core
          </div>
          <div className='space-y-2'>
            <div className='flex justify-between text-[11px] font-bold'>
              <span className='text-slate-300'>Confidence Threshold</span>
              <span className='text-indigo-400 font-mono'>{settings.confidence}</span>
            </div>
            <input 
              type="range" min="0.1" max="0.9" step="0.05"
              value={settings.confidence}
              onChange={(e) => setSettings({...settings, confidence: parseFloat(e.target.value)})}
              className='w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-indigo-500'
            />
          </div>
        </div>

        {/* LOGIC SETTINGS */}
        <div className='space-y-4'>
          <div className='flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-slate-500'>
            <TrafficCone size={14} /> Signal Logic Engine
          </div>
          <div className='grid grid-cols-2 gap-4'>
            <div className='space-y-1.5'>
              <label className='text-[10px] font-bold text-slate-400 uppercase'>Min Green (s)</label>
              <input type="number" value={settings.minGreen} onChange={(e) => setSettings({...settings, minGreen: e.target.value})} className='w-full bg-slate-900/50 border border-white/10 rounded-lg p-2 text-xs font-mono' />
            </div>
            <div className='space-y-1.5'>
              <label className='text-[10px] font-bold text-slate-400 uppercase'>Max Green (s)</label>
              <input type="number" value={settings.maxGreen} onChange={(e) => setSettings({...settings, maxGreen: e.target.value})} className='w-full bg-slate-900/50 border border-white/10 rounded-lg p-2 text-xs font-mono' />
            </div>
          </div>
        </div>

        {/* ACTIONS */}
        <div className='flex gap-3 pt-2'>
          <button className='flex-1 py-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-black flex items-center justify-center gap-2 active-press transition-all shadow-lg shadow-indigo-600/20'>
            <Save size={16} /> SAVE & APPLY
          </button>
          <button className='px-4 py-3 bg-white/5 hover:bg-white/10 rounded-xl text-slate-400'>
            <RefreshCcw size={16} />
          </button>
        </div>

        <div className='bg-emerald-500/5 border border-emerald-500/10 p-3 rounded-lg flex items-center gap-3'>
          <ShieldCheck className='text-emerald-500' size={18} />
          <span className='text-[10px] font-bold text-emerald-400 opacity-80'>Settings encrypted & synchronized with AI Engine.</span>
        </div>
      </div>
    </div>
  );
}
