# IoT-Based Public Distribution System (PDS)

An IoT-enabled Public Distribution System that automates ration monitoring and distribution using **ESP32**, **RFID**, **HX711 Load Cell**, **MQTT**, **FastAPI**, and a **React Dashboard**. The system enables real-time stock monitoring, user authentication, and centralized management for fair price shops.

---

## Overview

The traditional Public Distribution System often faces issues such as manual stock management, delayed updates, and lack of transparency.

This project provides a smart solution by integrating IoT hardware with a web dashboard to:

- 📦 Monitor ration stock in real time
- 🪪 Authenticate users using RFID cards
- ⚖️ Measure distributed quantity using Load Cells
- 🌡️ Monitor temperature and humidity using DHT11
- 🛡️ Detect unfavorable storage conditions to prevent spoilage
- ☁️ Send live data using MQTT
- 📊 Display analytics and logs on a React Dashboard
  
---

# Demo Video

> **Watch the complete project demo here:**

**▶️ https://youtu.be/YOUR_VIDEO_LINK**

---

## Features

- RFID-based user authentication
- Real-time ration stock monitoring
- HX711 Load Cell integration
- ESP32-based IoT communication
- MQTT-based data transmission
- FastAPI backend
- SQLite database
- React Dashboard
- Live transaction logs
- Stock monitoring
- Detection of ration usage
- Responsive web interface

---

## System Architecture

```
                +------------------+
                |     RFID Card    |
                +--------+---------+
                         |
                         |
                  +------v------+
                  |    ESP32    |
                  +------+------+
                         |
          +--------------+--------------+
          |              |              |
          |              |              |
     HX711 Load Cell   DHT11         MQTT Broker
          |              |              |
          +-------------+---------------+
                        |
                  FastAPI Backend
                        |
                  SQLite Database
                        |
                  React Dashboard
```

---

## Hardware Components

| Component    | Description         |
|--------------|---------------------|
| ESP32        | Main Controller     |
| RFID RC522   | User Authentication |
| HX711        | Load Cell Amplifier |
| Load Cell    | Weight Measurement  |
| Servo Motor  | Gate/Valve Control  |
| DHT11        | 
| OLED Display | Status Display      |
| Jumper Wires | Connections         |
| Power Supply | 5V/9V               |

---

## Software Stack

### Frontend

- React
- Vite
- Tailwind CSS
- JavaScript

### Backend

- FastAPI
- Python
- SQLite

### IoT

- ESP32
- Arduino IDE
- MQTT

---

## Project Structure

```
PDS_PROJECT
│
├── backend
│   ├── api.py
│   ├── subscriber.py
│   ├── print_db.py
│   └── pds_data.db
│
├── esp32_code
│   └── pds
│       └── pds.ino
│
├── frontend
│   └── pds-dashboard
│       ├── src
│       ├── public
│       └── package.json
│
│
├── README.md
└── .gitignore
```

---

## Installation

### Clone Repository

```bash
git clone https://github.com/YOUR_USERNAME/PDS_PROJECT.git
```

---

### Backend

```bash
cd backend

pip install fastapi
pip install uvicorn
pip install paho-mqtt

python api.py
```

---

### Frontend

```bash
cd frontend/pds-dashboard

npm install

npm run dev
```

---

### ESP32

- Open `esp32_code/pds/pds.ino`
- Select the ESP32 board
- Upload the code using Arduino IDE

---

## Technologies Used

- ESP32
- Arduino IDE
- RFID RC522
- HX711
- MQTT
- FastAPI
- SQLite
- React
- Tailwind CSS
- Vite
- JavaScript
- Python

---

## Future Improvements

- Admin Login
- Consumer Mobile App
- QR Code Authentication
- SMS Notifications
- AI-based Demand Prediction
- Cloud Deployment
- Firebase Authentication
- Payment Integration
- Multi-shop Support

---

## Contributors

- Ashmita
- Ayushi Solani
- Afia Hayat
- Bhavna Prakash
- Amisha Kapar

---

## License

This project is developed for educational purposes.

---

## ⭐ Support

If you found this project useful,

⭐ Star this repository.

