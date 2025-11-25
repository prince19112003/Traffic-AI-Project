import time
from config import TIME_SLOTS, YELLOW_TIME

class TrafficController:
    def __init__(self):
        self.phases = ['north', 'east', 'south', 'west']
        self.current_phase_idx = 0
        self.current_state = 'RED'
        self.timer = 0
        self.last_update_time = time.time()
        
        # Fairness & Planning
        self.last_green_time = {p: time.time() for p in self.phases}
        self.MAX_WAIT_THRESHOLD = 60 
        self.next_duration = TIME_SLOTS['low']
        
        # Override Flags
        self.emergency_active = False
        self.emergency_dir = None
        self.manual_override = False
        self.manual_command = None
        
        # Weather & Safety Flags
        self.is_raining = False
        self.SAFETY_YELLOW_TIME = 6 
        
        self.system_status = "System Running"

    def set_phase(self, idx, duration):
        self.current_phase_idx = idx % 4
        self.timer = duration
        self.current_state = 'GREEN'
        self.emergency_active = False
        current_dir = self.phases[self.current_phase_idx]
        self.last_green_time[current_dir] = time.time()

    def handle_manual_command(self, cmd):
        if cmd == 'AUTO':
            self.manual_override = False
            self.manual_command = None
            self.system_status = "Auto Mode Active"
            print("[MODE] Switched to AUTOMATIC")
        elif cmd in ['FORCE_NORTH', 'FORCE_EAST', 'FORCE_SOUTH', 'FORCE_WEST']:
            self.manual_override = True
            direction = cmd.split('_')[1].lower()
            try:
                self.current_phase_idx = self.phases.index(direction)
                self.current_state = 'GREEN'
                self.timer = 999
                self.system_status = f"Manual Lock: {direction.upper()}"
            except ValueError: pass
        elif cmd == 'STOP_ALL':
            self.manual_override = True
            self.current_state = 'RED'
            self.timer = 999
            self.system_status = "EMERGENCY STOP"

    def trigger_emergency(self, direction):
        if self.emergency_active and self.emergency_dir == direction: return 
        if self.manual_override: return 
        
        print(f"[!!!] AMBULANCE DETECTED IN {direction.upper()} [!!!]")
        self.emergency_active = True
        self.emergency_dir = direction
        self.system_status = f"🚑 AMBULANCE in {direction.upper()}"
        
        try:
            target_idx = self.phases.index(direction)
            self.current_phase_idx = target_idx
            self.current_state = 'GREEN'
            self.timer = 15 
        except ValueError: pass

    def calculate_adaptive_time(self, count):
        if count <= 5: return TIME_SLOTS['low']
        if count <= 10: return TIME_SLOTS['medium']
        if count <= 15: return TIME_SLOTS['high']
        return TIME_SLOTS['jam']

    def update(self, current_counts, has_emergency, emergency_loc):
        now = time.time()
        delta = now - self.last_update_time
        self.last_update_time = now
        
        # 1. Manual Mode
        if self.manual_override:
            return self._build_state_response()

        # 2. Emergency Mode
        if has_emergency:
            self.trigger_emergency(emergency_loc)
            return self._build_state_response(mode="PRIORITY", state="EMERGENCY")
        
        if self.emergency_active and not has_emergency:
             self.emergency_active = False 
             self.system_status = "Resuming Normal Flow"
        
        # --- A. RAIN DETECTION ---
        if current_counts.get('rain_trigger', 0) > 0:
            self.is_raining = True
            self.system_status = "🌧️ Rain Mode: Extended Yellow Light"
        else:
            self.is_raining = False

        # --- B. PEDESTRIAN SCRAMBLE ---
        total_people = current_counts.get('person', 0)
        if total_people > 5 and self.current_state != 'PEDESTRIAN':
            self.current_state = 'PEDESTRIAN'
            self.timer = 10 
            self.system_status = "🚸 Pedestrian Scramble (All Red)"
            return self._build_state_response(mode="SAFETY", state="RED", active="all_stop")
            
        if self.current_state == 'PEDESTRIAN':
            if self.timer > 0:
                self.timer -= delta
                return self._build_state_response(mode="SAFETY", state="RED", active="all_stop")
            else:
                self.set_phase(0, TIME_SLOTS['low']) # Reset

        # --- C. ECO MODE ---
        # Count only vehicles in zones
        total_traffic = sum(val for key, val in current_counts.items() if key in self.phases)
        
        if total_traffic < 3 and self.current_state != 'GREEN' and self.timer <= 0:
             self.current_state = 'ECO'
             self.system_status = "🌙 Eco Mode (Low Traffic)"
             return self._build_state_response(mode="ECO", state="ECO", timer="CAUTION", active="all", signal="YELLOW")
        
        if self.current_state == 'ECO':
            if total_traffic >= 3:
                self.set_phase(0, TIME_SLOTS['low'])
                self.system_status = "Traffic Detected: Waking Up"
            else:
                 return self._build_state_response(mode="ECO", state="ECO", timer="CAUTION", active="all", signal="YELLOW")

        # 3. Timer Update
        if self.timer > 0: self.timer -= delta

        # Lock Next Duration
        if self.current_state == 'GREEN' and 4.5 <= self.timer <= 5.5:
            next_idx = (self.current_phase_idx + 1) % 4
            next_dir = self.phases[next_idx]
            count = current_counts.get(next_dir, 0)
            self.next_duration = self.calculate_adaptive_time(count)
        
        # State Transitions
        if self.current_state == 'GREEN' and self.timer <= 0:
            self.current_state = 'YELLOW'
            self.timer = self.SAFETY_YELLOW_TIME if self.is_raining else YELLOW_TIME
        
        elif self.current_state == 'YELLOW' and self.timer <= 0:
            # Smart Skip & Starvation
            self._handle_smart_transition(current_counts, now)
        
        return self._build_state_response()

    def _handle_smart_transition(self, current_counts, now):
        # 1. Check Starvation
        starved_lane = None
        max_wait = 0
        for phase in self.phases:
            wait_time = now - self.last_green_time[phase]
            if wait_time > self.MAX_WAIT_THRESHOLD and current_counts.get(phase, 0) > 0:
                if wait_time > max_wait:
                    max_wait = wait_time
                    starved_lane = phase
        
        if starved_lane:
            target_idx = self.phases.index(starved_lane)
            duration = self.calculate_adaptive_time(current_counts.get(starved_lane, 0))
            self.set_phase(target_idx, duration)
            self.system_status = f"⚠️ Starvation Watchdog: Forcing {starved_lane.upper()}"
        else:
            # 2. Smart Skip
            found_next_lane = False
            check_idx = self.current_phase_idx
            for i in range(1, 5): 
                temp_idx = (check_idx + i) % 4
                temp_dir = self.phases[temp_idx]
                count = current_counts.get(temp_dir, 0)
                if count > 0:
                    duration = self.calculate_adaptive_time(count)
                    self.set_phase(temp_idx, duration)
                    self.system_status = f"Switched to {temp_dir.upper()} (Count: {count})"
                    found_next_lane = True
                    break
            
            if not found_next_lane:
                next_idx = (self.current_phase_idx + 1) % 4
                self.set_phase(next_idx, TIME_SLOTS['low'])
                self.system_status = "Idle Mode (Scanning)"

    def _build_state_response(self, mode="AUTO", state=None, timer=None, active=None, signal=None):
        if state is None: state = self.current_state
        if timer is None: timer = max(0, int(self.timer))
        if active is None: active = self.phases[self.current_phase_idx]
        
        signal_map = {p: 'RED' for p in self.phases}
        if signal:
            signal_map = {p: signal for p in self.phases}
        elif state != 'ECO' and active in self.phases:
            signal_map[active] = state
            
        return {
            "active_dir": active,
            "next_dir": self.phases[(self.current_phase_idx + 1) % 4] if active in self.phases else "wait",
            "state": state,
            "timer": timer,
            "mode": mode,
            "status": self.system_status,
            "signal_map": signal_map
        }
