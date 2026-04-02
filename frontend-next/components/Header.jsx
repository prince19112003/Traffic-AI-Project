"use client";
import React, { useState, useEffect } from 'react';
import { Clock, ShieldCheck, Globe } from 'lucide-react';

export default function Header() {
  const [time, setTime] = useState(new Date());
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  if (!mounted) return (
    <header className='w-full glass-panel flex items-center justify-between px-6 py-3 mb-2 h-[68px] animate-pulse bg-white/5' />
  );

  return (
    <header className='w-full glass-panel flex items-center justify-between px-6 py-3 mb-2 animate-[slideDown_0.5s_ease-out]'>
      <div className='flex items-center gap-4'>
        <div className='flex items-center gap-2 text-indigo-400 font-black tracking-tighter text-lg'>
          <ShieldCheck size={24} className='text-emerald-500' />
          <span>TRAFFIC GUARD <span className='text-white/20 font-light'>|</span> ULTRA</span>
        </div>
        <div className='hidden md:flex items-center gap-2 bg-white/5 px-3 py-1 rounded-full border border-white/5'>
          <Globe size={14} className='text-slate-500' />
          <span className='text-[10px] font-bold text-slate-400 uppercase tracking-widest'>Global Active Zone</span>
        </div>
      </div>

      <div className='flex items-center gap-6'>
        <div className='flex flex-col items-end'>
          <div className='flex items-center gap-2 text-indigo-400 font-mono font-black text-xl tracking-tight'>
            <Clock size={18} className='text-indigo-500/50' />
            {time.toLocaleTimeString([], { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' })}
          </div>
          <span className='text-[10px] font-bold text-slate-500 uppercase tracking-[0.3em] mr-1'>Universal System Time</span>
        </div>
      </div>
    </header>
  );
}
