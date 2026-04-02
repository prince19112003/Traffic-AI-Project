import serial
import time
import threading

class ArduinoSerial:
    """
    Handles Serial communication with the Arduino board.
    Sends command strings like 'N_G', 'S_R' etc.
    """
    def __init__(self, port='COM3', baudrate=9600, enabled=True):
        self.port = port
        self.baudrate = baudrate
        self.enabled = enabled
        self.ser = None
        self.last_sent_map = {}
        
        if self.enabled:
            self._connect()

    def _connect(self):
        try:
            self.ser = serial.Serial(self.port, self.baudrate, timeout=1)
            print(f"[SERIAL] Connected to Arduino on {self.port}")
            time.sleep(2) # Wait for Arduino reset
        except serial.SerialException as e:
            if "FileNotFoundError" in str(e) or "2" in str(e):
                print(f"[SERIAL INFO] Hardware not detected on {self.port}. Running in Software Mode.")
            else:
                print(f"[SERIAL ERROR] Could not connect to {self.port}: {e}")
            self.ser = None

    def send_signals(self, signal_map: dict):
        """
        Sends only changed signals to reduce serial traffic.
        Format: 'N_G\n', 'E_R\n' etc.
        """
        if not self.ser or not self.enabled:
            return

        for dir_name, state in signal_map.items():
            # direction short code (n, e, s, w)
            short_dir = dir_name[0].upper()
            # state short code (G, Y, R)
            short_state = state[0].upper()
            
            cmd = f"{short_dir}_{short_state}"
            
            # Only send if changed
            if self.last_sent_map.get(dir_name) != state:
                try:
                    self.ser.write(f"{cmd}\n".encode())
                    self.last_sent_map[dir_name] = state
                    print(f"[SERIAL] Sent: {cmd}")
                except Exception as e:
                    print(f"[SERIAL ERROR] Write failed: {e}")
                    self.ser = None # Trigger reconnect logic if needed 

    def close(self):
        if self.ser:
            self.ser.close()
