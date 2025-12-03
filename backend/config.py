# ============================================
# config.py
# Complete Configuration File
# With Dynamic Camera Detection & Thresholds
# ============================================

import cv2

# --------------------------------------------
# YOLO MODEL CONFIG
# --------------------------------------------

# YOLO model for detection (COCO / custom)
MODEL_NAME = "yolov8n.pt"

# Agar tumne custom ambulance / emergency model train kiya hai
# to unke CLASS IDs yaha par daalo.
# Default COCO me ambulance class nahi hai isliye ye list empty rakhi hai.
EMERGENCY_CLASSES = []  # Example: [111]  (if your model has class id 111 = ambulance)


# --------------------------------------------
# SERVER / TRAFFIC SETUP
# --------------------------------------------

# WebSocket server port (React frontend is connected here)
PORT = 8765

# 4 Traffic directions (fixed order: used in controller & detector)
DIRECTIONS = ["north", "east", "south", "west"]


# --------------------------------------------
# AUTO-DETECT CAMERAS (STARTUP TIME)
# --------------------------------------------
# System will try to open camera indexes 0,1,2,3
# If camera exists → live video
# Otherwise → fallback video will play
# --------------------------------------------

def detect_cameras():
    sources = {}
    # Start from index 1 to skip internal webcam (usually at index 0)
    for i in range(1, 5):  # check 1–4 instead of 0–3
        cap = cv2.VideoCapture(i)
        if cap.isOpened():
            print(f"[CAM] External camera detected at index {i}")
            sources[DIRECTIONS[i-1]] = {"type": "camera", "value": i}
        else:
            print(f"[CAM] No external camera at index {i}, using fallback")
            sources[DIRECTIONS[i-1]] = {
                "type": "video",
                "value": "videos/fallback.mp4",
            }
        cap.release()
    return sources


# AUTO camera detection result (used by main.py)
SOURCES = detect_cameras()

# Fallback video if something fails
FALLBACK_VIDEO = "videos/fallback.mp4"


# --------------------------------------------
# Traffic Light Timing Configuration
# --------------------------------------------

TIME_SLOTS = {
    "low": 30,      # 0–15 vehicles
    "medium": 60,   # 16–25 vehicles
    "high": 90,     # >25 vehicles
}

YELLOW_TIME = 4
SAFETY_YELLOW_TIME = 6  # Used in rain mode (longer yellow for safety)

# (OLD) Red light violation simulation probability
# NOTE: ROI-based violation detection ke baad ye use nahi ho raha,
# but rakh diya future tuning / random test ke liye.
VIOLATION_CHANCE = 0.05


# --------------------------------------------
# YOLO Classes used for detection
# (COCO id → vehicle type name)
# --------------------------------------------

CLASS_MAP = {
    2: "car",
    3: "motorcycle",
    5: "bus",
    7: "truck",
}

VEHICLE_CLASSES = list(CLASS_MAP.keys())

RAIN_CLASS = 25      # Umbrella class for detecting rain (COCO id)
PERSON_CLASS = 0     # Pedestrian (COCO id)


# --------------------------------------------
# Detector Thresholds (centralized)
# --------------------------------------------

# Night detection threshold (brightness in [0..255])
NIGHT_BRIGHTNESS_THRESHOLD = 50  # lower → darker

# Congestion / stalled vehicle logic
STALLED_COUNT_THRESHOLD = 8      # ≥8 vehicles
STALLED_FRAME_LIMIT = 40         # for 40 consecutive frames


# --------------------------------------------
# RED LIGHT VIOLATION ROI RECTANGLES (Option A)
# --------------------------------------------
# Coordinates are based on resized frame: 640 x 480
# Each direction has one rectangular ROI near the stop line.
#
# Format: (x1, y1, x2, y2)
# You can tune these based on your lane position.
# --------------------------------------------

ROI_RECTS = {
    "north": (220, 140, 420, 260),  # top side lane
    "east":  (360, 220, 620, 340),  # right side lane
    "south": (220, 260, 420, 380),  # bottom side lane
    "west":  (20, 220, 280, 340),   # left side lane
}
