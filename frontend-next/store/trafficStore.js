import { create } from 'zustand';

export const useTrafficStore = create((set, get) => ({
  connected: false,
  simulateMode: false,
  voiceEnabled: true,
  showAdmin: false,
  data: {
    feeds: {},
    counts: {},
    logic: {},
    analytics: {},
    env: {},
    system: {}
  },
  alerts: [],
  violations: [],
  
  setConnected: (status) => set({ connected: status }),
  setSimulateMode: (mode) => set({ simulateMode: mode }),
  setVoiceEnabled: (enabled) => set({ voiceEnabled: enabled }),
  setShowAdmin: (show) => set({ showAdmin: show }),
  
  updateData: (payload) => set((state) => ({
    data: {
      feeds: payload.feeds || state.data.feeds,
      counts: payload.counts || state.data.counts,
      logic: payload.logic || state.data.logic,
      analytics: payload.analytics || state.data.analytics,
      env: payload.env || state.data.env,
      system: payload.system || state.data.system,
    }
  })),

  addAlert: (alert) => set((state) => {
    if (state.alerts.length > 0 && state.alerts[0].id === alert.id) return state;
    return { alerts: [alert, ...state.alerts].slice(0, 10) }
  }),

  addViolation: (violation) => set((state) => {
    return { violations: [violation, ...state.violations].slice(0, 15) }
  })
}));
