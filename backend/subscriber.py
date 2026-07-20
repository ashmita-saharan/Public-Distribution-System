import json
import sqlite3
from datetime import datetime, timezone
import ssl

import paho.mqtt.client as mqtt

# ================= MQTT CONFIG =================
MQTT_BROKER = "8c91e086833c43f4aeac6048ce96a104.s1.eu.hivemq.cloud"
MQTT_PORT = 8883
MQTT_USERNAME = "ashmita"
MQTT_PASSWORD = "Ash12345"

TOPICS = [
    ("pds/+/+/weight", 0),
    ("pds/+/+/rfid", 0),
    ("pds/+/+/env", 0),
    ("pds/+/+/status", 0),
]

DB_FILE = "pds_data.db"


# ================= DATABASE =================
def get_db_connection():
    conn = sqlite3.connect(DB_FILE)
    conn.execute("PRAGMA foreign_keys = ON;")
    return conn


def init_db():
    conn = get_db_connection()
    cur = conn.cursor()

    cur.execute("""
        CREATE TABLE IF NOT EXISTS weight_logs (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            timestamp TEXT NOT NULL,
            shop_id TEXT NOT NULL,
            item TEXT NOT NULL,
            weight_g REAL,
            change_g REAL,
            event TEXT
        )
    """)

    cur.execute("""
        CREATE TABLE IF NOT EXISTS rfid_logs (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            timestamp TEXT NOT NULL,
            shop_id TEXT NOT NULL,
            item TEXT NOT NULL,
            rfid_uid TEXT,
            access TEXT,
            locked INTEGER
        )
    """)

    cur.execute("""
        CREATE TABLE IF NOT EXISTS environment_logs (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            timestamp TEXT NOT NULL,
            shop_id TEXT NOT NULL,
            item TEXT NOT NULL,
            temperature_c REAL,
            humidity_percent REAL
        )
    """)

    cur.execute("""
        CREATE TABLE IF NOT EXISTS status_logs (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            timestamp TEXT NOT NULL,
            shop_id TEXT NOT NULL,
            item TEXT NOT NULL,
            state TEXT,
            reason TEXT,
            locked INTEGER,
            servo_open INTEGER
        )
    """)

    cur.execute("""
        CREATE TABLE IF NOT EXISTS alerts (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            timestamp TEXT NOT NULL,
            shop_id TEXT NOT NULL,
            item TEXT NOT NULL,
            alert_type TEXT,
            reason TEXT,
            action_taken TEXT
        )
    """)

    conn.commit()
    conn.close()


# ================= HELPERS =================
def now_utc_iso() -> str:
    return datetime.now(timezone.utc).isoformat()


def parse_topic(topic: str):
    """
    Expected topic format:
    pds/{shop_id}/{item}/{event_type}
    """
    parts = topic.split("/")
    if len(parts) != 4 or parts[0] != "pds":
        return None
    return {
        "shop_id": parts[1],
        "item": parts[2],
        "event_type": parts[3],
    }


def insert_weight_log(shop_id, item, payload):
    conn = get_db_connection()
    cur = conn.cursor()
    cur.execute("""
        INSERT INTO weight_logs (timestamp, shop_id, item, weight_g, change_g, event)
        VALUES (?, ?, ?, ?, ?, ?)
    """, (
        now_utc_iso(),
        shop_id,
        item,
        payload.get("weight_g"),
        payload.get("change_g"),
        payload.get("event"),
    ))
    conn.commit()
    conn.close()


def insert_rfid_log(shop_id, item, payload):
    conn = get_db_connection()
    cur = conn.cursor()
    cur.execute("""
        INSERT INTO rfid_logs (timestamp, shop_id, item, rfid_uid, access, locked)
        VALUES (?, ?, ?, ?, ?, ?)
    """, (
        now_utc_iso(),
        shop_id,
        item,
        payload.get("rfid_uid"),
        payload.get("access"),
        1 if payload.get("locked") else 0,
    ))
    conn.commit()
    conn.close()


def insert_env_log(shop_id, item, payload):
    conn = get_db_connection()
    cur = conn.cursor()
    cur.execute("""
        INSERT INTO environment_logs (timestamp, shop_id, item, temperature_c, humidity_percent)
        VALUES (?, ?, ?, ?, ?)
    """, (
        now_utc_iso(),
        shop_id,
        item,
        payload.get("temperature_c"),
        payload.get("humidity_percent"),
    ))
    conn.commit()
    conn.close()


