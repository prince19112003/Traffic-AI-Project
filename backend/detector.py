# ============================================================
# detector.py
# ------------------------------------------------------------
# Handles:
#  - YOLO object detection (BATCH mode for performance)
#  - Vehicle counting per direction
#  - Rain (umbrella) detection
#  - Pedestrian detection
#  - Night mode detection + enhancement
#  - Stalled vehicle detection
#  - RED LIGHT VIOLATION: ROI-based vehicle presence per lane
#  - Returns clean base64 frames (NO YOLO boxes, NO motion blur)
#  - Basic error handling (YOLO failure won't crash loop)
# ============================================================

import base64
import cv2
import numpy as np
from ultralytics import YOLO

from config import (
    MODEL_NAME,
    VEHICLE_CLASSES,
    CLASS_MAP,
    RAIN_CLASS,
    PERSON_CLASS,
    DIRECTIONS,
    EMERGENCY_CLASSES,
    NIGHT_BRIGHTNESS_THRESHOLD,
    STALLED_COUNT_THRESHOLD,
    STALLED_FRAME_LIMIT,
    ROI_RECTS,
)


class VehicleDetector:
    """
    VehicleDetector
    ---------------
    Central AI detection engine.

    OUTPUT:
    - counts: dict
        {
          'north': int,
          'east': int,
          'south': int,
          'west': int,
          'rain_trigger': 0/1,
          'person': int,
          'roi_vehicles': { 'north': int, ... }  # vehicles in ROI (for violation)
        }
    - feeds: dict[dir] = base64 JPEG frame
    - emergency_detected: bool
    - emergency_zone: direction or None
    - analytics: dict of cumulative vehicle counts by type
    - stalled_zone: direction where congestion persists (or None)
    - global_is_night: bool
    """

    def __init__(self):
        print(f"[INFO] Loading YOLO model: {MODEL_NAME}")
        self.model = YOLO(MODEL_NAME)

        # Try to move model to GPU if available (safe try)
        try:
            self.model.to("cuda")
            print("[INFO] YOLO moved to CUDA (GPU).")
        except Exception:
            print("[INFO] CUDA not available, using CPU.")

        # Congestion counter per direction
        self.congest_counter = {d: 0 for d in DIRECTIONS}

        # Previous frames per direction (hook if later smoothing is required)
        self.prev_frames = {d: None for d in DIRECTIONS}

        # CLAHE object for night enhancement (contrast in dark scenes)
        self.clahe = cv2.createCLAHE(clipLimit=2.0, tileGridSize=(8, 8))

    # ------------------------------------------------------------
    # Utility: encode frame → base64
    # ------------------------------------------------------------

    def _encode_frame_to_base64(self, frame):
        """
        Converts OpenCV frame → JPEG → Base64.
        Sent to frontend for live feed display.
        Better JPEG quality to reduce artifacts.
        """
        _, buffer = cv2.imencode(".jpg", frame, [cv2.IMWRITE_JPEG_QUALITY, 75])
        return base64.b64encode(buffer).decode("utf-8")

    # ------------------------------------------------------------
    # Utility: basic night enhancement (brightness/contrast + CLAHE)
    # ------------------------------------------------------------

    def _enhance_night(self, frame):
        """
        Enhance dark frames:
        - CLAHE on luminance channel
        - Slight brightness/contrast boost
        NOTE:
        - NO blur/denoise here (to avoid motion softness).
        """
        # Convert to YCrCb to work on Luma (Y) channel
        ycrcb = cv2.cvtColor(frame, cv2.COLOR_BGR2YCrCb)
        y, cr, cb = cv2.split(ycrcb)

        # CLAHE on brightness
        y = self.clahe.apply(y)

        # Merge back
        ycrcb = cv2.merge([y, cr, cb])
        enhanced = cv2.cvtColor(ycrcb, cv2.COLOR_YCrCb2BGR)

        # Slight brightness/contrast tweak
        enhanced = cv2.convertScaleAbs(enhanced, alpha=1.1, beta=10)

        return enhanced

    # ------------------------------------------------------------
    # Utility: stabilizer (currently no blending → no motion blur)
    # ------------------------------------------------------------

    def _stabilize(self, direction, frame):
        """
        Currently just returns frame as-is. Kept for future smoothing logic.
        """
        self.prev_frames[direction] = frame
        return frame

    # ------------------------------------------------------------
    # Simple helper: check if point inside ROI rectangle
    # ------------------------------------------------------------

    @staticmethod
    def _point_in_rect(x, y, rect):
        x1, y1, x2, y2 = rect
        return x1 <= x <= x2 and y1 <= y <= y2

    # ------------------------------------------------------------
    # MAIN detection API
    # ------------------------------------------------------------

    def analyze_frames(self, frames_by_dir: dict):
        """
        Runs once per broadcast loop.

        INPUT:
            frames_by_dir = {
                'north': frame_or_None,
                'east' : ...,
                'south': ...,
                'west' : ...,
            }

        OUTPUT:
            counts, feeds_base64, emergency_detected, emergency_zone,
            analytics, stalled_zone, global_is_night
        """

        # Basic Output init
        counts = {d: 0 for d in DIRECTIONS}
        counts["rain_trigger"] = 0       # Umbrella detection flag
        counts["person"] = 0             # Pedestrian count

        # ROI-based vehicle count per direction (for violation detection)
        roi_vehicles = {d: 0 for d in DIRECTIONS}

        feeds_base64 = {}
        analytics = {"car": 0, "bike": 0, "bus": 0, "truck": 0}

        stalled_zone = None
        global_is_night = False

        # Emergency detection flags
        emergency_detected = False
        emergency_zone = None

        # For batch inference
        batch_frames = []        # list of processed (resized + night-enhanced) frames
        batch_dirs = []          # mapping index → direction
        processed_map = {}       # direction -> processed_frame (for encoding later)

        # =========================================================
        # Preprocess frames: resize + night check + enhancement
        # =========================================================

        for direction in DIRECTIONS:
            frame = frames_by_dir.get(direction)

            if frame is None:
                # No frame: no detection; reset previous
                self.prev_frames[direction] = None
                continue

            # Resize for consistent YOLO performance
            try:
                frame = cv2.resize(frame, (640, 480))
            except Exception:
                # If something wrong with frame, skip this direction safely
                self.prev_frames[direction] = None
                continue

            # NIGHT MODE DETECTION (Brightness check)
            hsv = cv2.cvtColor(frame, cv2.COLOR_BGR2HSV)
            brightness = np.mean(hsv[:, :, 2])

            processed_frame = frame

            if brightness < NIGHT_BRIGHTNESS_THRESHOLD:
                global_is_night = True
                processed_frame = self._enhance_night(frame)

            # Store processed frame for later
            processed_map[direction] = processed_frame
            batch_frames.append(processed_frame)
            batch_dirs.append(direction)

        # =========================================================
        # YOLO DETECTION (BATCH on all valid frames)
        # =========================================================

        results_list = [None] * len(batch_frames)

        if batch_frames:
            try:
                # YOLO supports list/ndarray → returns list-like results
                results = self.model(batch_frames, conf=0.35, verbose=False)
                for idx, res in enumerate(results):
                    results_list[idx] = res
            except Exception as e:
                print(f"[YOLO ERROR] Detection skipped this cycle: {e}")
                # On YOLO failure, results_list stays None and we skip detection

        # =========================================================
        # Process each direction with its YOLO result
        # =========================================================

        for dir_idx, direction in enumerate(batch_dirs):
            processed_frame = processed_map[direction]
            res = results_list[dir_idx]

            vehicle_count = 0

            if res is not None:
                try:
                    boxes = res.boxes
                except Exception:
                    boxes = None

                if boxes is not None:
                    # Process each detected box
                    for box, cls in zip(boxes.xyxy, boxes.cls):
                        class_id = int(cls)
                        x1, y1, x2, y2 = map(float, box[:4])
                        cx = (x1 + x2) / 2.0
                        cy = (y1 + y2) / 2.0

                        # VEHICLE DETECTION
                        if class_id in VEHICLE_CLASSES:
                            vehicle_count += 1

                            v_type = CLASS_MAP[class_id]
                            if v_type == "motorcycle":
                                v_type = "bike"
                            if v_type in analytics:
                                analytics[v_type] += 1

                            # ROI-BASED RED-LIGHT VIOLATION COUNTER
                            rect = ROI_RECTS.get(direction)
                            if rect and self._point_in_rect(cx, cy, rect):
                                roi_vehicles[direction] += 1

                        # RAIN DETECTION
                        elif class_id == RAIN_CLASS:
                            counts["rain_trigger"] = 1

                        # PEDESTRIAN DETECTION
                        elif class_id == PERSON_CLASS:
                            counts["person"] += 1

                        # EMERGENCY VEHICLE (if custom classes configured)
                        if (not emergency_detected) and EMERGENCY_CLASSES:
                            if class_id in EMERGENCY_CLASSES:
                                emergency_detected = True
                                emergency_zone = direction

            # Store count for this direction
            counts[direction] = vehicle_count

            # STALLED VEHICLE (CONGESTION) LOGIC
            if vehicle_count >= STALLED_COUNT_THRESHOLD:
                self.congest_counter[direction] += 1
            else:
                self.congest_counter[direction] = 0

            if self.congest_counter[direction] >= STALLED_FRAME_LIMIT:
                stalled_zone = direction

            # IMAGE (NO BLUR) + ENCODING
            stable_frame = self._stabilize(direction, processed_frame)
            feeds_base64[direction] = self._encode_frame_to_base64(stable_frame)

        # Put ROI info inside counts (so main.py can access, controller ignore)
        counts["roi_vehicles"] = roi_vehicles

        # =========================================================
        # RETURN ALL ANALYTICS + FLAGS
        # =========================================================

        return (
            counts,
            feeds_base64,
            emergency_detected,
            emergency_zone,
            analytics,
            stalled_zone,
            global_is_night,
        )
