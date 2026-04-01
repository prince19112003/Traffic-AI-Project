# ============================================
# config.py
# Complete Configuration File
# With Dynamic Camera Detection & Thresholds
# ============================================

import cv2
import json
import os

# Path to the dynamic configuration file
CONFIG_PATH = os.path.join(os.path.dirname(__file__), "config", "system_settings.json")

def load_settings():
    """Load settings from JSON, with hardcoded fallbacks."""
    default_settings = {
        "MODEL_NAME": "yolov8n.pt",
        "TIME_SLOTS": {"low": 30, "medium": 60, "high": 90},
        "YELLOW_TIME": 4,
        "SAFETY_YELLOW_TIME": 6,
        "NIGHT_BRIGHTNESS_THRESHOLD": 50,
        "STALLED_COUNT_THRESHOLD": 8,
        "STALLED_FRAME_LIMIT": 40,
        "ROI_RECTS": {
            "north": [220, 140, 420, 260],
            "east": [360, 220, 620, 340],
            "south": [220, 260, 420, 380],
            "west": [20, 220, 280, 340],
        },
        "EMERGENCY_CLASSES": [],
        "CONFIDENCE_THRESHOLD": 0.35,
    }

    if os.path.exists(CONFIG_PATH):
        try:
            with open(CONFIG_PATH, "r") as f:
                saved = json.load(f)
                default_settings.update(saved)
        except Exception as e:
            print(f"[CONFIG ERROR] Could not read JSON: {e}")
    
    return default_settings

# Load current settings
settings = load_settings()

# --------------------------------------------
# YOLO MODEL CONFIG
# --------------------------------------------
MODEL_NAME = settings["MODEL_NAME"]
EMERGENCY_CLASSES = settings["EMERGENCY_CLASSES"]
CONFIDENCE_THRESHOLD = settings["CONFIDENCE_THRESHOLD"]

# --------------------------------------------
# SERVER / TRAFFIC SETUP
# --------------------------------------------
PORT = 8765
DIRECTIONS = ["north", "east", "south", "west"]

# --------------------------------------------
# AUTO-DETECT CAMERAS
# --------------------------------------------
def detect_cameras():
    sources = {}
    for i in range(1, 5):
        cap = cv2.VideoCapture(i)
        if cap.isOpened():
            print(f"[CAM] External camera detected at index {i}")
            sources[DIRECTIONS[i-1]] = {"type": "camera", "value": i}
        else:
            sources[DIRECTIONS[i-1]] = {
                "type": "video",
                "value": "videos/fallback.mp4",
            }
        cap.release()
    return sources

SOURCES = detect_cameras()
FALLBACK_VIDEO = "videos/fallback.mp4"

# --------------------------------------------
# Traffic Light Timing Configuration
# --------------------------------------------
TIME_SLOTS = settings["TIME_SLOTS"]
YELLOW_TIME = settings["YELLOW_TIME"]
SAFETY_YELLOW_TIME = settings["SAFETY_YELLOW_TIME"]

# --------------------------------------------
# YOLO Classes used for detection
# --------------------------------------------
CLASS_MAP = {
    2: "car",
    3: "motorcycle",
    5: "bus",
    7: "truck",
}
VEHICLE_CLASSES = list(CLASS_MAP.keys())
RAIN_CLASS = 25
PERSON_CLASS = 0

# --------------------------------------------
# Detector Thresholds
# --------------------------------------------
NIGHT_BRIGHTNESS_THRESHOLD = settings["NIGHT_BRIGHTNESS_THRESHOLD"]
STALLED_COUNT_THRESHOLD = settings["STALLED_COUNT_THRESHOLD"]
STALLED_FRAME_LIMIT = settings["STALLED_FRAME_LIMIT"]

# --------------------------------------------
# RED LIGHT VIOLATION ROI RECTANGLES
# --------------------------------------------
ROI_RECTS = settings["ROI_RECTS"]
