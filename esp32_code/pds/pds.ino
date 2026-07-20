#include <WiFi.h>
#include <WiFiClientSecure.h>
#include <PubSubClient.h>
#include <HX711.h>
#include <MFRC522.h>
#include <SPI.h>
#include <ESP32Servo.h>
#include <DHT.h>
#include <Wire.h>
#include <Adafruit_GFX.h>
#include <Adafruit_SSD1306.h>
#include <ArduinoJson.h>

// ================= PIN DEFINITIONS =================

// HX711 #1 - Rice
#define HX711_RICE_DT   4
#define HX711_RICE_SCK  16

// HX711 #2 - Wheat
#define HX711_WHEAT_DT  32
#define HX711_WHEAT_SCK 33

// RFID
#define SS_PIN   5
#define RST_PIN  27
#define RFID_SCK 18
#define RFID_MISO 19
#define RFID_MOSI 23

// DHT
#define DHTPIN 15
#define DHTTYPE DHT11

// Servo
#define SERVO_PIN 13

// OLED
#define SDA_PIN 21
#define SCL_PIN 22
#define SCREEN_WIDTH 128
#define SCREEN_HEIGHT 64

// ================= WIFI =================
const char* ssid = "";
const char* password = "";

// ================= MQTT =================
const char* mqtt_server = "";
const int mqtt_port = 8883;
const char* mqtt_user = "";
const char* mqtt_pass = "";

// ================= TOPICS =================
String riceBaseTopic  = "pds/shop01/rice/";
String wheatBaseTopic = "pds/shop01/wheat/";

String riceWeightTopic   = riceBaseTopic + "weight";
String wheatWeightTopic  = wheatBaseTopic + "weight";

String riceRfidTopic     = riceBaseTopic + "rfid";
String wheatRfidTopic    = wheatBaseTopic + "rfid";   // kept for future use

String riceEnvTopic      = riceBaseTopic + "env";
String wheatEnvTopic     = wheatBaseTopic + "env";    // kept for future use

String riceStatusTopic   = riceBaseTopic + "status";
String wheatStatusTopic  = wheatBaseTopic + "status";

String riceControlTopic  = riceBaseTopic + "control";
String wheatControlTopic = wheatBaseTopic + "control";

// ================= OBJECTS =================
WiFiClientSecure espClient;
PubSubClient client(espClient);

HX711 scaleRice;
HX711 scaleWheat;

MFRC522 rfid(SS_PIN, RST_PIN);
Servo servoMotor;
DHT dht(DHTPIN, DHTTYPE);
Adafruit_SSD1306 display(SCREEN_WIDTH, SCREEN_HEIGHT, &Wire, -1);

// ================= VARIABLES =================
float currentWeightRice = 0.0;
float previousWeightRice = 0.0;

float currentWeightWheat = 0.0;
float previousWeightWheat = 0.0;

float lastTemp = 0.0;
float lastHum = 0.0;

bool locked = false;
bool servoOpen = false;
unsigned long servoOpenTime = 0;

// ================= THRESHOLDS =================
float calibration_factor_rice = 1799000.0;   
float calibration_factor_wheat = 1900000.0;  

const float CHANGE_THRESHOLD_G = 20.0;  
const float NOISE_THRESHOLD_G  = 5.0;

// ================= TIMINGS =================
const unsigned long SERVO_OPEN_DURATION = 5000; // 5 sec
const unsigned long ENV_INTERVAL  = 30000;      // demo = 30 sec
const unsigned long OLED_INTERVAL = 1200;

unsigned long lastEnvPublish = 0;
unsigned long lastOLEDUpdate = 0;

// ================= RFID VALID UID =================
const String VALID_UID = "CD0D1605";

// ------------------- WIFI --------------------------
void connectWiFi() {
  Serial.print("Connecting to WiFi");
  WiFi.begin(ssid, password);

  int tries = 0;
  while (WiFi.status() != WL_CONNECTED && tries < 30) {
    delay(500);
    Serial.print(".");
    tries++;
  }

  if (WiFi.status() == WL_CONNECTED) {
    Serial.println("\nWiFi connected");
    Serial.print("IP: ");
    Serial.println(WiFi.localIP());
  } else {
    Serial.println("\nWiFi failed");
  }
}

// ------------------- MQTT --------------------------
void publishJSON(const String& topic, StaticJsonDocument<256>& doc) {
  char buffer[256];
  serializeJson(doc, buffer);
  client.publish(topic.c_str(), buffer);

  Serial.print("Published -> ");
  Serial.print(topic);
  Serial.print(" : ");
  Serial.println(buffer);
}

void publishStatus(String item, String state, String reason) {
  StaticJsonDocument<256> doc;
  doc["shop_id"] = "shop01";
  doc["item"] = item;
  doc["state"] = state;
  doc["reason"] = reason;
  doc["locked"] = locked;
  doc["servo_open"] = servoOpen;

  if (item == "rice") {
    publishJSON(riceStatusTopic, doc);
  } else if (item == "wheat") {
    publishJSON(wheatStatusTopic, doc);
  }
}

