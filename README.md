# 🚥 TrafficGuard Ultra: Enterprise AI Traffic Management

**TrafficGuard Ultra** is a high-performance, real-time traffic management system leveraging Computer Vision (YOLOv8) and asynchronous backend architecture to optimize urban traffic flow. It features a dual-process engine, persistent SQLite storage, and a modern Next.js dashboard.

---

## 📂 Project Architecture & Folder Structure

### 1. `backend/` (The Core Engine)
The backend is built with **FastAPI** and utilizes a multiprocess architecture to ensure zero-lag inference.
- **`main.py`**: The entry point. Handles FastAPI initialization, WebSocket broadcasting, and manages the lifecycle of the AI process.
- **`engine.py`**: A dedicated **Multiprocess AI Engine**. It reads camera feeds, runs YOLOv8 (ONNX-optimized) inference, and pushes data to a synchronized queue.
- **`detector.py`**: Contains the logic for vehicle counting, emergency vehicle detection, night-mode enhancement, and ROI-based violation tracking.
- **`controller.py`**: Implements the **Weighted Priority Logic**. It calculates signal timing based on vehicle density, wait times, and emergency status.
- **`database.py`**: SQLAlchemy-based SQLite layer for logging violations, analytics, and storing system configurations.
- **`config/`**: Contains `system_settings.json` for dynamic runtime configuration.
- **`utils/metrics.py`**: Monitors system health (CPU/RAM usage) in real-time.

### 2. `frontend-next/` (The Enterprise Dashboard)
A professional-grade interface built with **Next.js 14** and **TailwindCSS**.
- **`app/page.jsx`**: Reactive dashboard entry point.
- **`store/trafficStore.js`**: **Zustand** state management for high-frequency synchronization with the backend.
- **`components/`**: Modular React components (TrafficGrid, Sidebar, AdminPanel, etc.) optimized for real-time video overlays.

### 3. `frontend-old/` (Legacy Backup)
A backup of the original Vite-based React implementation for reference and safe-keeping.

---

## ⚙️ How It Works

1. **Capture & Preprocess**: The `TrafficEngine` (separate process) pulls frames from 4 directions simultaneously. It applies CLAHE enhancement if night mode is detected.
2. **AI Inference**: Frames are batched and passed through a YOLOv8 model (converted to **ONNX** for 3x–5x CPU speed improvement).
3. **Logic Decision**: The `TrafficController` receives counts and wait times. It uses a weighted algorithm to decide the next green phase: 
   `Priority = (Vehicle Count * 2.5) + (Wait Time / 8.0)`.
4. **Broadcast**: The `FastAPI` server reads the engine's output and broadcasts JSON packets to all connected Web interfaces via WebSockets.
5. **Persistence**: Important events like Red-Light Violations and daily volume metrics are saved into `traffic_guard.db`.

---

## ✨ Why It’s Better (Competitive Advantages)

- **Multiprocess Decoupling**: Unlike standard AI projects that lag during inference, TrafficGuard runs AI in a separate process. This keeps the UI buttery smooth even while processing 4 HD streams.
- **Hardware Agnostic (CPU Optimized)**: By using **ONNX Runtime**, we deliver near-GPU speeds on standard laptop/edge CPUs, drastically reducing deployment costs.
- **Weighted Fairness**: Most systems only count cars. Ours tracks "lane starvation" (wait time) to ensure low-density lanes aren't stuck on RED forever.
- **Zero-Config Admin**: Change traffic timers or AI confidence levels on-the-fly via the dashboard; no code changes required.
- **Real-World Ready**: Includes built-in violation recording with snapshots and system health monitoring as standard features.

---

## 🛠️ Installation & Setup

### Prerequisites
- Python 3.9+
- Node.js 18+

### Step 1: Backend Setup
```bash
cd backend
pip install -r requirements.txt
python main.py
```

### Step 2: Frontend Setup
```bash
cd frontend-next
npm install
npm run dev
```

---

## 🛡️ Security & Scalability
- **SQLite Persistence**: Ensures data survives system reboots.
- **Zustand State**: Handles thousands of updates per second without UI flickering.
- **Uvicorn/FastAPI**: Capable of handling hundreds of concurrent client connections for large-scale monitoring centers.

---
*Created by Antigravity AI for the Traffic AI Project.*
