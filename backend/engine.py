# ============================================================
# engine.py
# ------------------------------------------------------------
# CORE AI ENGINE (MULTIPROCESS)
#
# Performance Optimizations:
# ✔ ONNX Runtime (CPU Accelerated)
# ✔ Multiprocessing (Avoids GIL)
# ✔ Frame Skipping & Batching
# ✔ Shared Memory / Queue results
# ============================================================

import cv2
import time
import numpy as np
import multiprocessing as mp
from ultralytics import YOLO
import onnxruntime as ort
import os

from config import (
    SOURCES, DIRECTIONS, MODEL_NAME, 
    VEHICLE_CLASSES, CLASS_MAP, ROI_RECTS,
    CONFIDENCE_THRESHOLD, NIGHT_BRIGHTNESS_THRESHOLD
)

class TrafficEngine(mp.Process):
    """
    TrafficEngine runs in a SEPARATE process.
    It continuously reads cameras and performs AI inference.
    Results are pushed to an output_queue.
    """
    def __init__(self, output_queue, config_queue):
        super().__init__()
        self.output_queue = output_queue
        self.config_queue = config_queue
        self.running = True
        
    def run(self):
        # Local import to prevent pickling issues on Windows
        from ultralytics import YOLO
        import os
        
        print("[ENGINE] Initializing Multiprocess AI Engine...")
        self.model = YOLO(MODEL_NAME, task="detect")
        print(f"[ENGINE] YOLO PyTorch Loaded successfully.")

        # 2. Open Captures
        self.caps = {}
        for d in DIRECTIONS:
            src = SOURCES[d]["value"]
            cap = cv2.VideoCapture(src)
            if not cap.isOpened():
                from config import FALLBACK_VIDEO
                cap = cv2.VideoCapture(FALLBACK_VIDEO)
            self.caps[d] = cap

        print("[ENGINE] All camera sources active.")

        # 3. Main Loop
        while self.running:
            # Check for config updates
            if not self.config_queue.empty():
                new_cfg = self.config_queue.get()
                if "sim_emerg" in new_cfg:
                    self.sim_emerg_active = new_cfg["sim_emerg"]
                    self.sim_emerg_dir = new_cfg.get("sim_emerg_dir", "north")
                pass

            start_time = time.time()
            frames = []
            valid_dirs = []
            
            # Read all directions
            for d in DIRECTIONS:
                ret, frame = self.caps[d].read()
                if not ret:
                    self.caps[d].set(cv2.CAP_PROP_POS_FRAMES, 0) # Loop video
                    ret, frame = self.caps[d].read()
                
                if ret:
                    frame = cv2.resize(frame, (640, 480))
                    frames.append(frame)
                    valid_dirs.append(d)

            if not frames:
                time.sleep(0.01)
                continue

            # BATCH INFERENCE
            results = self.model(frames, conf=CONFIDENCE_THRESHOLD, verbose=False)
            
            output_payload = {
                "counts": {d: 0 for d in DIRECTIONS},
                "feeds": {},
                "is_emerg": self.sim_emerg_active if hasattr(self, 'sim_emerg_active') else False,
                "emerg_loc": self.sim_emerg_dir if hasattr(self, 'sim_emerg_dir') else None,
                "analytics": {"car": 0, "bike": 0, "bus": 0, "truck": 0},
                "is_night": False,
                "timestamp": time.time()
            }

            for idx, res in enumerate(results):
                d = valid_dirs[idx]
                frame = frames[idx]
                
                # Night check
                hsv = cv2.cvtColor(frame, cv2.COLOR_BGR2HSV)
                avg_b = np.mean(hsv[:, :, 2])
                if avg_b < NIGHT_BRIGHTNESS_THRESHOLD:
                    output_payload["is_night"] = True

                # Process boxes
                v_count = 0
                for box in res.boxes:
                    cls = int(box.cls[0])
                    if cls in VEHICLE_CLASSES:
                        v_count += 1
                        v_type = CLASS_MAP[cls].replace("motorcycle", "bike")
                        if v_type in output_payload["analytics"]:
                            output_payload["analytics"][v_type] += 1
                
                output_payload["counts"][d] = v_count
                
                # Base64 Encode (optimized quality)
                _, buffer = cv2.imencode(".jpg", frame, [cv2.IMWRITE_JPEG_QUALITY, 60])
                import base64
                output_payload["feeds"][d] = base64.b64encode(buffer).decode("utf-8")

            # Push to queue (overwrite if full to ensure low latency)
            if self.output_queue.full():
                try: self.output_queue.get_nowait()
                except: pass
            
            self.output_queue.put(output_payload)
            
            # Control Engine FPS
            elapsed = time.time() - start_time
            sleep_time = max(0, 0.05 - elapsed) # Target 20 FPS
            time.sleep(sleep_time)

    def stop(self):
        self.running = False
        for cap in self.caps.values():
            cap.release()
