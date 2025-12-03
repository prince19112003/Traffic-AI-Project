# ============================================================
# main.py
# ------------------------------------------------------------
# BACKEND SERVER CORE
#
# Features:
# ✔ Stable Live Camera Handling (0–4 cams)
# ✔ Auto Camera Reconnect every 3 sec
# ✔ Manual Reconnect API (/reconnect?dir=north)
# ✔ Safe fallback → fallback.mp4
# ✔ YOLO detection (batch, with error handling)
# ✔ Night mode flag
# ✔ Clean JSON to React via WebSocket
# ✔ No green screen (UI handles empty feed)
# ✔ ROI-based real red-light violation detection (Option A)
# ============================================================

import asyncio
import json
import cv2
import websockets
import time
from aiohttp import web

from config import (
    PORT,
    SOURCES,
    FALLBACK_VIDEO,
    DIRECTIONS,
)
from detector import VehicleDetector
from controller import TrafficController


# ============================================================
# Initialize Detector + Controller + Client Set
# ============================================================

detector = VehicleDetector()
controller = TrafficController()
clients: set[websockets.WebSocketServerProtocol] = set()


# ============================================================
# SAFE Capture Open Function
# ============================================================

def open_capture(cfg: dict):
    """
    Safely opens:
    - Camera index (0,1,2,3…)
    - File path video ("video.mp4")
    If fail → fallback video
    If fallback fail → return None (UI safe)
    """
    src = cfg.get("value", None)

    try:
        # CASE 1 → camera index
        if isinstance(src, int):
            cap = cv2.VideoCapture(src, cv2.CAP_DSHOW)
        else:
            # CASE 2 → video path
            cap = cv2.VideoCapture(src)

        # If fail -> fallback
        if not cap.isOpened():
            print(f"[WARN] Failed: {src}, switching to fallback...")
            cap.release()
            cap = cv2.VideoCapture(FALLBACK_VIDEO)

            if not cap.isOpened():
                print(f"[ERROR] Fallback also failed for {src}. Camera disabled.")
                cap.release()
                return None

        print(f"[OK] Source active:", src)
        return cap

    except Exception as e:
        print(f"[ERROR] Exception while opening capture {src}: {e}")
        return None


# ============================================================
# Prepare 4 camera/video sources
# ============================================================

caps = {d: open_capture(SOURCES[d]) for d in DIRECTIONS}
last_retry_time = {d: 0 for d in DIRECTIONS}


# ============================================================
# WebSocket Handler (Frontend Commands)
# ============================================================

async def ws_handler(websocket):
    clients.add(websocket)
    print("[WS] Client connected")

    try:
        async for message in websocket:
            try:
                data = json.loads(message)
            except json.JSONDecodeError:
                print("[WS] Invalid JSON from client, ignoring.")
                continue

            if "command" in data:
                controller.handle_manual_command(data["command"])

    except Exception as e:
        print("[WS ERROR]", e)

    finally:
        print("[WS] Client disconnected")
        if websocket in clients:
            clients.remove(websocket)


# ============================================================
# Manual Reconnect Endpoint
# ============================================================

async def reconnect_handler(request):
    direction = request.query.get("dir")

    if direction not in DIRECTIONS:
        return web.Response(text="Invalid direction")

    print(f"[RECONNECT] Manual reconnect for: {direction}")

    cfg = SOURCES[direction]
    caps[direction] = open_capture(cfg)
    return web.Response(text="OK")


# ============================================================
# MAIN LOOP — Reads cameras + detection + traffic logic
# ============================================================

