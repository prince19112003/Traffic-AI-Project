import cv2
import asyncio
import websockets
import json
import time
import random
from config import PORT, VIDEO_SOURCE, VIOLATION_CHANCE
from detector import VehicleDetector
from controller import TrafficController

detector = VehicleDetector()
controller = TrafficController()
clients = set()

async def ws_handler(websocket):
    clients.add(websocket)
    try:
        async for message in websocket:
            try:
                data = json.loads(message)
                if 'command' in data: controller.handle_manual_command(data['command'])
            except: pass
    except: pass
    finally: clients.remove(websocket)

async def broadcast_loop():
    cap = cv2.VideoCapture(VIDEO_SOURCE)
    
    while True:
        ret, frame = cap.read()
        if not ret:
            cap.set(cv2.CAP_PROP_POS_FRAMES, 0)
            continue
            
        # Analysis
        current_counts, vehicle_feeds, is_em, em_zone, analytics_data, obs_zone, is_night = detector.analyze_frame(frame)
        logic_status = controller.update(current_counts, is_em, em_zone)
        
        # Violation Sim (Auto Mode Only)
        violation_event = None
        if logic_status.get('mode') == 'AUTO':
            active_dir = logic_status['active_dir']
            if active_dir in current_counts: # Check if valid direction
                for direction, count in current_counts.items():
                    if direction in ['north','south','east','west'] and direction != active_dir and count > 0:
                        if random.random() < VIOLATION_CHANCE:
                            violation_event = {
                                "id": int(time.time() * 1000), "dir": direction,
                                "time": time.strftime("%H:%M:%S"), "img": vehicle_feeds[direction]
                            }
                            break 

        payload = json.dumps({
            "feeds": vehicle_feeds,
            "counts": current_counts,
            "logic": logic_status,
            "analytics": analytics_data,
            "violation": violation_event,
            "env": { "obstacle_zone": obs_zone, "is_night": is_night }
        })
        
        if clients:
            tasks = [asyncio.create_task(client.send(payload)) for client in clients]
            if tasks: await asyncio.wait(tasks)
        await asyncio.sleep(0.05) 

async def main():
    print(f"✅ Final Smart Traffic System running on Port {PORT}")
    async with websockets.serve(ws_handler, "0.0.0.0", PORT):
        await broadcast_loop()

if __name__ == "__main__":
    try: asyncio.run(main())
    except KeyboardInterrupt: pass
