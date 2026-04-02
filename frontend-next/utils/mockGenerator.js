/**
 * Mock Data Generator for Traffic Dashboard Simulation
 * ---------------------------------------------------
 * This helper simulates the behavior of the AI backend.
 */

let simulationState = {
  active_dir: 'north',
  state: 'GREEN',
  timer: 30,
  counts: { north: 12, east: 5, south: 8, west: 3 },
  signal_map: { north: 'GREEN', east: 'RED', south: 'RED', west: 'RED' },
  wait_timers: { north: -1, east: 34, south: -1, west: -1 }
};

const DIRECTIONS = ['north', 'east', 'south', 'west'];

export const getNextMockPayload = (prevState = simulationState) => {
  let { active_dir, state, timer, counts, signal_map, wait_timers } = prevState;

  // 1. Tick down timer
  timer = Math.max(0, timer - 1);

  // 2. Randomize counts slightly every tick
  const newCounts = { ...counts };
  DIRECTIONS.forEach(d => {
    if (Math.random() > 0.8) {
      const change = Math.random() > 0.5 ? 1 : -1;
      newCounts[d] = Math.max(0, Math.min(40, newCounts[d] + change));
    }
  });

  // 3. Handle state transitions
  if (timer === 0) {
    if (state === 'GREEN') {
      state = 'YELLOW';
      timer = 4;
    } else if (state === 'YELLOW') {
      state = 'GREEN';
      // Switch active direction in a circle for simple simulation
      const currentIdx = DIRECTIONS.indexOf(active_dir);
      active_dir = DIRECTIONS[(currentIdx + 1) % DIRECTIONS.length];
      
      // Dynamic green time based on mock counts
      const count = newCounts[active_dir];
      timer = count > 20 ? 60 : (count > 10 ? 45 : 30);
    }
  }

  // 4. Update signal map
  const newSignalMap = { north: 'RED', east: 'RED', south: 'RED', west: 'RED' };
  newSignalMap[active_dir] = state;

  // 5. Update wait timers
  const nextIdx = (DIRECTIONS.indexOf(active_dir) + 1) % DIRECTIONS.length;
  const nextDir = DIRECTIONS[nextIdx];
  const newWaitTimers = { north: -1, east: -1, south: -1, west: -1 };
  
  if (state === 'GREEN' || state === 'YELLOW') {
    newWaitTimers[nextDir] = timer + (state === 'GREEN' ? 4 : 0);
  }

  const newState = {
    active_dir,
    state,
    timer,
    counts: newCounts,
    signal_map: newSignalMap,
    wait_timers: newWaitTimers
  };

  simulationState = newState; // Persist for next tick

  return {
    feeds: {}, // No real-time mock images for now
    counts: newCounts,
    logic: newState,
    system: {
      cpu_usage: (15 + Math.random() * 5).toFixed(1),
      ram_usage: (42 + Math.random() * 2).toFixed(1),
      temp: (55 + Math.random() * 3).toFixed(1)
    },
    analytics: {
      avg_wait: 42,
      total_passed: 120,
      violations: 2
    },
    env: {
       is_night: false,
       obstacle_zone: null
    }
  };
};