def insert_status_log(shop_id, item, payload):
    conn = get_db_connection()
    cur = conn.cursor()
    cur.execute("""
        INSERT INTO status_logs (timestamp, shop_id, item, state, reason, locked, servo_open)
        VALUES (?, ?, ?, ?, ?, ?, ?)
    """, (
        now_utc_iso(),
        shop_id,
        item,
        payload.get("state"),
        payload.get("reason"),
        1 if payload.get("locked") else 0,
        1 if payload.get("servo_open") else 0,
    ))
    conn.commit()
    conn.close()


def insert_alert(shop_id, item, alert_type, reason, action_taken):
    conn = get_db_connection()
    cur = conn.cursor()
    cur.execute("""
        INSERT INTO alerts (timestamp, shop_id, item, alert_type, reason, action_taken)
        VALUES (?, ?, ?, ?, ?, ?)
    """, (
        now_utc_iso(),
        shop_id,
        item,
        alert_type,
        reason,
        action_taken,
    ))
    conn.commit()
    conn.close()


# ================= ANOMALY RULES =================
def check_anomalies_and_act(client, shop_id, item, event_type, payload):
    """
    Simple prototype rules:
    1. Very large weight drop => lock
    2. Too many denied RFID attempts in recent history => lock
    """

    # Rule 1: suspicious large weight drop
    if event_type == "weight":
        change_g = payload.get("change_g")
        if isinstance(change_g, (int, float)) and change_g > 150:
            reason = "large_weight_drop_detected"
            insert_alert(shop_id, item, "weight_anomaly", reason, "LOCK")

            control_topic = f"pds/{shop_id}/{item}/control"
            command = {
                "command": "LOCK",
                "reason": reason
            }
            client.publish(control_topic, json.dumps(command))
            print(f"[ALERT] Sent LOCK to {control_topic} בגלל {reason}")

    # Rule 2: repeated denied RFID attempts
    if event_type == "rfid":
        access = payload.get("access", "")
        if access.startswith("denied"):
            conn = get_db_connection()
            cur = conn.cursor()
            cur.execute("""
                SELECT COUNT(*)
                FROM rfid_logs
                WHERE shop_id = ?
                  AND item = ?
                  AND access LIKE 'denied%'
            """, (shop_id, item))
            denied_count = cur.fetchone()[0]
            conn.close()

            if denied_count >= 3:
                reason = "multiple_denied_rfid_attempts"
                insert_alert(shop_id, item, "rfid_anomaly", reason, "LOCK")

                control_topic = f"pds/{shop_id}/{item}/control"
                command = {
                    "command": "LOCK",
                    "reason": reason
                }
                client.publish(control_topic, json.dumps(command))
                print(f"[ALERT] Sent LOCK to {control_topic} because {reason}")


# ================= MQTT CALLBACKS =================
def on_connect(client, userdata, flags, rc):
    if rc == 0:
        print("Connected to MQTT broker")
        for topic, qos in TOPICS:
            client.subscribe(topic, qos)
            print(f"Subscribed to: {topic}")
    else:
        print(f"Failed to connect, rc={rc}")


def on_message(client, userdata, msg):
    print(f"\n[MQTT] Topic: {msg.topic}")

    topic_info = parse_topic(msg.topic)
    if not topic_info:
        print("Invalid topic format, skipping")
        return

    shop_id = topic_info["shop_id"]
    item = topic_info["item"]
    event_type = topic_info["event_type"]

    try:
        payload = json.loads(msg.payload.decode("utf-8"))
        print(f"[MQTT] Payload: {payload}")
    except json.JSONDecodeError:
        print("Invalid JSON payload")
        return

    # Store in DB
    if event_type == "weight":
        insert_weight_log(shop_id, item, payload)

    elif event_type == "rfid":
        insert_rfid_log(shop_id, item, payload)

    elif event_type == "env":
        insert_env_log(shop_id, item, payload)

    elif event_type == "status":
        insert_status_log(shop_id, item, payload)

    else:
        print(f"Unknown event type: {event_type}")
        return

    # Apply simple anomaly rules
    check_anomalies_and_act(client, shop_id, item, event_type, payload)


def main():
    init_db()

    client = mqtt.Client()
    client.username_pw_set(MQTT_USERNAME, MQTT_PASSWORD)
    client.tls_set(cert_reqs=ssl.CERT_REQUIRED)
    client.on_connect = on_connect
    client.on_message = on_message

    print("Connecting to broker...")
    client.connect(MQTT_BROKER, MQTT_PORT, 60)
    client.loop_forever()


if __name__ == "__main__":
    main()
