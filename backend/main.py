import cv2
import asyncio
import websockets
import json
import base64
import numpy as np
from ultralytics import YOLO

# ---------------- CONFIG ----------------
# Use 'yolov8n.pt' for faster CPU performance, 'yolov8m.pt' for better accuracy (needs GPU)
MODEL_VEHICLE = "yolov8n.pt" 
VIDEO_SOURCE = 0           # 0 for Webcam, or put "video.mp4" path
DETECT_CLASSES = [2, 3, 5, 7] # car, motorcycle, bus, truck
CONF_THRESHOLD = 0.3
WS_PORT = 8765
# -----------------------------------------

print(f"[INFO] Loading YOLO model ({MODEL_VEHICLE})...")
model = YOLO(MODEL_VEHICLE)

# Initialize Camera
cap = cv2.VideoCapture(VIDEO_SOURCE)
if not cap.isOpened():
    print("[ERROR] Cannot open camera/stream.")
    exit()

# Set lower resolution for faster processing if needed
cap.set(cv2.CAP_PROP_FRAME_WIDTH, 640)
cap.set(cv2.CAP_PROP_FRAME_HEIGHT, 480)

# Global sets
clients = set()

# ---------------- LOGIC ----------------
def process_frame(frame):
    H, W = frame.shape[:2]
    
    # Zones (Simple Quadrants for demo)
    # You can customize these ranges based on your camera angle
    zones = {
        "north": {"y_max": H//2, "x_min": W//3, "x_max": 2*W//3},
        "south": {"y_min": H//2, "x_min": W//3, "x_max": 2*W//3},
        "west":  {"x_max": W//2, "y_min": H//3, "y_max": 2*H//3},
        "east":  {"x_min": W//2, "y_min": H//3, "y_max": 2*H//3}
    }
    
    counts = { "north": 0, "east": 0, "south": 0, "west": 0 }
    
    # Run YOLO Inference
    results = model(frame, verbose=False)
    
    # Get the annotated frame (boxes drawn) directly from YOLO
    annotated_frame = results[0].plot()

    # Count vehicles in zones
    for box, cls, conf in zip(results[0].boxes.xyxy, results[0].boxes.cls, results[0].boxes.conf):
        if int(cls) not in DETECT_CLASSES or conf < CONF_THRESHOLD:
            continue
            
        x1, y1, x2, y2 = map(int, box.tolist())
        cx, cy = (x1 + x2) // 2, (y1 + y2) // 2
        
        # Check which zone the center point falls into
        if (zones["north"]["x_min"] < cx < zones["north"]["x_max"]) and (cy < zones["north"]["y_max"]):
            counts["north"] += 1
        elif (zones["south"]["x_min"] < cx < zones["south"]["x_max"]) and (cy > zones["south"]["y_min"]):
            counts["south"] += 1
        elif (cx < zones["west"]["x_max"]) and (zones["west"]["y_min"] < cy < zones["west"]["y_max"]):
            counts["west"] += 1
        elif (cx > zones["east"]["x_min"]) and (zones["east"]["y_min"] < cy < zones["east"]["y_max"]):
            counts["east"] += 1

    # Draw zone lines on the annotated frame for visual reference
    cv2.line(annotated_frame, (W//3, 0), (W//3, H), (255, 0, 0), 1)
    cv2.line(annotated_frame, (2*W//3, 0), (2*W//3, H), (255, 0, 0), 1)
    cv2.line(annotated_frame, (0, H//3), (W, H//3), (255, 0, 0), 1)
    cv2.line(annotated_frame, (0, 2*H//3), (W, 2*H//3), (255, 0, 0), 1)

    return counts, annotated_frame

# ---------------- WEBSOCKET HANDLER ----------------
async def ws_handler(websocket):
    clients.add(websocket)
    print(f"[WS] Client connected. Total: {len(clients)}")
    try:
        async for message in websocket:
            # Handle incoming commands from React (optional)
            data = json.loads(message)
            if data.get('command') == 'reset':
                print("[CMD] Reset triggered")
    except:
        pass
    finally:
        clients.remove(websocket)
        print("[WS] Client disconnected")

# ---------------- BROADCAST LOOP ----------------
async def broadcast_loop():
    while True:
        ret, frame = cap.read()
        if not ret:
            # Loop video if it ends (for video files)
            cap.set(cv2.CAP_PROP_POS_FRAMES, 0)
            await asyncio.sleep(0.1)
            continue

        # 1. Process Logic
        counts, visual_frame = process_frame(frame)

        # 2. Encode Image to JPEG -> Base64
        _, buffer = cv2.imencode('.jpg', visual_frame, [cv2.IMWRITE_JPEG_QUALITY, 60])
        jpg_as_text = base64.b64encode(buffer).decode('utf-8')

        # 3. Prepare Payload
        payload = json.dumps({
            "type": "telemetry",
            "counts": counts,
            "image": jpg_as_text
        })

        # 4. Broadcast to all connected clients
        if clients:
            # asyncio.wait requires a list of tasks
            tasks = [asyncio.create_task(client.send(payload)) for client in clients]
            if tasks:
                await asyncio.wait(tasks)

        # Control Framerate (approx 15-20 FPS to save bandwidth)
        await asyncio.sleep(0.05)

# ---------------- MAIN ENTRY ----------------
async def main():
    # Start WebSocket Server
    server = await websockets.serve(ws_handler, "0.0.0.0", WS_PORT)
    print(f"[SYSTEM] Server started on ws://localhost:{WS_PORT}")
    
    # Run the broadcast loop concurrently
    await broadcast_loop()

if __name__ == "__main__":
    try:
        asyncio.run(main())
    except KeyboardInterrupt:
        print("Stopping...")
        cap.release()