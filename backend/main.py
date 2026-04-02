print("[DEBUG] Loading main.py...")
import asyncio
import json
import sys
import os
print("[DEBUG] main.py entry point reached...")
import multiprocessing as mp
from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware

from config import PORT, DIRECTIONS, CONFIG_PATH
from engine import TrafficEngine
from controller import TrafficController
from utils.metrics import get_system_metrics
from utils.arduino_serial import ArduinoSerial

app = FastAPI(title="TrafficGuard Enterprise", version="2.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- Global State ---
active_connections = []
latest_data = {}
controller = TrafficController()
# Connect to Arduino (default COM3, set to False if no hardware)
arduino = ArduinoSerial(port="COM3", enabled=True) 
results_queue = None
config_queue = None
engine_proc = None

@app.on_event("startup")
async def startup_event():
    # The queues/process should be initialized in the main block for Windows
    # We just start the broadcast task here
    asyncio.create_task(broadcast_task())

async def broadcast_task():
    global latest_data
    while True:
        if results_queue:
            try:
                data = results_queue.get_nowait()
                logic_status = controller.update(
                    data["counts"], 
                    data["is_emerg"], 
                    data["emerg_loc"]
                )
                payload = {
                    **data,
                    "logic": logic_status,
                    "system": get_system_metrics(),
                    "status": "System Optimized (CPU)"
                }
                latest_data = payload
                
                # Send to Arduino Hardware
                if arduino:
                    arduino.send_signals(logic_status.get("signal_map", {}))
                
                if active_connections:
                    json_payload = json.dumps(payload)
                    for ws in active_connections:
                        try: await ws.send_text(json_payload)
                        except: active_connections.remove(ws)
            except: pass
        await asyncio.sleep(0.02)

@app.get("/get-config")
def get_config():
    if not os.path.exists(CONFIG_PATH): return {"error": "No config"}
    with open(CONFIG_PATH, "r") as f: return json.load(f)

@app.post("/update-config")
async def update_config(new_config: dict):
    with open(CONFIG_PATH, "w") as f: json.dump(new_config, f, indent=2)
    if config_queue: config_queue.put(new_config)
    return {"status": "success"}

@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    await websocket.accept()
    active_connections.append(websocket)
    try:
        while True:
            msg = await websocket.receive_text()
            cmd = json.loads(msg)
            if "command" in cmd:
                controller.handle_manual_command(cmd["command"])
    except WebSocketDisconnect:
        if websocket in active_connections:
            active_connections.remove(websocket)

if __name__ == "__main__":
    import uvicorn
    print("[DEBUG] Main block reached. Starting Uvicorn...")
    # Windows Multiprocessing Protection
    mp.freeze_support()
    try:
        mp.set_start_method("spawn", force=True)
    except RuntimeError: pass
    
    results_queue = mp.Queue(maxsize=5)
    config_queue = mp.Queue()
    engine_proc = TrafficEngine(results_queue, config_queue)
    
    print(f"[SERVER] Starting AI Engine on {mp.get_start_method()} method...")
    engine_proc.start()
    
    try:
        uvicorn.run(app, host="0.0.0.0", port=PORT)
    finally:
        engine_proc.terminate()