void publishWeight(String item, float weight, float changeVal) {
  StaticJsonDocument<256> doc;
  doc["shop_id"] = "shop01";
  doc["item"] = item;
  doc["weight_g"] = weight;
  doc["change_g"] = changeVal;
  doc["event"] = (changeVal > 0) ? "weight_drop" : "weight_increase";

  if (item == "rice") {
    publishJSON(riceWeightTopic, doc);
  } else if (item == "wheat") {
    publishJSON(wheatWeightTopic, doc);
  }
}

void publishRFID(String item, String uid, String access) {
  StaticJsonDocument<256> doc;
  doc["shop_id"] = "shop01";
  doc["item"] = item;
  doc["rfid_uid"] = uid;
  doc["access"] = access;
  doc["locked"] = locked;

  if (item == "rice") {
    publishJSON(riceRfidTopic, doc);
  } else if (item == "wheat") {
    publishJSON(wheatRfidTopic, doc);
  }
}

void publishEnvBoth(float temp, float hum) {
  StaticJsonDocument<256> riceDoc;
  riceDoc["shop_id"] = "shop01";
  riceDoc["item"] = "rice";
  riceDoc["temperature_c"] = temp;
  riceDoc["humidity_percent"] = hum;
  publishJSON(riceEnvTopic, riceDoc);

  StaticJsonDocument<256> wheatDoc;
  wheatDoc["shop_id"] = "shop01";
  wheatDoc["item"] = "wheat";
  wheatDoc["temperature_c"] = temp;
  wheatDoc["humidity_percent"] = hum;
  publishJSON(wheatEnvTopic, wheatDoc);
}

void mqttCallback(char* topic, byte* payload, unsigned int length) {
  StaticJsonDocument<200> doc;
  DeserializationError error = deserializeJson(doc, payload, length);

  if (error) {
    Serial.println("MQTT JSON parse failed");
    return;
  }

  String command = doc["command"] | "";
  String reason = doc["reason"] | "";
  String topicStr = String(topic);

  if (command == "LOCK") {
    locked = true;
    servoMotor.write(0);
    servoOpen = false;
    Serial.print("LOCK received on topic: ");
    Serial.println(topicStr);

    if (topicStr == riceControlTopic) {
      publishStatus("rice", "locked", reason);
    } else if (topicStr == wheatControlTopic) {
      publishStatus("wheat", "locked", reason);
    }
  }
  else if (command == "UNLOCK") {
    locked = false;
    Serial.print("UNLOCK received on topic: ");
    Serial.println(topicStr);

    if (topicStr == riceControlTopic) {
      publishStatus("rice", "unlocked", reason);
    } else if (topicStr == wheatControlTopic) {
      publishStatus("wheat", "unlocked", reason);
    }
  }
}

void reconnectMQTT() {
  while (!client.connected()) {
    Serial.print("Connecting to MQTT... ");

    String clientId = "ESP32Client-" + String(random(0xffff), HEX);

    if (client.connect(clientId.c_str(), mqtt_user, mqtt_pass)) {
      Serial.println("connected");
      client.subscribe(riceControlTopic.c_str());
      client.subscribe(wheatControlTopic.c_str());

      publishStatus("rice", "device_online", "boot");
      publishStatus("wheat", "device_online", "boot");
    } else {
      Serial.print("failed, rc=");
      Serial.print(client.state());
      Serial.println(" retrying in 2 sec");
      delay(2000);
    }
  }
}

// ------------------- OLED --------------------------
void updateOLED() {
  if (millis() - lastOLEDUpdate < OLED_INTERVAL) return;
  lastOLEDUpdate = millis();

  display.clearDisplay();

  display.setTextSize(2);
  display.setCursor(0, 0);
  display.print("W:");
  display.print(currentWeightWheat, 0);
  display.println("g");
  display.print("R:");
  display.print(currentWeightRice, 0);
  display.println("g");

  display.setTextSize(1);
  display.print("T:");
  display.print(lastTemp, 0);
  display.print("C  H:");
  display.print(lastHum, 0);
  display.println("%");

  display.setTextSize(1);
  display.setCursor(0, 50);

  if (locked) {
    display.println("LOCKED");
  } else if (servoOpen) {
    display.println("OPEN");
  } else {
    display.println("READY");
  }

  display.display();
}

// ------------------- SERVO -------------------------
void openServo() {
  servoMotor.write(90);
  servoOpen = true;
  servoOpenTime = millis();
  publishStatus("rice", "servo_open", "valid_rfid");
}

void closeServo() {
  servoMotor.write(0);
  servoOpen = false;
  publishStatus("rice", "servo_closed", "timeout_or_lock");
}

void handleServoTimeout() {
  if (servoOpen && millis() - servoOpenTime >= SERVO_OPEN_DURATION) {
    closeServo();
  }
}

// ------------------- RFID --------------------------
String getUIDString() {
  String uid = "";
  for (byte i = 0; i < rfid.uid.size; i++) {
    if (rfid.uid.uidByte[i] < 0x10) uid += "0";
    uid += String(rfid.uid.uidByte[i], HEX);
  }
  uid.toUpperCase();
  return uid;
}

