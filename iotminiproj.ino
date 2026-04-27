#include <Wire.h>
#include <Adafruit_GFX.h>
#include <Adafruit_SSD1306.h>
#include <Servo.h>
#include <WiFiS3.h>
#include <ThingSpeak.h>

// ---------------- WIFI ----------------
char ssid[] = "Archi";
char pass[] = "tannu@26";

// ---------------- THINGSPEAK ----------------
unsigned long channelID = 3358675;
const char* writeAPIKey = "983BSKISRRKMBQPG";

WiFiClient clientTS;

// OLED setup
#define SCREEN_WIDTH 128
#define SCREEN_HEIGHT 64
Adafruit_SSD1306 display(SCREEN_WIDTH, SCREEN_HEIGHT, &Wire, -1);

// IR sensors
int ir1 = 2;
int ir2 = 3;
int ir3 = 4;

// Buzzer
int buzzer = 6;

// Servo
Servo myServo;
int servoPin = 7;

// Ultrasonic
int trigPin = 12;
int echoPin = 13;

// Gas sensor
int gasPin = A0;
int gasThreshold = 500;

// ---------------- WIFI CONNECT ----------------
void setup_wifi() {
  WiFi.begin(ssid, pass);

  Serial.print("Connecting WiFi");
  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
  }

  Serial.println("\nWiFi Connected 🚀");
}

void setup() {
  Serial.begin(9600);

  pinMode(ir1, INPUT_PULLUP);
  pinMode(ir2, INPUT_PULLUP);
  pinMode(ir3, INPUT_PULLUP);

  pinMode(buzzer, OUTPUT);

  myServo.attach(servoPin);
  myServo.write(0);

  pinMode(trigPin, OUTPUT);
  pinMode(echoPin, INPUT);

  setup_wifi();

  ThingSpeak.begin(clientTS);

  if (!display.begin(SSD1306_SWITCHCAPVCC, 0x3C)) {
    Serial.println("OLED failed");
    while (true);
  }
}

void loop() {

  int irState1 = digitalRead(ir1);
  int irState2 = digitalRead(ir2);
  int irState3 = digitalRead(ir3);

  int gasValue = analogRead(gasPin);

  long duration;
  int distance;

  digitalWrite(trigPin, LOW);
  delayMicroseconds(2);
  digitalWrite(trigPin, HIGH);
  delayMicroseconds(10);
  digitalWrite(trigPin, LOW);

  duration = pulseIn(echoPin, HIGH);
  distance = duration * 0.034 / 2;

  // 🔊 Buzzer
  digitalWrite(buzzer, (gasValue > gasThreshold));

  // ⚙️ Servo
  if (irState1 == LOW) myServo.write(90);
  else myServo.write(0);

  // 🧠 Convert IR
  String s1 = (irState1 == LOW) ? "EMPTY" : "OCCUPIED";
  String s2 = (irState2 == LOW) ? "EMPTY" : "OCCUPIED";
  String s3 = (irState3 == LOW) ? "EMPTY" : "OCCUPIED";

  // 📡 THINGSPEAK SEND
  ThingSpeak.setField(1, gasValue);
  ThingSpeak.setField(2, distance);
  ThingSpeak.setField(3, irState1 == LOW ? 1 : 0);
  ThingSpeak.setField(4, irState2 == LOW ? 1 : 0);
  ThingSpeak.setField(5, irState3 == LOW ? 1 : 0);

  int x = ThingSpeak.writeFields(channelID, writeAPIKey);

  if (x == 200) {
    Serial.println("ThingSpeak Update OK ✅");
  } else {
    Serial.println("Update Failed ❌");
  }

  // 📺 OLED
  display.clearDisplay();
  display.setTextSize(1);
  display.setCursor(0,0);
  display.print("THINGSPEAK LIVE");

  display.setCursor(0,12);
  display.print("Gas: "); display.println(gasValue);

  display.setCursor(0,24);
  display.print("Dist: "); display.println(distance);

  display.display();

  delay(15000); // IMPORTANT (ThingSpeak limit)
}
