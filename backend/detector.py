import cv2
import base64
import numpy as np
from ultralytics import YOLO
from config import MODEL_NAME, VEHICLE_CLASSES, CLASS_MAP, EMERGENCY_CLASS, OBSTACLE_CLASS, RAIN_CLASS, PERSON_CLASS

class VehicleDetector:
    def __init__(self):
        print(f"[INFO] Loading AI Model: {MODEL_NAME}...")
        self.model = YOLO(MODEL_NAME)

    def analyze_frame(self, frame):
        # Resize
        frame = cv2.resize(frame, (640, 480))
        H, W = frame.shape[:2]
        mid_x, mid_y = W // 2, H // 2
        
        # Zones
        zones = {
            "north": (0, 0, mid_x, mid_y), 
            "east":  (mid_x, 0, W, mid_y),
            "south": (mid_x, mid_y, W, H), 
            "west":  (0, mid_y, mid_x, H)
        }
        
        # Night Mode Check (Fixed JSON Error)
        hsv = cv2.cvtColor(frame, cv2.COLOR_BGR2HSV)
        brightness = np.mean(hsv[:, :, 2])
        # FIX: Convert numpy.bool_ to python bool using bool()
        is_night = bool(brightness < 50) 
        
        # Initialize Counts
        counts = {k: 0 for k in zones}
        counts['rain_trigger'] = 0 
        counts['person'] = 0
        
        analytics = {'car': 0, 'bike': 0, 'bus': 0, 'truck': 0}
        crops_base64 = {}
        
        # AI Inference
        results = self.model(frame, verbose=False, conf=0.35)
        boxes = results[0].boxes
        annotated_frame = results[0].plot()

        emergency_detected = False
        emergency_zone = None
        obstacle_zone = None 
        
        for box, cls in zip(boxes.xyxy, boxes.cls):
            class_id = int(cls)
            x1, y1, x2, y2 = map(int, box)
            cx, cy = (x1+x2)//2, (y1+y2)//2
            
            # Find Zone
            zone_name = ""
            if cx < mid_x and cy < mid_y: zone_name = "north"
            elif cx > mid_x and cy < mid_y: zone_name = "east"
            elif cx > mid_x and cy > mid_y: zone_name = "south"
            elif cx < mid_x and cy > mid_y: zone_name = "west"

            # 1. Vehicles
            if class_id in VEHICLE_CLASSES:
                counts[zone_name] += 1
                v_type = CLASS_MAP.get(class_id)
                if v_type == 'motorcycle': v_type = 'bike'
                if v_type in analytics: analytics[v_type] += 1
                
            # 2. Emergency (If enabled)
            elif EMERGENCY_CLASS is not None and class_id == EMERGENCY_CLASS: 
                emergency_detected = True
                emergency_zone = zone_name
                cv2.rectangle(annotated_frame, (x1, y1), (x2, y2), (0, 0, 255), 3)
                cv2.putText(annotated_frame, "EMERGENCY", (x1, y1-10), cv2.FONT_HERSHEY_SIMPLEX, 0.6, (0,0,255), 2)
            
            # 3. Obstacle (If enabled)
            elif OBSTACLE_CLASS is not None and class_id == OBSTACLE_CLASS:
                obstacle_zone = zone_name
                cv2.rectangle(annotated_frame, (x1, y1), (x2, y2), (0, 255, 255), 3)
                cv2.putText(annotated_frame, "OBSTACLE", (x1, y1-10), cv2.FONT_HERSHEY_SIMPLEX, 0.6, (0,255,255), 2)
            
            # 4. Rain (Umbrella)
            elif class_id == RAIN_CLASS:
                counts['rain_trigger'] = 1
                cv2.rectangle(annotated_frame, (x1, y1), (x2, y2), (255, 0, 0), 2)
            
            # 5. Pedestrian (Person)
            elif class_id == PERSON_CLASS:
                counts['person'] += 1

        # Crop Images
        for direction, (x1, y1, x2, y2) in zones.items():
            crop = annotated_frame[y1:y2, x1:x2]
            color = (200, 200, 200) if is_night else (255, 255, 255)
            cv2.putText(crop, f"{direction.upper()}", (10, 25), cv2.FONT_HERSHEY_SIMPLEX, 0.6, color, 1)
            _, buffer = cv2.imencode('.jpg', crop, [cv2.IMWRITE_JPEG_QUALITY, 60])
            crops_base64[direction] = base64.b64encode(buffer).decode('utf-8')

        return counts, crops_base64, emergency_detected, emergency_zone, analytics, obstacle_zone, is_night