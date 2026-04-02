# ============================================================
# controller.py
# ------------------------------------------------------------
# TRAFFIC SIGNAL LOGIC CONTROLLER (WEIGHTED ADAPTIVE VERSION)
#
# Logic:
# - Weighted Density: Lanes with more vehicles get more priority points.
# - Wait-Time Fairness: Long-waiting lanes gain "priority weight" over time.
# - Emergency Preemption: Immediate override for emergency vehicles.
# - Adaptive Timers: Dynamic calculation of green duration.
# ============================================================

import time
from config import (
    TIME_SLOTS,
    YELLOW_TIME,
    SAFETY_YELLOW_TIME,
    DIRECTIONS,
)


class TrafficController:
    """
    TrafficController
    -----------------
    An intelligent state machine that decides signal transitions
    based on a Weighted Priority Algorithm.
    """

    def __init__(self):
        self.phases = DIRECTIONS
        self.current_phase_idx = 0
        self.current_state = "RED"
        self.timer: float | int | str = 0
        self.last_update_time = time.time()

        # Tracking for fairness
        self.lane_wait_start = {d: time.time() for d in self.phases}
        self.MAX_WAIT_SECONDS = 120  # Absolute max wait before forced switch

        self.next_duration = TIME_SLOTS["low"]
        self.emergency_active = False
        self.is_raining = False
        self.manual_override = False
        self.system_status = "System Running"
        self.predicted_violation_dir = None
        
        # New: Phase timing benchmarks
        self.last_phase_start = time.time()
        self.MIN_GREEN_TIME = 8 # Minimum green time before early switch
        self.early_switch_triggered = False

    def calculate_adaptive_time(self, count: int) -> int:
        """Adaptive Green Time calculation based on vehicle density."""
        if count <= 10: return TIME_SLOTS["low"]
        if count <= 25: return TIME_SLOTS["medium"]
        return TIME_SLOTS["high"]

    def set_phase(self, idx: int, duration: int):
        """Force a direction to GREEN."""
        self.current_phase_idx = idx % len(self.phases)
        self.timer = duration
        self.current_state = "GREEN"
        self.emergency_active = False
        
        active_dir = self.phases[self.current_phase_idx]
        # Reset wait time for current green lane
        self.lane_wait_start[active_dir] = time.time()
        self.last_phase_start = time.time()
        self.early_switch_triggered = False

    def handle_manual_command(self, cmd: str):
        if cmd == "AUTO":
            self.manual_override = False
            self.system_status = "Auto Mode Active"
            self.set_phase(0, TIME_SLOTS["low"])
        elif cmd == "STOP_ALL":
            self.manual_override = True
            self.current_state = "RED"
            self.timer = 999
            self.system_status = "EMERGENCY STOP"
        elif cmd.startswith("FORCE_"):
            direction = cmd.split("_")[1].lower()
            if direction in self.phases:
                self.manual_override = True
                self.current_phase_idx = self.phases.index(direction)
                self.current_state = "GREEN"
                self.timer = 999
                self.system_status = f"Manual Lock: {direction.upper()}"

    def _get_weighted_next_phase(self, counts: dict) -> int:
        """
        WEIGHTED PRIORITY ALGORITHM
        Calculates a 'Priority Score' for each RED lane.
        Score = (Vehicle Count * 2) + (Wait Time / 10)
        """
        best_score = -1
        best_idx = (self.current_phase_idx + 1) % len(self.phases)
        now = time.time()

        for i, d in enumerate(self.phases):
            if i == self.current_phase_idx: continue
            
            count = counts.get(d, 0)
            wait_time = now - self.lane_wait_start[d]
            
            # Score calculation
            score = (count * 2.5) + (wait_time / 8.0)
            
            # Forced switch if waiting too long
            if wait_time > self.MAX_WAIT_SECONDS:
                score += 500

            if score > best_score:
                best_score = score
                best_idx = i
        
        return best_idx

    def update(self, current_counts: dict, has_emergency: bool, emergency_loc: str | None):
        now = time.time()
        delta = now - self.last_update_time
        self.last_update_time = now

        if self.manual_override:
            return self._build_state_response()

        # 1. EMERGENCY (Absolute Priority)
        if has_emergency and emergency_loc in self.phases:
            idx = self.phases.index(emergency_loc)
            if self.current_phase_idx != idx or self.current_state != "GREEN":
                self.set_phase(idx, 20) # Give 20s for emergency clearance
                self.system_status = f"🚑 EMERGENCY: {emergency_loc.upper()}"
            return self._build_state_response(mode="PRIORITY", state="EMERGENCY")

        # 2. RAIN CHECK
        self.is_raining = current_counts.get("rain_trigger", 0) > 0
        if self.is_raining:
            self.system_status = "🌧️ Weather Alert: Rain Mode"

        # 3. TIMER MANAGEMENT
        if isinstance(self.timer, (int, float)) and self.timer > 0:
            self.timer -= delta

        # 3.5 EARLY SWITCH (Optimizing Empty Lane)
        if self.current_state == "GREEN" and not self.early_switch_triggered:
            active_dir = self.phases[self.current_phase_idx]
            active_count = current_counts.get(active_dir, 0)
            time_in_phase = now - self.last_phase_start
            
            # If lane empty and min time passed, cut timer
            if active_count == 0 and time_in_phase > self.MIN_GREEN_TIME and self.timer > 2:
                self.timer = 2 # 2s final buffer for safety
                self.early_switch_triggered = True
                self.system_status = f"⚡ Optimizing: Empty Lane {active_dir.upper()}"

        # 4. TRANSITIONS
        if self.current_state == "GREEN" and self.timer <= 0:
            # Transition to YELLOW
            self.current_state = "YELLOW"
            self.timer = SAFETY_YELLOW_TIME if self.is_raining else YELLOW_TIME
            
            # Pre-calculate next phase using WEIGHTED logic
            next_idx = self._get_weighted_next_phase(current_counts)
            next_dir = self.phases[next_idx]
            self.next_duration = self.calculate_adaptive_time(current_counts.get(next_dir, 0))
            self._temp_next_idx = next_idx # Store for yellow transition

        elif self.current_state == "YELLOW" and self.timer <= 0:
            # Transition to next calculated GREEN
            self.set_phase(self._temp_next_idx, self.next_duration)

        # 5. ECO MODE (if all lanes empty)
        total_traffic = sum(current_counts.get(d, 0) for d in self.phases)
        if total_traffic == 0 and self.current_state != "GREEN" and self.timer <= 0:
            self.current_state = "ECO"
            self.system_status = "🌙 ECO Mode: Idle"
            return self._build_state_response(mode="ECO", state="ECO", timer="SLEEP", signal="YELLOW", current_counts=current_counts)

        if self.current_state == "ECO" and total_traffic > 0:
            self.system_status = "Traffic Detected: Waking Up"
            self.set_phase(0, TIME_SLOTS["low"])

        # 6. VIOLATION PREDICTION
        self._update_predicted_violation(current_counts)

        return self._build_state_response(current_counts=current_counts)

    def _update_predicted_violation(self, current_counts: dict):
        self.predicted_violation_dir = None
        if self.current_state == "YELLOW" and self.timer <= 2:
            active = self.phases[self.current_phase_idx]
            for d in self.phases:
                if d != active and current_counts.get(d, 0) >= 4: # High density in wait lane
                    self.predicted_violation_dir = d
                    break

    def _build_state_response(self, mode="AUTO", state=None, timer=None, signal=None, current_counts=None):
        if state is None: state = self.current_state
        if timer is None:
            timer = max(0, int(self.timer)) if isinstance(self.timer, (int, float)) else self.timer
        
        active = self.phases[self.current_phase_idx]
        
        # Calculate next lane for Red Timer
        if current_counts:
            next_idx = self._get_weighted_next_phase(current_counts)
        else:
            next_idx = (self.current_phase_idx + 1) % len(self.phases)
        
        next_dir = self.phases[next_idx]
        
        signal_map = {p: "RED" for p in self.phases}
        wait_timers = {p: -1 for p in self.phases} # -1 means no timer

        if signal:
            signal_map = {p: signal for p in self.phases}
        else:
            if state != "ECO": signal_map[active] = state

        # RED TIMER LOGIC: If state is GREEN/YELLOW, next lane shows countdown
        if state in ["GREEN", "YELLOW"] and next_dir != active:
            yellow_boost = (SAFETY_YELLOW_TIME if self.is_raining else YELLOW_TIME) if state == "GREEN" else 0
            wait_timers[next_dir] = max(0, int(self.timer) + yellow_boost)

        return {
            "active_dir": active,
            "next_dir": next_dir,
            "state": state,
            "timer": timer,
            "mode": mode,
            "status": self.system_status,
            "signal_map": signal_map,
            "wait_timers": wait_timers,
            "predicted_violation_dir": self.predicted_violation_dir,
        }
