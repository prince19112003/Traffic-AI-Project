"use client";
import React, { useEffect, useRef } from 'react';
import { useTrafficStore } from '../store/trafficStore';
import TrafficGrid from '../components/TrafficGrid';
import Sidebar from '../components/Sidebar';
import AdminPanel from '../components/AdminPanel';
import Header from '../components/Header';

export default function TrafficDashboard() {
  const { 
    data, connected, simulateMode, voiceEnabled, isSidebarCollapsed, showAdmin,
    updateData, setConnected, setSimulateMode, setVoiceEnabled, setShowAdmin, toggleSidebar 
  } = useTrafficStore();
  
  const wsRef = useRef(null);

  useEffect(() => {
    let ws = null;
    if (!simulateMode) {
      try {
        ws = new WebSocket('ws://localhost:8000/ws');
        wsRef.current = ws;
        ws.onopen = () => setConnected(true);
        ws.onclose = () => setConnected(false);
        ws.onmessage = ev => {
          try {
            const parsed = JSON.parse(ev.data);
            updateData(parsed);
          } catch(e) {}
        };
      } catch {}
    } else {
      if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) wsRef.current.close();
      setConnected(false);
    }
    return () => { if (ws) ws.close(); }
  }, [simulateMode, updateData, setConnected]);

  const sendCommand = (cmd) => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ command: cmd }));
    }
  };

  return (
    <div className='h-screen w-full flex flex-col bg-slate-950 p-2 gap-2 overflow-hidden'>
      <Header />
      <div className='flex-1 flex flex-col md:flex-row gap-2 overflow-hidden'>
        {/* Central Visual Grid */}
      <TrafficGrid 
        feeds={data.feeds} 
        counts={data.counts} 
        logic={data.logic} 
        env={data.env} 
      />
      
      {/* Sidebar Controls */}
      <Sidebar 
        analytics={data.analytics}
        alerts={useTrafficStore.getState().alerts}
        violations={useTrafficStore.getState().violations}
        sendCommand={sendCommand}
        voiceEnabled={voiceEnabled}
        setVoiceEnabled={setVoiceEnabled}
        simulateMode={simulateMode}
        setSimulateMode={setSimulateMode}
        setShowAdmin={setShowAdmin}
        engineStatus={data.system}
        isCollapsed={isSidebarCollapsed}
        toggleSidebar={toggleSidebar}
        connected={connected}
      />
      </div>

      {/* Admin Configuration Portal */}
      <AdminPanel 
        isOpen={showAdmin} 
        onClose={() => setShowAdmin(false)} 
      />
    </div>
  );
}