async def broadcast_loop():
    global caps, last_retry_time

    last_alert_msg = None

    while True:
        try:
            frames = {}

            # ============================================
            # READ ALL 4 DIRECTIONS
            # ============================================
            for d in DIRECTIONS:
                cap = caps.get(d)

                # If camera unavailable → try reconnect every 3 sec
                if cap is None:
                    now = time.time()
                    if now - last_retry_time[d] > 3:
                        print(f"[AUTO-RETRY] Trying camera reconnect: {d}")
                        caps[d] = open_capture(SOURCES[d])
                        last_retry_time[d] = now

                    frames[d] = None
                    continue

                ret, frame = cap.read()

                # Video loop support for file sources
                if not ret and SOURCES[d]["type"] == "video":
                    cap.set(cv2.CAP_PROP_POS_FRAMES, 0)
                    ret, frame = cap.read()

                # Still failed → disconnect and retry later
                if not ret or frame is None:
                    print(f"[CAM FAIL] {d} → disabling + scheduling reconnect")
                    try:
                        if caps[d] is not None:
                            caps[d].release()
                    except Exception:
                        pass
                    caps[d] = None
                    frames[d] = None
                    continue

                frames[d] = frame

            # ============================================
            # YOLO Detection (safe)
            # ============================================
            try:
                counts, feeds, is_emerg, emerg_loc, analytics, stalled, is_night = \
                    detector.analyze_frames(frames)
            except Exception as e:
                print(f"[DETECTOR ERROR] {e}")
                # On detector failure, send minimal safe payload
                counts = {d: 0 for d in DIRECTIONS}
                counts["rain_trigger"] = 0
                counts["person"] = 0
                counts["roi_vehicles"] = {d: 0 for d in DIRECTIONS}
                feeds = {}
                analytics = {"car": 0, "bike": 0, "bus": 0, "truck": 0}
                stalled = None
                is_night = False
                is_emerg = False
                emerg_loc = None

            # ============================================
            # Traffic Signal Logic
            # ============================================
            try:
                logic_status = controller.update(counts, is_emerg, emerg_loc)
            except Exception as e:
                print(f"[CONTROLLER ERROR] {e}")
                # Fallback logic state if controller blows up
                logic_status = {
                    "active_dir": "north",
                    "next_dir": "east",
                    "state": "RED",
                    "timer": 0,
                    "mode": "AUTO",
                    "status": "Controller Error",
                    "signal_map": {d: "RED" for d in DIRECTIONS},
                    "predicted_violation_dir": None,
                }

            # ============================================
            # Weather Mode
            # ============================================
            weather = "RAIN" if counts.get("rain_trigger") else (
                "NIGHT" if is_night else "CLEAR"
            )

            # ============================================
            # REAL RED LIGHT VIOLATION (ROI-BASED)
            # --------------------------------------------
            # Idea:
            # - Detector gives counts["roi_vehicles"][dir] = vehicles in ROI
            # - If that lane's signal_map[dir] == "RED" and roi_vehicles[dir] > 0
            #   → RED LIGHT VIOLATION
            # - We send full frame snapshot (feeds[dir]) to frontend.
            # ============================================
            violation_event = None
            roi_info = counts.get("roi_vehicles", {}) or {}
            signal_map = logic_status.get("signal_map", {}) or {}

            for d in DIRECTIONS:
                sig = signal_map.get(d, "RED")
                roi_count = roi_info.get(d, 0)

                if sig == "RED" and roi_count > 0:
                    violation_event = {
                        "id": int(time.time() * 1000),
                        "dir": d,
                        "time": time.strftime("%H:%M:%S"),
                        # Full frame snapshot; you can crop ROI in frontend if needed
                        "img": feeds.get(d),
                    }
                    break  # One violation per cycle is enough

            # ============================================
            # ALERT SYSTEM (human readable messages)
            # ============================================
            msg_parts = []

            if stalled:
                msg_parts.append(f"Stalled vehicle at {stalled.upper()}")

            if logic_status.get("predicted_violation_dir"):
                msg_parts.append(
                    f"Possible jump: {logic_status['predicted_violation_dir'].upper()}"
                )

            if weather == "RAIN":
                msg_parts.append("Rain Mode Active")

            if logic_status.get("state") == "EMERGENCY":
                msg_parts.append(
                    f"Emergency vehicle → {logic_status['active_dir'].upper()}"
                )

            if violation_event:
                msg_parts.append(
                    f"RED LIGHT VIOLATION detected at {violation_event['dir'].upper()}"
                )

            alert_event = None
            if msg_parts:
                full_msg = " • ".join(msg_parts)
                if full_msg != last_alert_msg:
                    alert_event = {
                        "id": int(time.time() * 1000),
                        "message": full_msg,
                        "severity": "high",
                    }
                    last_alert_msg = full_msg

            # ============================================
            # FINAL PAYLOAD → React Web App
            # ============================================

            env_info = {
                "obstacle_zone": stalled,
                "is_night": is_night,
                "weather_mode": weather,
            }

            payload = json.dumps({
                "feeds": feeds,
                "counts": counts,
                "logic": logic_status,
                "analytics": analytics,
                "violation": violation_event,
                "alert": alert_event,
                "env": env_info,
            })

            # SAFELY SEND TO ALL CLIENTS
            if clients:
                dead_clients = []
                for client in list(clients):
                    try:
                        await client.send(payload)
                    except Exception as e:
                        print(f"[WS SEND ERROR] {e}")
                        dead_clients.append(client)
                # Remove dead clients
                for dc in dead_clients:
                    if dc in clients:
                        clients.remove(dc)

        except Exception as main_err:
            # Catch any unexpected error in the loop, log and continue
            print(f"[LOOP ERROR] {main_err}")

        # MAIN LOOP DELAY (controls max FPS / CPU usage)
        await asyncio.sleep(0.05)


# ============================================================
# ENTRY POINT
# ============================================================

async def main():
    print(f"🚦 Traffic AI Backend running at ws://localhost:{PORT}")
    print(f"🔁 Reconnect API at http://localhost:{PORT+1}/reconnect?dir=north")

    # HTTP Server for reconnect
    app = web.Application()
    app.router.add_get("/reconnect", reconnect_handler)

    runner = web.AppRunner(app)
    await runner.setup()
    site = web.TCPSite(runner, "0.0.0.0", PORT + 1)
    await site.start()

    # WebSocket Server
    async with websockets.serve(ws_handler, "0.0.0.0", PORT):
        await broadcast_loop()


if __name__ == "__main__":
    try:
        asyncio.run(main())
    except KeyboardInterrupt:
        print("\n[EXIT] Server shutting down...")
