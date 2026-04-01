# ============================================================
# utils/metrics.py
# ------------------------------------------------------------
# PERFORMANCE & RESOURCE MONITORING
# ============================================================

import psutil
import time
import os

def get_system_metrics():
    """
    Returns core hardware metrics.
    Essential for 'optimized resource requirement' monitoring.
    """
    process = psutil.Process(os.getpid())
    return {
        "cpu_usage": psutil.cpu_percent(interval=None),
        "memory_usage_mb": process.memory_info().rss / (1024 * 1024),
        "system_ram_percent": psutil.virtual_memory().percent,
        "active_processes": len(psutil.pids()),
        "uptime": time.time()
    }

def calculate_fps(start_time, frame_count):
    """Calculates smoothed FPS for AI inference visualization."""
    elapsed = time.time() - start_time
    if elapsed == 0: return 0
    return round(frame_count / elapsed, 2)