void handleRFID() {
  if (!rfid.PICC_IsNewCardPresent()) return;
  if (!rfid.PICC_ReadCardSerial()) return;

  String uid = getUIDString();
  Serial.print("Scanned UID: ");
  Serial.println(uid);

  // For prototype: RFID + servo mapped to rice container access
  if (locked) {
    Serial.println("Access denied: system locked");
    publishRFID("rice", uid, "denied_locked");
  }
  else if (uid == VALID_UID) {
    Serial.println("Access granted");
    publishRFID("rice", uid, "granted");
    openServo();
  }
  else {
    Serial.println("Access denied: invalid card");
    publishRFID("rice", uid, "denied_invalid");
  }

  rfid.PICC_HaltA();
  rfid.PCD_StopCrypto1();
}

// ------------------- SCALES ------------------------
float readRiceWeightGrams() {
  return scaleRice.get_units(5) * 1000.0;
}

float readWheatWeightGrams() {
  return scaleWheat.get_units(5) * 1000.0;
}

void setupScales() {
  // Rice
  scaleRice.begin(HX711_RICE_DT, HX711_RICE_SCK);
  if (!scaleRice.is_ready()) {
    Serial.println("HX711 Rice not found");
    while (true);
  }
  scaleRice.set_scale(calibration_factor_rice);
  scaleRice.tare();
  delay(300);
  previousWeightRice = readRiceWeightGrams();
  currentWeightRice = previousWeightRice;

  // Wheat
  scaleWheat.begin(HX711_WHEAT_DT, HX711_WHEAT_SCK);
  if (!scaleWheat.is_ready()) {
    Serial.println("HX711 Wheat not found");
    while (true);
  }
  scaleWheat.set_scale(calibration_factor_wheat);
  scaleWheat.tare();
  delay(300);
  previousWeightWheat = readWheatWeightGrams();
  currentWeightWheat = previousWeightWheat;

  Serial.println("Both HX711 modules ready");
}

void handleWeightChanges() {
  // Rice
  currentWeightRice = readRiceWeightGrams();
  float diffRice = previousWeightRice - currentWeightRice;

  if (abs(diffRice) > CHANGE_THRESHOLD_G) {
    Serial.print("Rice weight change detected: ");
    Serial.println(diffRice);
    publishWeight("rice", currentWeightRice, diffRice);
    previousWeightRice = currentWeightRice;
  }

  // Wheat
  currentWeightWheat = readWheatWeightGrams();
  float diffWheat = previousWeightWheat - currentWeightWheat;

  if (abs(diffWheat) > CHANGE_THRESHOLD_G) {
    Serial.print("Wheat weight change detected: ");
    Serial.println(diffWheat);
    publishWeight("wheat", currentWeightWheat, diffWheat);
    previousWeightWheat = currentWeightWheat;
  }
}

// ------------------- DHT ---------------------------
void handleEnvironment() {
  if (millis() - lastEnvPublish >= ENV_INTERVAL) {
    float t = dht.readTemperature();
    float h = dht.readHumidity();

    if (!isnan(t) && !isnan(h)) {
      lastTemp = t;
      lastHum = h;

      Serial.print("Temp: ");
      Serial.print(t);
      Serial.print(" C, Hum: ");
      Serial.print(h);
      Serial.println(" %");

      publishEnvBoth(lastTemp, lastHum);
    } else {
      Serial.println("Failed to read DHT11");
    }

    lastEnvPublish = millis();
  }
}

// ------------------- SETUP -------------------------
void setupOLED() {
  Wire.begin(SDA_PIN, SCL_PIN);

  if (!display.begin(SSD1306_SWITCHCAPVCC, 0x3C)) {
    Serial.println("OLED failed");
    while (true);
  }

  display.clearDisplay();
  display.setTextColor(SSD1306_WHITE);

  display.setTextSize(2);
  display.setCursor(0, 0);
  display.println("PDS");
  display.println("START");
  display.display();
}

void setupRFID() {
  SPI.begin(RFID_SCK, RFID_MISO, RFID_MOSI, SS_PIN);
  rfid.PCD_Init();
  Serial.println("RFID ready");
}

void setupServo() {
  servoMotor.setPeriodHertz(50);
  servoMotor.attach(SERVO_PIN, 500, 2400);
  servoMotor.write(0);
  servoOpen = false;
}

void setup() {
  Serial.begin(115200);
  delay(2000);
  Serial.println("System booting...");

  setupOLED();
  dht.begin();
  setupServo();
  setupScales();
  setupRFID();

  connectWiFi();

  espClient.setInsecure();   // testing with HiveMQ Cloud
  client.setServer(mqtt_server, mqtt_port);
  client.setCallback(mqttCallback);

  lastTemp = dht.readTemperature();
  lastHum = dht.readHumidity();

  Serial.println("Setup complete");
}

// ------------------- LOOP --------------------------
void loop() {
  if (WiFi.status() != WL_CONNECTED) {
    connectWiFi();
  }

  if (!client.connected()) {
    reconnectMQTT();
  }

  client.loop();

  handleRFID();
  handleServoTimeout();
  handleWeightChanges();
  handleEnvironment();
  updateOLED();

  delay(50);
}