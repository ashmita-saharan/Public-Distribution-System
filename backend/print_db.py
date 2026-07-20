import sqlite3

conn = sqlite3.connect("pds_data.db")
cur = conn.cursor()

for row in cur.execute("SELECT * FROM weight_logs"):
    print(row)

for row in cur.execute("SELECT * FROM rfid_logs"):
    print(row)

for row in cur.execute("SELECT * FROM alerts"):
    print(row)

conn.close()