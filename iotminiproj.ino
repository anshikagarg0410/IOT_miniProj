#include <WiFiS3.h>
#include <ThingSpeak.h>
#include <Servo.h>

// -------------------------------------------
// SERVO & SENSORS
// -------------------------------------------
Servo gate;

// IR sensor pins
const int entryIR = 5;       
const int slot1IR = 6;
const int slot2IR = 7;
const int slot3IR = 8;

// Servo
const int servoPin = 9;

// Ultrasonic
const int trigPin = 10;
const int echoPin = 11;

// Gas sensor
const int gasPin = A0;

// WiFi + ThingSpeak
char ssid[] = "Archi";      
char pass[] = "tannu@26";

unsigned long channelID = 3175373;
const char* apiKey = "EAS2XWQS7DA4CJPZ";

WiFiClient client;

// TIMER for ThingSpeak
unsigned long lastUpload = 0;
const long uploadInterval = 20000;  // 20 seconds

// -------------------------------------------
void setup() {
  Serial.begin(9600);

  // Entry IR uses PULLUP
  pinMode(entryIR, INPUT_PULLUP);

  // Slot IRs use plain INPUT
  pinMode(slot1IR, INPUT);
  pinMode(slot2IR, INPUT);
  pinMode(slot3IR, INPUT);

  // Ultrasonic
  pinMode(trigPin, OUTPUT);
  pinMode(echoPin, INPUT);

  // Servo
  gate.attach(servoPin);
  gate.write(0);

  // WiFi
  Serial.println("Connecting to WiFi...");
  while (WiFi.begin(ssid, pass) != WL_CONNECTED) {
    Serial.print(".");
    delay(300);
  }

  Serial.println("\nWiFi Connected!");
  ThingSpeak.begin(client);
}

// -------------------------------------------
// ULTRASONIC DISTANCE
// -------------------------------------------
long getDistance() {
  digitalWrite(trigPin, LOW);
  delayMicroseconds(2);

  digitalWrite(trigPin, HIGH);
  delayMicroseconds(10);

  digitalWrite(trigPin, LOW);

  long duration = pulseIn(echoPin, HIGH, 30000);
  if (duration == 0) 
    return -1;

  return duration / 58;
}

// -------------------------------------------
// LOOP
// -------------------------------------------
void loop() {

  // Read IR sensors
  int entry = digitalRead(entryIR);
  int slot1 = digitalRead(slot1IR) == LOW ? 1 : 0;
  int slot2 = digitalRead(slot2IR) == LOW ? 1 : 0;
  int slot3 = digitalRead(slot3IR) == LOW ? 1 : 0;

  long dist = getDistance();
  int gasVal = analogRead(gasPin);

  // ---------------- FAST GATE LOGIC ----------------
  if (entry == LOW)
    gate.write(90);     // open instantly
  else
    gate.write(0);      // close instantly

  // Serial Output (always fast)
  Serial.println("\n----- LIVE DATA -----");
  Serial.print("Entry IR: "); Serial.println(entry == LOW ? "CAR" : "NO CAR");
  Serial.print("Slot1: "); Serial.println(slot1);
  Serial.print("Slot2: "); Serial.println(slot2);
  Serial.print("Slot3: "); Serial.println(slot3);
  Serial.print("Distance: "); Serial.println(dist);
  Serial.print("Gas Value: "); Serial.println(gasVal);

  // ---------------- THINGSPEAK UPLOAD (EVERY 20 SEC) ----------------
  if (millis() - lastUpload >= uploadInterval) {
    
    ThingSpeak.setField(1, slot1);
    ThingSpeak.setField(2, slot2);
    ThingSpeak.setField(3, slot3);
    ThingSpeak.setField(4, gasVal);
    ThingSpeak.setField(5, dist);

    int status = ThingSpeak.writeFields(channelID, apiKey);

    if (status == 200)
      Serial.println("✔ Data Uploaded Successfully!");
    else {
      Serial.print("❌ Upload Failed, Code: ");
      Serial.println(status);
    }

    lastUpload = millis();  // reset timer
  }

  delay(1000); // No delay here → fast response!
}
