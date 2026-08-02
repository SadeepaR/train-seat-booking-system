# Segment-Based Train Seat Booking System

A production-quality full-stack web application designed for segment-based seat reservations on the **Colombo Fort – Badulla Main Railway Line** in Sri Lanka.

![Tech Stack](https://img.shields.io/badge/Stack-React%20%7C%20Express%20%7C%20TypeScript%20%7C%20PostgreSQL%20%7C%20Tailwind-blue)
![Docker Compose](https://img.shields.io/badge/Docker-Compose-ready-green)

---

## Key Features

1. **Fully Configurable Data Model**: Stations, train schedules, coaches, and seat maps are dynamically defined in **PostgreSQL 16**. No hardcoded counts or layout constraints.
2. **Segment-Based Seat Booking**:
   - A single physical train seat can be booked by multiple passengers for non-overlapping journey segments.
   - Example: Passenger A books **Colombo Fort ➔ Kandy**, and Passenger B books **Kandy ➔ Badulla** for the exact same seat.
3. **Native Range Overlap Detection (`int4range` & `&&`)**:
   - Leverages PostgreSQL native `int4range` data types and the `&&` overlap operator to check segment availability.
4. **Database-Engine Double Booking Guarantee (`EXCLUDE USING gist`)**:
   - Enforces PostgreSQL range exclusion constraints (`EXCLUDE USING gist (train_id WITH =, seat_id WITH =, int4range(...) WITH &&)`).
   - If concurrent requests attempt to book overlapping legs on the same seat, PostgreSQL automatically rejects duplicates with error `23P01` (`exclusion_violation`), guaranteeing 100% race-condition protection at the database engine level.
5. **Distance-Based Fare Calculation Engine**:
   - Computes distance in kilometers and ticket price in LKR based on carriage class (1st Class Observation, 2nd Class Reserved, 3rd Class Reserved).
6. **Department Admin Dashboard**:
   - Features real-time KPI cards (Total Line Revenue, Active Tickets, Overall Occupancy Rate %, Segment Sharing Efficiency Bonus), station boarding/alighting traffic, and recent reservation lists.
7. **Interactive Glassmorphic Seat Map UI**:
   - Built with React, Vite, TypeScript, and Tailwind CSS.
   - Dynamic 2D seat map with real-time availability states and tooltips detailing segment conflicts.
8. **One-Command Container Deployment**:
   - Runs seamlessly via `docker compose up` with automated PostgreSQL 16 `btree_gist` schema initialization and data seeding.

---

## 🏗️ Architecture & Project Structure

```
.
├── backend/
│   ├── src/
│   │   ├── config/          # PostgreSQL pool connection & schema initializer (db.ts)
│   │   ├── controllers/     # Express route handlers (station, train, availability, booking, admin, seed)
│   │   ├── middlewares/     # Error handling & validation middleware
│   │   ├── routes/          # API route definitions
│   │   ├── services/        # Availability, Transactional Booking, Admin & Seed services
│   │   ├── types/           # Backend TypeScript interface definitions
│   │   ├── utils/           # Fare calculation & segment overlap utilities
│   │   └── server.ts        # Express server entry point
│   ├── Dockerfile
│   ├── package.json
│   └── tsconfig.json
├── frontend/
│   ├── src/
│   │   ├── components/      # Header, StationSelector, CoachTabs, SeatMap, BookingModal, BookingList, AdminDashboard, ToastBanner
│   │   ├── services/        # Axios API client
│   │   ├── types/           # Frontend TypeScript type definitions
│   │   ├── App.tsx          # Main React layout & state manager
│   │   ├── index.css        # Tailwind directives & glassmorphic styling
│   │   └── main.tsx         # React root mounting
│   ├── Dockerfile
│   ├── nginx.conf           # Production Nginx reverse proxy configuration
│   ├── package.json
│   └── vite.config.ts
├── docker-compose.yml       # Orchestrates PostgreSQL 16, Backend, and Frontend
└── README.md                # System documentation
```

---

## 📐 PostgreSQL Schema & Range Exclusion Constraint

```sql
CREATE EXTENSION IF NOT EXISTS btree_gist;

CREATE TABLE IF NOT EXISTS bookings (
  id SERIAL PRIMARY KEY,
  train_id INT NOT NULL REFERENCES trains(id) ON DELETE CASCADE,
  seat_id INT NOT NULL REFERENCES seats(id) ON DELETE CASCADE,
  passenger_name VARCHAR(255) NOT NULL,
  passenger_email VARCHAR(255) NOT NULL,
  origin_station_id INT NOT NULL REFERENCES stations(id),
  destination_station_id INT NOT NULL REFERENCES stations(id),
  origin_station_name VARCHAR(255) NOT NULL,
  destination_station_name VARCHAR(255) NOT NULL,
  from_sequence INT NOT NULL,
  to_sequence INT NOT NULL,
  distance_km INT NOT NULL DEFAULT 0,
  fare_amount INT NOT NULL DEFAULT 0,
  status VARCHAR(50) NOT NULL DEFAULT 'CONFIRMED',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  -- NATIVE DATABASE ENGINE DOUBLE-BOOKING PREVENTION
  EXCLUDE USING gist (
    train_id WITH =,
    seat_id WITH =,
    int4range(from_sequence, to_sequence, '[)') WITH &&
  ) WHERE (status = 'CONFIRMED')
);
```

---

## ⚡ Quick Start

### 1. Run via Docker Compose

```bash
docker compose up --build
```

Access the Web Application:
- **Passenger Seat Reservation & Seat Map**: [http://localhost:3000](http://localhost:3000)
- **Department Admin Dashboard**: Click **Department Admin** in top navbar
- **Backend API**: [http://localhost:5001/api](http://localhost:5001/api)
