# --- CONFIGURATION ---

# Agar custom Ambulance model hai to uska naam yaha likho, nahi to 'yolov8n.pt'
MODEL_NAME = "yolov8n.pt" 

PORT = 8765
VIDEO_SOURCE = 0  # Webcam (0) ya Video File path

# Class IDs (COCO Dataset)
# Ye vehicles hum count karenge
CLASS_MAP = { 
    2: 'car', 
    3: 'motorcycle', 
    5: 'bus', 
    7: 'truck' 
}
VEHICLE_CLASSES = list(CLASS_MAP.keys())

# --- TRIGGERS ---
# 1. RAIN MODE: Detect 'Umbrella' (ID 25)
RAIN_CLASS = 25 

# 2. PEDESTRIAN SAFETY: Detect 'Person' (ID 0)
PERSON_CLASS = 0

# 3. EMERGENCY VEHICLE
# Agar Custom Model nahi hai to ise None rakho (Fake detection se bachne ke liye)
EMERGENCY_CLASS = None 

# 4. OBSTACLE
# Ise bhi None rakho real-world logic ke liye
OBSTACLE_CLASS = None

# Traffic Timing (Seconds)
TIME_SLOTS = {'low': 15, 'medium': 30, 'high': 45, 'jam': 60}
YELLOW_TIME = 4 
VIOLATION_CHANCE = 0.05
