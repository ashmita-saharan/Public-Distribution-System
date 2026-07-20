from fastapi import FastAPI, Query
from fastapi.middleware.cors import CORSMiddleware
import sqlite3
from typing import Optional

DB_FILE = "pds_data.db"
RATION_PER_PERSON_G = 50
DEMO_DAILY_CONSUMPTION_G = 100
LOW_STOCK_THRESHOLD_G = 150
LARGE_DROP_THRESHOLD_G = 150

app = FastAPI(title="PDS Monitoring API", version="1.0.0")

# Allow React frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],   # later replace with your React URL
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

def get_people_served_today(cur, shop_id, item):
    cur.execute("""
        SELECT COALESCE(SUM(change_g), 0) AS total_drop
        FROM weight_logs
        WHERE shop_id = ?
          AND item = ?
          AND change_g > 0
          AND DATE(timestamp) = DATE('now')
    """, (shop_id, item))

    total_drop = cur.fetchone()["total_drop"] or 0
    people_served = int(total_drop // RATION_PER_PERSON_G)

    return {
        "total_distributed_today_g": total_drop,
        "people_served_today": people_served
    }

def get_connection():
    conn = sqlite3.connect(DB_FILE)
    conn.row_factory = sqlite3.Row
    return conn


def fetch_one_dict(cur):
    row = cur.fetchone()
    return dict(row) if row else None


def fetch_all_dict(cur):
    return [dict(row) for row in cur.fetchall()]


def get_latest_weight(cur, shop_id, item):
    cur.execute("""
        SELECT weight_g, change_g, event, timestamp
        FROM weight_logs
        WHERE shop_id = ? AND item = ?
        ORDER BY id DESC
        LIMIT 1
    """, (shop_id, item))
    return fetch_one_dict(cur)


def get_total_weight_drop_today(cur, shop_id, item):
    cur.execute("""
        SELECT COALESCE(SUM(change_g), 0) AS total_drop
        FROM weight_logs
        WHERE shop_id = ?
          AND item = ?
          AND change_g > 0
          AND DATE(timestamp) = DATE('now')
    """, (shop_id, item))
    row = cur.fetchone()
    return row["total_drop"] if row else 0


def get_latest_status(cur, shop_id, item):
    cur.execute("""
        SELECT state, reason, locked, servo_open, timestamp
        FROM status_logs
        WHERE shop_id = ? AND item = ?
        ORDER BY id DESC
        LIMIT 1
    """, (shop_id, item))
    return fetch_one_dict(cur)


def estimate_days_left(current_weight_g, daily_consumption_g=100):
    if not current_weight_g or daily_consumption_g <= 0:
        return 0
    return round(current_weight_g / daily_consumption_g, 1)


def estimate_people_served(total_drop_g, ration_per_person_g=50):
    if total_drop_g <= 0:
        return 0
    return int(total_drop_g // ration_per_person_g)


@app.get("/")
def root():
    return {"message": "PDS Monitoring API is running"}


@app.get("/overview")
def get_overview():
    conn = get_connection()
    cur = conn.cursor()

    cur.execute("SELECT COUNT(DISTINCT shop_id) AS total_shops FROM weight_logs")
    total_shops = cur.fetchone()["total_shops"] or 0

    cur.execute("SELECT COUNT(*) AS total_alerts FROM alerts")
    total_alerts = cur.fetchone()["total_alerts"] or 0

    cur.execute("SELECT COUNT(*) AS total_rfid_events FROM rfid_logs")
    total_rfid_events = cur.fetchone()["total_rfid_events"] or 0

    cur.execute("""
        SELECT COUNT(*) AS locked_count
        FROM status_logs
        WHERE state = 'locked'
    """)
    locked_count = cur.fetchone()["locked_count"] or 0

    conn.close()

    return {
        "total_shops": total_shops,
        "total_alerts": total_alerts,
        "total_rfid_events": total_rfid_events,
        "locked_count": locked_count
    }


@app.get("/shops")
def get_shops():
    conn = get_connection()
    cur = conn.cursor()

    cur.execute("""
        SELECT DISTINCT shop_id
        FROM (
            SELECT shop_id FROM weight_logs
            UNION
            SELECT shop_id FROM rfid_logs
            UNION
            SELECT shop_id FROM environment_logs
            UNION
            SELECT shop_id FROM status_logs
        )
        ORDER BY shop_id
    """)

    shops = [row["shop_id"] for row in cur.fetchall()]
    conn.close()
    return {"shops": shops}


@app.get("/shops/{shop_id}")
def get_shop_details(shop_id: str):
    conn = get_connection()
    cur = conn.cursor()

    cur.execute("""
        SELECT DISTINCT item
        FROM (
            SELECT item FROM weight_logs WHERE shop_id = ?
            UNION
            SELECT item FROM rfid_logs WHERE shop_id = ?
            UNION
            SELECT item FROM environment_logs WHERE shop_id = ?
            UNION
            SELECT item FROM status_logs WHERE shop_id = ?
        )
        ORDER BY item
    """, (shop_id, shop_id, shop_id, shop_id))
    items = [row["item"] for row in cur.fetchall()]

    shop_data = []

    for item in items:
        cur.execute("""
            SELECT weight_g, change_g, event, timestamp
            FROM weight_logs
            WHERE shop_id = ? AND item = ?
            ORDER BY id DESC
            LIMIT 1
        """, (shop_id, item))
        latest_weight = cur.fetchone()

        cur.execute("""
            SELECT state, reason, locked, servo_open, timestamp
            FROM status_logs
            WHERE shop_id = ? AND item = ?
            ORDER BY id DESC
            LIMIT 1
        """, (shop_id, item))
        latest_status = cur.fetchone()

        cur.execute("""
            SELECT temperature_c, humidity_percent, timestamp
            FROM environment_logs
            WHERE shop_id = ? AND item = ?
            ORDER BY id DESC
            LIMIT 1
        """, (shop_id, item))
        latest_env = cur.fetchone()

        shop_data.append({
            "item": item,
            "latest_weight": dict(latest_weight) if latest_weight else None,
            "latest_status": dict(latest_status) if latest_status else None,
            "latest_environment": dict(latest_env) if latest_env else None
        })

    conn.close()
    return {
        "shop_id": shop_id,
        "items": shop_data
    }


@app.get("/logs/weight")
def get_weight_logs(
    shop_id: Optional[str] = Query(None),
    item: Optional[str] = Query(None),
    limit: int = Query(50)
):
    conn = get_connection()
    cur = conn.cursor()

    query = "SELECT * FROM weight_logs WHERE 1=1"
    params = []

    if shop_id:
        query += " AND shop_id = ?"
        params.append(shop_id)
    if item:
        query += " AND item = ?"
        params.append(item)

    query += " ORDER BY id DESC LIMIT ?"
    params.append(limit)

    cur.execute(query, params)
    rows = [dict(row) for row in cur.fetchall()]
    conn.close()
    return {"weight_logs": rows}


@app.get("/logs/rfid")
def get_rfid_logs(
    shop_id: Optional[str] = Query(None),
    item: Optional[str] = Query(None),
    limit: int = Query(50)
):
    conn = get_connection()
    cur = conn.cursor()

    query = "SELECT * FROM rfid_logs WHERE 1=1"
    params = []

    if shop_id:
        query += " AND shop_id = ?"
        params.append(shop_id)
    if item:
        query += " AND item = ?"
        params.append(item)

    query += " ORDER BY id DESC LIMIT ?"
    params.append(limit)

    cur.execute(query, params)
    rows = [dict(row) for row in cur.fetchall()]
    conn.close()
    return {"rfid_logs": rows}


@app.get("/logs/environment")
def get_environment_logs(
    shop_id: Optional[str] = Query(None),
    item: Optional[str] = Query(None),
    limit: int = Query(50)
):
    conn = get_connection()
    cur = conn.cursor()

    query = "SELECT * FROM environment_logs WHERE 1=1"
    params = []

    if shop_id:
        query += " AND shop_id = ?"
        params.append(shop_id)
    if item:
        query += " AND item = ?"
        params.append(item)

    query += " ORDER BY id DESC LIMIT ?"
    params.append(limit)

    cur.execute(query, params)
    rows = [dict(row) for row in cur.fetchall()]
    conn.close()
    return {"environment_logs": rows}


@app.get("/logs/status")
def get_status_logs(
    shop_id: Optional[str] = Query(None),
    item: Optional[str] = Query(None),
    limit: int = Query(50)
):
    conn = get_connection()
    cur = conn.cursor()

    query = "SELECT * FROM status_logs WHERE 1=1"
    params = []

    if shop_id:
        query += " AND shop_id = ?"
        params.append(shop_id)
    if item:
        query += " AND item = ?"
        params.append(item)

    query += " ORDER BY id DESC LIMIT ?"
    params.append(limit)

    cur.execute(query, params)
    rows = [dict(row) for row in cur.fetchall()]
    conn.close()
    return {"status_logs": rows}


@app.get("/alerts")
def get_alerts(
    shop_id: Optional[str] = Query(None),
    item: Optional[str] = Query(None),
    limit: int = Query(50)
):
    conn = get_connection()
    cur = conn.cursor()

    query = "SELECT * FROM alerts WHERE 1=1"
    params = []

    if shop_id:
        query += " AND shop_id = ?"
        params.append(shop_id)
    if item:
        query += " AND item = ?"
        params.append(item)

    query += " ORDER BY id DESC LIMIT ?"
    params.append(limit)

    cur.execute(query, params)
    rows = [dict(row) for row in cur.fetchall()]
    conn.close()
    return {"alerts": rows}


@app.get("/anomalies")
def get_anomalies(limit: int = Query(50)):
    conn = get_connection()
    cur = conn.cursor()

    cur.execute("""
        SELECT *
        FROM alerts
        ORDER BY id DESC
        LIMIT ?
    """, (limit,))

    rows = [dict(row) for row in cur.fetchall()]
    conn.close()

    return {
        "anomalies": rows,
        "note": "Currently based on rule-triggered alerts. AI model can be added later."
    }


@app.get("/admin/summary")
def admin_summary():
    conn = get_connection()
    cur = conn.cursor()

    cur.execute("SELECT COUNT(DISTINCT shop_id) AS total_shops FROM weight_logs")
    total_shops = cur.fetchone()["total_shops"] or 0

    cur.execute("SELECT COUNT(*) AS total_alerts FROM alerts")
    total_alerts = cur.fetchone()["total_alerts"] or 0

    cur.execute("SELECT COUNT(*) AS locked_count FROM status_logs WHERE locked = 1")
    locked_count = cur.fetchone()["locked_count"] or 0

    cur.execute("""
        SELECT shop_id, item, weight_g, change_g, event, timestamp
        FROM weight_logs
        WHERE id IN (
            SELECT MAX(id)
            FROM weight_logs
            GROUP BY shop_id, item
        )
        ORDER BY shop_id, item
    """)
    stock_overview = fetch_all_dict(cur)

    low_stock_count = 0
    total_people_served = 0
    pending_refill_requests = 0

    enriched_stock = []

    for row in stock_overview:
        shop_id = row["shop_id"]
        item = row["item"]
        current_weight = row["weight_g"] or 0

        served_data = get_people_served_today(cur, shop_id, item)
        people_served_today = served_data["people_served_today"]
        total_distributed_today_g = served_data["total_distributed_today_g"]

        total_people_served += people_served_today

        days_left = round(current_weight / DEMO_DAILY_CONSUMPTION_G, 1) if current_weight else 0

        if current_weight < LOW_STOCK_THRESHOLD_G:
            low_stock_count += 1
            refill_status = "Refill Needed"
            pending_refill_requests += 1
        else:
            refill_status = "Stock Sufficient"

        enriched_stock.append({
            **row,
            "people_served_today": people_served_today,
            "total_distributed_today_g": total_distributed_today_g,
            "estimated_days_left": days_left,
            "refill_status": refill_status
        })

    cur.execute("""
        SELECT *
        FROM alerts
        ORDER BY id DESC
        LIMIT 10
    """)
    recent_alerts = fetch_all_dict(cur)

    cur.execute("""
        SELECT COUNT(DISTINCT shop_id) AS high_risk_shops
        FROM alerts
    """)
    high_risk_shops = cur.fetchone()["high_risk_shops"] or 0

    conn.close()

    return {
        "total_shops": total_shops,
        "total_alerts": total_alerts,
        "locked_count": locked_count,
        "low_stock_count": low_stock_count,
        "high_risk_shops": high_risk_shops,
        "total_people_served": total_people_served,
        "pending_refill_requests": pending_refill_requests,
        "stock_overview": enriched_stock,
        "recent_alerts": recent_alerts,
    }


@app.get("/admin/risk-analysis")
def admin_risk_analysis():
    conn = get_connection()
    cur = conn.cursor()

    cur.execute("""
        SELECT DISTINCT shop_id, item
        FROM (
            SELECT shop_id, item FROM weight_logs
            UNION
            SELECT shop_id, item FROM rfid_logs
            UNION
            SELECT shop_id, item FROM alerts
        )
        ORDER BY shop_id, item
    """)
    pairs = cur.fetchall()

    risk_results = []

    for row in pairs:
        shop_id = row["shop_id"]
        item = row["item"]

        risk_score = 0
        reasons = []

        cur.execute("""
            SELECT COUNT(*) AS large_drops
            FROM weight_logs
            WHERE shop_id = ?
              AND item = ?
              AND change_g > ?
        """, (shop_id, item, LARGE_DROP_THRESHOLD_G))
        large_drops = cur.fetchone()["large_drops"] or 0

        if large_drops > 0:
            risk_score += 40
            reasons.append("Large stock drop detected")

        cur.execute("""
            SELECT COUNT(*) AS denied_count
            FROM rfid_logs
            WHERE shop_id = ?
              AND item = ?
              AND access LIKE 'denied%'
        """, (shop_id, item))
        denied_count = cur.fetchone()["denied_count"] or 0

        if denied_count >= 3:
            risk_score += 30
            reasons.append("Repeated denied RFID attempts")

        served_data = get_people_served_today(cur, shop_id, item)
        people_served_today = served_data["people_served_today"]
        total_distributed_today_g = served_data["total_distributed_today_g"]

        cur.execute("""
            SELECT COUNT(*) AS granted_count
            FROM rfid_logs
            WHERE shop_id = ?
              AND item = ?
              AND access = 'granted'
              AND DATE(timestamp) = DATE('now')
        """, (shop_id, item))
        granted_count = cur.fetchone()["granted_count"] or 0

        mismatch = abs(people_served_today - granted_count)

        if mismatch >= 2:
            risk_score += 30
            reasons.append("People served estimate does not match RFID access count")

        cur.execute("""
            SELECT COUNT(*) AS alerts_count
            FROM alerts
            WHERE shop_id = ?
              AND item = ?
        """, (shop_id, item))
        alerts_count = cur.fetchone()["alerts_count"] or 0

        if alerts_count > 0:
            risk_score += min(alerts_count * 10, 30)
            reasons.append("Previous anomaly alerts found")

        latest_weight = get_latest_weight(cur, shop_id, item)
        latest_status = get_latest_status(cur, shop_id, item)

        if risk_score >= 70:
            risk_level = "High"
            recommended_action = "Inspect distributor and approve refill only after verification"
        elif risk_score >= 40:
            risk_level = "Medium"
            recommended_action = "Monitor closely and verify recent distribution"
        else:
            risk_level = "Low"
            recommended_action = "Normal monitoring"

        risk_results.append({
            "shop_id": shop_id,
            "item": item,
            "risk_score": min(risk_score, 100),
            "risk_level": risk_level,
            "reasons": reasons if reasons else ["No major suspicious pattern detected"],
            "recommended_action": recommended_action,
            "latest_weight": latest_weight,
            "latest_status": latest_status,
            "large_drops": large_drops,
            "denied_count": denied_count,
            "alerts_count": alerts_count,
            "people_served_today": people_served_today,
            "rfid_granted_today": granted_count,
            "people_rfid_mismatch": mismatch,
            "total_distributed_today_g": total_distributed_today_g,
        })

    conn.close()

    return {
        "risk_analysis": risk_results,
        "note": "Risk score is rule-based now. ML model can be trained later using collected logs."
    }


@app.get("/distributor/{shop_id}/summary")
def distributor_summary(shop_id: str):
    conn = get_connection()
    cur = conn.cursor()

    cur.execute("""
        SELECT DISTINCT item
        FROM (
            SELECT item FROM weight_logs WHERE shop_id = ?
            UNION
            SELECT item FROM environment_logs WHERE shop_id = ?
            UNION
            SELECT item FROM status_logs WHERE shop_id = ?
        )
        ORDER BY item
    """, (shop_id, shop_id, shop_id))

    items = [row["item"] for row in cur.fetchall()]

    item_summaries = []

    for item in items:
        latest_weight = get_latest_weight(cur, shop_id, item)
        latest_status = get_latest_status(cur, shop_id, item)

        cur.execute("""
            SELECT temperature_c, humidity_percent, timestamp
            FROM environment_logs
            WHERE shop_id = ? AND item = ?
            ORDER BY id DESC
            LIMIT 1
        """, (shop_id, item))
        latest_env = fetch_one_dict(cur)

        current_weight = latest_weight["weight_g"] if latest_weight else 0
        total_drop_today = get_total_weight_drop_today(cur, shop_id, item)

        people_served_today = estimate_people_served(total_drop_today)
        days_left = estimate_days_left(current_weight)

        if current_weight < 150:
            stock_status = "Low Stock"
        elif current_weight < 300:
            stock_status = "Moderate"
        else:
            stock_status = "Available"

        item_summaries.append({
            "item": item,
            "current_weight_g": current_weight,
            "stock_status": stock_status,
            "estimated_days_left": days_left,
            "people_served_today": people_served_today,
            "total_distributed_today_g": total_drop_today,
            "latest_status": latest_status,
            "latest_environment": latest_env,
        })

    cur.execute("""
        SELECT *
        FROM rfid_logs
        WHERE shop_id = ?
        ORDER BY id DESC
        LIMIT 10
    """, (shop_id,))
    recent_access_logs = fetch_all_dict(cur)

    cur.execute("""
        SELECT *
        FROM alerts
        WHERE shop_id = ?
        ORDER BY id DESC
        LIMIT 10
    """, (shop_id,))
    recent_alerts = fetch_all_dict(cur)

    conn.close()

    return {
        "shop_id": shop_id,
        "items": item_summaries,
        "recent_access_logs": recent_access_logs,
        "recent_alerts": recent_alerts,
    }

@app.get("/consumer/shops")
def consumer_shops():
    conn = get_connection()
    cur = conn.cursor()

    cur.execute("""
        SELECT DISTINCT shop_id
        FROM (
            SELECT shop_id FROM weight_logs
            UNION
            SELECT shop_id FROM environment_logs
            UNION
            SELECT shop_id FROM status_logs
        )
        ORDER BY shop_id
    """)

    shops = [row["shop_id"] for row in cur.fetchall()]
    conn.close()

    return {
        "shops": shops
    }

@app.get("/consumer/shops/{shop_id}/availability")
def consumer_shop_availability(shop_id: str):
    conn = get_connection()
    cur = conn.cursor()

    cur.execute("""
        SELECT DISTINCT item
        FROM (
            SELECT item FROM weight_logs WHERE shop_id = ?
            UNION
            SELECT item FROM status_logs WHERE shop_id = ?
        )
        ORDER BY item
    """, (shop_id, shop_id))

    items = [row["item"] for row in cur.fetchall()]
    availability = []

    for item in items:
        latest_weight = get_latest_weight(cur, shop_id, item)
        latest_status = get_latest_status(cur, shop_id, item)

        current_weight = latest_weight["weight_g"] if latest_weight else 0
        last_updated = latest_weight["timestamp"] if latest_weight else None

        if latest_status and latest_status.get("locked") == 1:
            distribution_status = "Temporarily Locked"
        else:
            distribution_status = "Open"

        if current_weight >= 150:
            available = True
            availability_text = "Available"
        elif current_weight > 0:
            available = True
            availability_text = "Low Stock"
        else:
            available = False
            availability_text = "Not Available"

        availability.append({
            "item": item,
            "available": available,
            "availability_text": availability_text,
            "approx_stock_g": current_weight,
            "distribution_status": distribution_status,
            "last_updated": last_updated,
        })

    conn.close()

    return {
        "shop_id": shop_id,
        "availability": availability,
        "message": "Public availability view for beneficiaries"
    }

