# ============================================================
# controller.py
# ------------------------------------------------------------
# TRAFFIC SIGNAL LOGIC CONTROLLER
#
# Handles:
# - Phase switching (N → E → S → W)
# - Adaptive green time (based on vehicle count)
# - Rain mode (longer yellow)
# - ECO mode (low traffic)
# - Emergency override (ambulance)
# - Manual override from frontend
# - Violation prediction (possible red light jump)
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
    Decides:
    - Which lane is GREEN
    - How long GREEN lasts
    - When to switch YELLOW → NEXT GREEN
    - When to activate ECO mode
    """

    def __init__(self):
        # Fixed direction list: N → E → S → W
        self.phases = DIRECTIONS

        # Current phase index (0 = north, 1 = east, ...)
        self.current_phase_idx = 0

        # Current signal state (GREEN/YELLOW/RED/ECO/EMERGENCY)
        self.current_state = "RED"

        # Timer (seconds remaining for current state)
        self.timer: float | int | str = 0

        # Used to compute delta time per update()
        self.last_update_time = time.time()

        # Track when each direction last received green (for fairness / future use)
        self.last_green_time = {d: time.time() for d in self.phases}
        self.MAX_WAIT_THRESHOLD = 90  # If a lane waits > 90s → can be forced (future use)

        # Pre-calculated next duration (lookahead logic)
        self.next_duration = TIME_SLOTS["low"]

        # Flags
        self.emergency_active = False
        self.emergency_dir = None
        self.is_raining = False
        self.manual_override = False
        self.system_status = "System Running"

        # For predictive violation detection
        self.predicted_violation_dir = None

    # ============================================================
    # Adaptive green time based on vehicle count
    # ============================================================

    def calculate_adaptive_time(self, count: int) -> int:
        """
        Adaptive Green Time:
        - 0–15  → 30s
        - 16–25 → 60s
        - >25   → 90s
        """
        if count <= 15:
            return TIME_SLOTS["low"]
        if count <= 25:
            return TIME_SLOTS["medium"]
        return TIME_SLOTS["high"]

    # ============================================================
    # Function to directly force a phase to GREEN
    # ============================================================

    def set_phase(self, idx: int, duration: int):
        """Switch to lane[idx] and make it GREEN for <duration> seconds."""
        self.current_phase_idx = idx % len(self.phases)
        self.timer = duration
        self.current_state = "GREEN"
        self.emergency_active = False

        active_dir = self.phases[self.current_phase_idx]
        self.last_green_time[active_dir] = time.time()

    # ============================================================
    # Manual commands from frontend (FORCE_NORTH, STOP_ALL, AUTO)
    # ============================================================

    def handle_manual_command(self, cmd: str):
        # -------------------- AUTO MODE --------------------
        if cmd == "AUTO":
            self.manual_override = False
            self.system_status = "Auto Mode Active"
            self.current_phase_idx = 0
            self.set_phase(0, TIME_SLOTS["low"])
            return

        # -------------------- FORCE MODE --------------------
        if cmd.startswith("FORCE_"):
            direction = cmd.split("_")[1].lower()

            if direction in self.phases:
                self.manual_override = True
                self.current_phase_idx = self.phases.index(direction)
                self.current_state = "GREEN"
                self.timer = 999  # Infinite timer until changed
                self.system_status = f"Manual Lock → {direction.upper()}"
            return

        # -------------------- EMERGENCY STOP --------------------
        if cmd == "STOP_ALL":
            self.manual_override = True
            self.current_state = "RED"
            self.timer = 999
            self.system_status = "EMERGENCY STOP (Manual)"
            return

    # ============================================================
    # MAIN UPDATE STEP (called every cycle from server)
    # ============================================================

    def update(self, current_counts: dict, has_emergency: bool, emergency_loc: str | None):
        """
        Main State Machine:
        - Called every ~50ms from backend loop
        - Updates timers, phases, emergency handling, rain, eco...
        """

        now = time.time()
        delta = now - self.last_update_time
        self.last_update_time = now

        # -------------------- MANUAL OVERRIDE --------------------
        if self.manual_override:
            return self._build_state_response()

        # -------------------- EMERGENCY HANDLING --------------------
        if has_emergency and emergency_loc:
            if emergency_loc in self.phases:
                idx = self.phases.index(emergency_loc)
                self.current_phase_idx = idx
                self.timer = 15
                self.current_state = "GREEN"
                self.system_status = f"🚑 EMERGENCY → {emergency_loc.upper()}"
                return self._build_state_response(mode="PRIORITY", state="EMERGENCY")

        # -------------------- RAIN CHECK --------------------
        self.is_raining = current_counts.get("rain_trigger", 0) > 0
        if self.is_raining:
            self.system_status = "🌧️ Rain Mode (Extended Yellow)"

        # -------------------- ECO MODE CHECK --------------------
        total_traffic = sum(current_counts.get(d, 0) for d in self.phases)

        # Enter ECO if very low traffic and not currently GREEN
        if total_traffic < 10 and self.current_state != "GREEN" and self.timer <= 0:
            self.current_state = "ECO"
            self.system_status = "🌙 ECO MODE (Low Traffic)"
            return self._build_state_response(
                mode="ECO", state="ECO", timer="SLEEP", signal="YELLOW"
            )

        # Stay in ECO until traffic rises again
        if self.current_state == "ECO":
            if total_traffic >= 10:
                self.set_phase(0, TIME_SLOTS["low"])
                self.system_status = "Traffic detected → Exiting ECO Mode"
            else:
                return self._build_state_response(
                    mode="ECO", state="ECO", timer="SLEEP", signal="YELLOW"
                )

        # ============================================================
        # TIMER COUNTDOWN
        # ============================================================

        if isinstance(self.timer, (int, float)) and self.timer > 0:
            self.timer -= delta

        # -------------------- 5-second LOOKAHEAD --------------------
        if self.current_state == "GREEN" and isinstance(self.timer, (int, float)):
            if 4.5 <= self.timer <= 5.5:
                next_idx = (self.current_phase_idx + 1) % len(self.phases)
                next_dir = self.phases[next_idx]
                count = current_counts.get(next_dir, 0)
                self.next_duration = self.calculate_adaptive_time(count)

        # -------------------- SMART SKIP --------------------
        active_dir = self.phases[self.current_phase_idx]
        active_count = current_counts.get(active_dir, 0)

        if self.current_state == "GREEN" and isinstance(self.timer, (int, float)):
            if self.timer > 5 and active_count == 0:
                # No more vehicles, no need to hold green
                self.timer = 0  # Skip straight to Yellow

        # ============================================================
        # STATE TRANSITIONS
        # ============================================================

        # GREEN → YELLOW
        if self.current_state == "GREEN" and isinstance(self.timer, (int, float)):
            if self.timer <= 0:
                self.current_state = "YELLOW"
                self.timer = SAFETY_YELLOW_TIME if self.is_raining else YELLOW_TIME

        # YELLOW → NEXT GREEN
        elif self.current_state == "YELLOW" and isinstance(self.timer, (int, float)):
            if self.timer <= 0:
                next_idx = (self.current_phase_idx + 1) % len(self.phases)
                self.set_phase(next_idx, self.next_duration)

        # ============================================================
        # Predictive violation (car may jump red light)
        # ============================================================
        self._update_predicted_violation(current_counts)

        return self._build_state_response()

    # ============================================================

    def _update_predicted_violation(self, current_counts: dict):
        """Checks if any other lane might attempt to jump during YELLOW."""
        self.predicted_violation_dir = None

        if self.current_state == "YELLOW" and isinstance(self.timer, (int, float)):
            if self.timer <= 3:
                active = self.phases[self.current_phase_idx]

                for d in self.phases:
                    if d != active and current_counts.get(d, 0) >= 3:
                        self.predicted_violation_dir = d
                        break

    # ============================================================
    # Final JSON data sent to UI
    # ============================================================

    def _build_state_response(
        self,
        mode: str = "AUTO",
        state: str | None = None,
        timer: int | str | None = None,
        signal: str | None = None,
    ):
        # If override not given, use current state
        if state is None:
            state = self.current_state

        # Timer: numeric only in normal mode
        if timer is None:
            if isinstance(self.timer, (int, float)):
                timer = max(0, int(self.timer))
            else:
                timer = self.timer

        active = self.phases[self.current_phase_idx]
        next_dir = self.phases[(self.current_phase_idx + 1) % len(self.phases)]

        # Start with all RED
        signal_map = {p: "RED" for p in self.phases}

        # If a forced signal is given (e.g. in ECO → all YELLOW)
        if signal:
            signal_map = {p: signal for p in self.phases}
        else:
            if state != "ECO":
                signal_map[active] = state

        return {
            "active_dir": active,
            "next_dir": next_dir,
            "state": state,
            "timer": timer,
            "mode": mode,
            "status": self.system_status,
            "signal_map": signal_map,
            "predicted_violation_dir": self.predicted_violation_dir,
        }
