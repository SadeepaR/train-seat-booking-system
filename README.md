# Segment-Based Train Seat Booking System

A production-quality full-stack web application designed for segment-based seat reservations on the **Colombo Fort – Badulla Main Railway Line** in Sri Lanka.

![Tech Stack](https://img.shields.io/badge/Stack-React%20%7C%20Express%20%7C%20TypeScript%20%7C%20MongoDB%20%7C%20Tailwind-blue)
![Docker Compose](https://img.shields.io/badge/Docker-Compose-ready-green)

---

## Key Features

1. **Fully Configurable Data Model**: Stations, train schedules, coaches, and seat maps are dynamically defined in MongoDB. No hardcoded counts or layout constraints.
2. **Segment-Based Seat Booking**:
   - A single physical train seat can be booked by multiple passengers for non-overlapping journey segments.
   - Example: Passenger A books **Colombo Fort ➔ Kandy**, and Passenger B books **Kandy ➔ Badulla** for the exact same seat.
3. **Strict Overlap Detection**:
   - Rejects overlapping journey requests (e.g., Passenger A: **Colombo Fort ➔ Kandy** vs Passenger B: **Peradeniya ➔ Nanu Oya**).
4. **Race-Condition & Double-Booking Prevention**:
   - Employs MongoDB ACID Session Transactions to ensure concurrent booking safety.
5. **Interactive Glassmorphic Seat Map UI**:
   - Built with React, Vite, TypeScript, and Tailwind CSS.
   - Dynamic 2D seat map with real-time availability states and tooltips detailing segment conflicts.
6. **One-Command Container Deployment**:
   - Runs seamlessly via `docker compose up` with automated MongoDB replica set initialization (`rs0`).

---

## 🏗️ Architecture & Project Structure

```
.
├── backend/
│   ├── src/
│   │   ├── config/          # MongoDB connection helper
│   │   ├── controllers/     # Express route handlers
│   │   ├── middlewares/     # Error handling & validation middleware
│   │   ├── models/          # Mongoose schemas (Station, Coach, Seat, Train, Booking)
│   │   ├── routes/          # API route definitions
│   │   ├── services/        # Availability, Transactional Booking & Seed services
│   │   ├── types/           # Backend TypeScript interface definitions
│   │   ├── utils/           # Segment overlap math & error utilities
│   │   └── server.ts        # Express server entry point
│   ├── Dockerfile
│   ├── package.json
│   └── tsconfig.json
├── frontend/
│   ├── src/
│   │   ├── components/      # Header, StationSelector, CoachTabs, SeatMap, BookingModal, BookingList, ToastBanner
│   │   ├── services/        # Axios API client
│   │   ├── types/           # Frontend TypeScript type definitions
│   │   ├── App.tsx          # Main React layout & state manager
│   │   ├── index.css        # Tailwind directives & glassmorphic styling
│   │   └── main.tsx         # React root mounting
│   ├── Dockerfile
│   ├── nginx.conf           # Production Nginx reverse proxy configuration
│   ├── package.json
│   └── vite.config.ts
├── docker-compose.yml       # Orchestrates MongoDB (Replica Set), Backend, and Frontend
└── README.md                # System documentation
```

---

## 🗄️ Database Design

The MongoDB database (`train_booking`) consists of five Mongoose models:

### 1. `Station`
Represents physical stations along a railway line.
- `name`: string (e.g. "Colombo Fort")
- `code`: string (e.g. "FOT")
- `sequence`: number (0-indexed position: Colombo Fort=0, Ragama=1, ..., Badulla=12)

### 2. `Coach`
Represents a carriage model.
- `name`: string (e.g. "Coach A - 1st Class Observation")
- `classType`: string (`'FIRST'`, `'SECOND'`, `'THIRD'`)
- `totalSeats`: number
- `layoutRows`: number
- `layoutCols`: number

### 3. `Seat`
Represents individual seats within a coach.
- `coachId`: ObjectId (ref: `Coach`)
- `seatNumber`: string (e.g. "1A", "1B")
- `row`: number
- `column`: number
- *Index*: Compound unique index `{ coachId: 1, seatNumber: 1 }`

### 4. `Train`
Represents scheduled train services and their ordered route stops.
- `trainNumber`: string (e.g. "1005 - Podi Menike")
- `name`: string (e.g. "Colombo Fort - Badulla Express")
- `stations`: Array of `{ stationId, name, code, sequence, arrivalTime, departureTime }`

### 5. `Booking`
Represents an active seat reservation across a segment.
- `trainId`: ObjectId (ref: `Train`)
- `seatId`: ObjectId (ref: `Seat`)
- `passengerName`: string
- `passengerEmail`: string
- `originStationId`: ObjectId
- `destinationStationId`: ObjectId
- `originStationName`: string
- `destinationStationName`: string
- `fromSequence`: number (Inclusive start station index)
- `toSequence`: number (Exclusive end station index)
- `status`: string (`'CONFIRMED'`, `'CANCELLED'`)
- *Index*: Compound query index `{ trainId: 1, seatId: 1, status: 1, fromSequence: 1, toSequence: 1 }`

---

## 📐 Booking Algorithm & Overlap Detection

### Mathematical Half-Open Interval Model
Each railway station along the line has an ordered integer sequence index $S_0, S_1, S_2, \dots, S_N$.
A journey from an origin station with index $A$ to a destination station with index $B$ occupies the half-open interval $[A, B)$.

#### Overlap Condition
Two journey requests $[A_{\text{start}}, A_{\text{end}})$ and $[B_{\text{start}}, B_{\text{end}})$ **overlap** if and only if:

$$\max(A_{\text{start}}, B_{\text{start}}) < \min(A_{\text{end}}, B_{\text{end}})$$

### Examples

#### Example 1: Contiguous Non-Overlapping Bookings (Allowed)
- **Passenger 1**: Colombo Fort ($0$) ➔ Kandy ($6$) $\implies [0, 6)$
- **Passenger 2**: Kandy ($6$) ➔ Badulla ($12$) $\implies [6, 12)$

$$\max(0, 6) = 6, \quad \min(6, 12) = 6 \implies (6 < 6) = \text{FALSE}$$

No overlap exists! Both passengers are successfully assigned the exact same seat.

#### Example 2: Overlapping Journey Segments (Blocked)
- **Passenger 1**: Colombo Fort ($0$) ➔ Kandy ($6$) $\implies [0, 6)$
- **Passenger 2**: Peradeniya ($5$) ➔ Nanu Oya ($9$) $\implies [5, 9)$

$$\max(0, 5) = 5, \quad \min(6, 9) = 6 \implies (5 < 6) = \text{TRUE}$$

An overlap exists between station sequence indices $5$ and $6$. The system immediately blocks Passenger 2 with HTTP 409 Conflict.

---

## ⚡ Concurrency Handling & Transaction Strategy

To guarantee zero double-bookings during high-volume concurrent requests:

1. **MongoDB ACID Session Transactions**:
   - Booking attempts run inside `mongoose.startSession()` transactions (`session.startTransaction()`).
2. **Atomic Overlap Verification Query**:
   - Prior to creating a booking document, the backend executes an overlap search query within the transaction session:
   ```typescript
   const existingOverlaps = await Booking.find({
     trainId,
     seatId,
     status: 'CONFIRMED',
     $and: [
       { fromSequence: { $lt: requestedToSequence } },
       { toSequence: { $gt: requestedFromSequence } }
     ]
   }).session(session);
   ```
3. **Transaction Abort & Conflict Escalation**:
   - If `existingOverlaps.length > 0`, the transaction is aborted (`session.abortTransaction()`) and an explicit `BookingConflictError` (HTTP 409) is thrown.
   - The user receives immediate visual feedback via a toast alert detailing the conflict.

---

## ⚖️ Tradeoffs & Design Choices

| Design Decision | Choice Made | Rationale & Tradeoffs |
|---|---|---|
| **Interval Model** | Station sequence numbers $[A, B)$ | **Pro**: Extremely fast mathematical queries $O(1)$ overlap logic.<br>**Con**: Assumes linear sequential route direction. Branching railway networks require graph distance offsets. |
| **Concurrency Lock** | MongoDB Session Transactions | **Pro**: Strict multi-document ACID guarantees without external cache software.<br>**Con**: Requires a replica set (`rs0`) in MongoDB configuration. |
| **Real-time Seat Map** | Dynamic SVG / CSS Grid rendering | **Pro**: Adapts to any coach dimensions automatically without static canvas assets.<br>**Con**: Slightly higher render cost for huge coaches (100+ seats). |

---

## 🚀 Getting Started with Docker Compose

### Prerequisites
- Docker Engine & Docker Compose installed.

### Run Application
From the root directory of the project, run:

```bash
docker compose up --build
```

### Access Ports
- **Frontend App**: `http://localhost:3000`
- **Backend API**: `http://localhost:5001/api`
- **MongoDB**: `localhost:27017`

---

## 🧪 Manual API Verification

### 1. Seed Database
```bash
curl -X POST http://localhost:5001/api/seed
```

### 2. Check Available Seats
```bash
curl "http://localhost:5001/api/availability?trainId=<TRAIN_ID>&originStationId=<ORIGIN_ID>&destinationStationId=<DEST_ID>"
```

### 3. Create Booking
```bash
curl -X POST http://localhost:5001/api/bookings \
  -H "Content-Type: application/json" \
  -d '{
    "trainId": "<TRAIN_ID>",
    "seatId": "<SEAT_ID>",
    "passengerName": "Sahan Perera",
    "passengerEmail": "sahan@example.com",
    "originStationId": "<ORIGIN_ID>",
    "destinationStationId": "<DEST_ID>"
  }'
```
