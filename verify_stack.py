import asyncio
import websockets
import json
import requests
import time

BACKEND_URL = "http://localhost:8000"
WS_URL = "ws://localhost:8000/ws"

async def test_websocket():
    print("[TEST] Testing WebSocket connection to 8000...")
    try:
        async with websockets.connect(WS_URL) as websocket:
            print("[PASS] WebSocket Connected successfully.")
            # Wait for one message
            msg = await asyncio.wait_for(websocket.recv(), timeout=5.0)
            data = json.loads(msg)
            print(f"[PASS] Received data packet. Status: {data.get('status')}")
            return True
    except Exception as e:
        print(f"[FAIL] WebSocket test failed: {e}")
        return False

def test_api():
    print("[TEST] Testing REST API /get-config...")
    try:
        res = requests.get(f"{BACKEND_URL}/get-config", timeout=5)
        if res.status_code == 200:
            print("[PASS] REST API reachable.")
            return True
        else:
            print(f"[FAIL] API returned status {res.status_code}")
            return False
    except Exception as e:
        print(f"[FAIL] API test failed: {e}")
        return False

if __name__ == "__main__":
    api_ok = test_api()
    if api_ok:
        ws_ok = asyncio.run(test_websocket())
    
    if api_ok and ws_ok:
        print("\n[RESULT] SYSTEM STATUS: PERFECT 🚀")
    else:
        print("\n[RESULT] SYSTEM STATUS: ISSUES DETECTED ⚠️")
