# Hardware Connections Guide (Arduino Uno)

This guide explains how to connect your LEDs and Relays to the Arduino Uno to implement the Tropical AI Traffic Signal project in the real world.

## 1. Components Needed
*   Arduino Uno (or Mega/Nano)
*   12x LEDs (4 Red, 4 Yellow, 4 Green)
*   12x 220-ohm Resistors (for LEDs)
*   Breadboard and Jumper Wires
*   *Optional:* 4x 4-Channel Relay Modules (if using real traffic signal lamps)

## 2. Pin Mapping (Arduino Pins to LEDs)

| Direction | Red LED Pin | Yellow LED Pin | Green LED Pin |
| :--- | :--- | :--- | :--- |
| **North** | Digital Pin 2 | Digital Pin 3 | Digital Pin 4 |
| **East** | Digital Pin 5 | Digital Pin 6 | Digital Pin 7 |
| **South** | Digital Pin 8 | Digital Pin 9 | Digital Pin 10 |
| **West** | Digital Pin 11 | Digital Pin 12 | Digital Pin 13 |

## 3. Wiring Diagram

### Basic LED Setup:
1.  Connect the **Long Leg (Anode +)** of each LED to its corresponding Digital Pin (e.g., Pin 2 for North Red).
2.  Connect the **Short Leg (Cathode -)** of the LED to a **220-ohm resistor**.
3.  Connect the other end of the resistor to the **GND** (Ground) rail of the breadboard.
4.  Connect the Ground rail of the breadboard to one of the **GND** pins on the Arduino.

### Relay Module Setup (for AC/DC High Power Signals):
*   Arduino **5V** -> Relay **VCC**
*   Arduino **GND** -> Relay **GND**
*   Arduino **Digital Pin (2-13)** -> Relay **IN (Input)** pin.
*   *Note: Relays usually work on 'Low Trigger', so you might need to invert the Digital Logic in the Arduino code if your relay turns ON when the pin is LOW.*

## 4. How to Connect Python to Arduino
1.  Connect your Arduino to your Computer via USB.
2.  Open the Arduino IDE and upload the `arduino_controller.ino` file provided.
3.  In your Python project, install `pyserial`:
    ```bash
    pip install pyserial
    ```
4.  Get the COM port (e.g., `COM3` on Windows, `/dev/ttyUSB0` on Linux) from the Arduino IDE.

Now you can send commands like `"N_G\n"` to the Serial port, and the physical lights will change!
