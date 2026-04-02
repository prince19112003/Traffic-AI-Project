/*
  Traffic AI Project - Arduino Controller
  ---------------------------------------
  This code listens for Serial commands from the Python backend 
  and controls 12 LEDs (3 for each of the 4 directions).

  COMMANDS (Sent via Serial at 9600 baud):
  N_G (North Green), N_Y (North Yellow), N_R (North Red)
  E_G (East Green),  E_Y (East Yellow),  E_R (East Red)
  ... and so on.
*/

// PIN DEFINITIONS (Adjust as per your breadboard setup)
// North
const int N_RED = 2;
const int N_YEL = 3;
const int N_GRN = 4;

// East
const int E_RED = 5;
const int E_YEL = 6;
const int E_GRN = 7;

// South
const int S_RED = 8;
const int S_YEL = 9;
const int S_GRN = 10;

// West
const int W_RED = 11;
const int W_YEL = 12;
const int W_GRN = 13;

void setup() {
  Serial.begin(9600);
  
  // Set all pins as OUTPUT
  for (int i = 2; i <= 13; i++) {
    pinMode(i, OUTPUT);
    digitalWrite(i, LOW); // Start with all OFF
  }

  // Initial Lamp Test: All RED
  setAllRed();
}

void loop() {
  if (Serial.available() > 0) {
    String cmd = Serial.readStringUntil('\n');
    cmd.trim();
    processCommand(cmd);
  }
}

void processCommand(String cmd) {
  if (cmd == "ALL_RED") {
    setAllRed();
  } else if (cmd == "N_G") { setSignal("N", "G"); }
  else if (cmd == "N_Y") { setSignal("N", "Y"); }
  else if (cmd == "N_R") { setSignal("N", "R"); }
  
  else if (cmd == "E_G") { setSignal("E", "G"); }
  else if (cmd == "E_Y") { setSignal("E", "Y"); }
  else if (cmd == "E_R") { setSignal("E", "R"); }
  
  else if (cmd == "S_G") { setSignal("S", "G"); }
  else if (cmd == "S_Y") { setSignal("S", "Y"); }
  else if (cmd == "S_R") { setSignal("S", "R"); }
  
  else if (cmd == "W_G") { setSignal("W", "G"); }
  else if (cmd == "W_Y") { setSignal("W", "Y"); }
  else if (cmd == "W_R") { setSignal("W", "R"); }
}

void setSignal(String dir, String color) {
  int r, y, g;
  
  if (dir == "N") { r = N_RED; y = N_YEL; g = N_GRN; }
  else if (dir == "E") { r = E_RED; y = E_YEL; g = E_GRN; }
  else if (dir == "S") { r = S_RED; y = S_YEL; g = S_GRN; }
  else if (dir == "W") { r = W_RED; y = W_YEL; g = W_GRN; }
  else return;

  // Turn off all 3 for this direction first
  digitalWrite(r, LOW); digitalWrite(y, LOW); digitalWrite(g, LOW);

  // Turn on the requested one
  if (color == "R") digitalWrite(r, HIGH);
  else if (color == "Y") digitalWrite(y, HIGH);
  else if (color == "G") digitalWrite(g, HIGH);
}

void setAllRed() {
  for (int i = 2; i <= 13; i++) digitalWrite(i, LOW);
  digitalWrite(N_RED, HIGH);
  digitalWrite(E_RED, HIGH);
  digitalWrite(S_RED, HIGH);
  digitalWrite(W_RED, HIGH);
}
