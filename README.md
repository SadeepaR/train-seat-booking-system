# Segment-Based Train Seat Booking System

A production-quality full-stack web application built for segment-based train seat reservations on Sri Lanka's celebrated **Colombo Fort – Badulla Main Railway Line**.

The system enables a single reserved train seat to be booked independently for multiple non-overlapping journey legs (e.g. Passenger A travels *Colombo Fort ➔ Kandy*, and Passenger B travels *Kandy ➔ Badulla* on the exact same physical seat), maximizing train capacity utilization and offering distance-proportional ticket pricing.

---

# Problem Statement

Sri Lanka's Colombo Fort to Badulla railway line is a famous 292 km scenic mountain line. The train operates with both reserved and unreserved coaches. 

Under traditional railway ticketing systems, when a passenger books a reserved seat for a partial journey (e.g., Colombo Fort to Kandy), that seat sits empty for the remainder of the train's journey (Kandy to Badulla) because the legacy system cannot resell vacated seats mid-route. Consequently, the railway department inflates partial-leg reserved ticket prices to compensate for the wasted downstream capacity, while unreserved coaches suffer severe overcrowding.

### Solution

This application introduces a **Segment-Based Reservation Engine**. Journeys are represented as contiguous sequence intervals `[from_sequence, to_sequence)`. The system allows seats to be recycled immediately once vacated, enforces strict overlap detection to prevent double-bookings, charges passengers strictly for the distance traveled, and guarantees 100% concurrency safety at the database engine level using PostgreSQL range exclusion constraints.

---

# Features

### Core Features

- **Segment-Based Seat Reservation**: Single physical seats can be booked for non-overlapping journey legs on the same train trip.
- **Dynamic & Configurable Station Line**: Stations are dynamically defined with sequence ordering and cumulative railway distances (Colombo Fort = 0 km ➔ Badulla = 292 km).
- **Configurable Coaches & Seat Layouts**: Coaches (1st Class Observation, 2nd Class Reserved, 3rd Class Reserved) and seat grid dimensions (rows × columns) are stored dynamically without hardcoded counts.
- **Native Range Overlap Detection**: Uses integer range interval logic (`int4range`) to determine seat availability for requested segments.
- **Database Engine Concurrency Guarantee**: Prevents race-condition double-bookings using PostgreSQL GiST Exclusion Constraints (`EXCLUDE USING gist`).
- **Distance-Based Fare Calculation Engine**: Ticket pricing is computed dynamically based on exact travel distance ($\Delta \text{km}$), carriage class rates, and minimum base fares.
- **One-Command Container Deployment**: Complete environment setup using Docker Compose with automated database schema migration and data seeding.

### Additional & Extra Credit Features

- **Interactive 2D Seat Map Visualization**: Real-time seat layout grid showing seat status (Available vs. Booked for Segment), aisle spacing, class styling, and conflict tooltips.
- **Department Admin Dashboard**: Comprehensive operational analytics view detailing total line revenue (LKR), active tickets, overall segment occupancy rate (%), carriage class breakdown progress bars, and recent confirmed reservation tables.
- **Real-Time UI Conflict Alerting**: Instant user feedback with toast alert banners and status indicators when overlapping bookings are blocked with HTTP 409 Conflict.
- **Navigation View Switcher**: Clean header navigation tabs to switch between **Passenger View** and **Department Admin View**.

---

# Tech Stack

### Frontend
- **Framework**: React 18 with TypeScript
- **Build Tool**: Vite 5
- **Styling**: Vanilla CSS + Tailwind CSS (Custom Glassmorphism Design System)
- **Icons**: Lucide React (`lucide-react`)
- **HTTP Client**: Axios

### Backend
- **Runtime**: Node.js 20
- **Framework**: Express 4
- **Language**: TypeScript 5
- **Database Driver**: `pg` (node-postgres connection pool)

### Database
- **Engine**: PostgreSQL 16 Alpine
- **Extensions**: `btree_gist` (Enables GiST index constraints on integer range scalar types)

### Containerization & Infrastructure
- **Orchestration**: Docker Compose
- **Web Server (Frontend)**: Nginx Alpine (Production static bundle serving & reverse proxy)
- **Container Build**: Multi-stage Dockerfiles

---

# System Architecture

The application is structured as a containerized 3-tier system:

1. **Frontend Container (`train_frontend`)**: Nginx web server serving the compiled React single-page application on port `3000`. Communicates with the backend over REST HTTP.
2. **Backend Container (`train_backend`)**: Node.js + Express REST API running on port `5001`. Handles station queries, availability calculations, transaction processing, admin aggregations, and error handling.
3. **Database Container (`train_postgres`)**: PostgreSQL 16 database running on internal container port `5432` (mapped to host port `5433`). Enforces schema constraints and processes range overlap queries.

```mermaid
graph TD
    Client[Browser / User] -->|HTTP :3000| Frontend[Frontend Container: Nginx + React SPA]
    Frontend -->|REST API :5001| Backend[Backend Container: Express + Node.js API]
    Backend -->|SQL / pg Pool :5432| DB[(PostgreSQL 16 Engine)]
    
    subgraph PostgreSQL Database
        DB --> Extensions[btree_gist Extension]
        DB --> Constraints[GiST Exclusion Constraint: EXCLUDE USING gist]
        DB --> Tables[stations, coaches, seats, trains, bookings]
    end
```

---

# Project Structure

```
.
├── backend/
│   ├── src/
│   │   ├── config/
│   │   │   └── db.ts             # PostgreSQL pool connection & initPostgresSchema DDL
│   │   ├── controllers/          # Express route controllers
│   │   │   ├── admin.controller.ts
│   │   │   ├── availability.controller.ts
│   │   │   ├── booking.controller.ts
│   │   │   ├── seed.controller.ts
│   │   │   ├── station.controller.ts
│   │   │   └── train.controller.ts
│   │   ├── middlewares/
│   │   │   └── errorHandler.ts   # Centralized Express error handler (HTTP 409, 400, 500)
│   │   ├── routes/
│   │   │   └── api.routes.ts     # API router definitions
│   │   ├── services/             # Core business logic services
│   │   │   ├── admin.service.ts
│   │   │   ├── availability.service.ts
│   │   │   ├── booking.service.ts
│   │   │   └── seed.service.ts
│   │   ├── types/
│   │   │   └── index.ts          # TypeScript interfaces & DTOs
│   │   ├── utils/
│   │   │   ├── errors.ts         # Custom error classes (BookingConflictError, ValidationError)
│   │   │   ├── fare.ts           # Distance & fare calculation logic
│   │   │   └── segment.ts        # Segment sequence validation utilities
│   │   └── server.ts             # Express server entry point & startup listener
│   ├── Dockerfile
│   ├── package.json
│   └── tsconfig.json
├── frontend/
│   ├── src/
│   │   ├── components/           # React UI components
│   │   │   ├── AdminDashboard.tsx# Department admin view & metrics
│   │   │   ├── BookingModal.tsx  # Reservation confirmation modal
│   │   │   ├── CoachTabs.tsx     # Carriage tab selector
│   │   │   ├── Header.tsx         # Navbar logo & view switcher
│   │   │   ├── SeatLegend.tsx    # Seat map status legend
│   │   │   ├── SeatMap.tsx       # Interactive 2D seat map grid
│   │   │   ├── StationSelector.tsx# Origin/Destination search bar
│   │   │   └── ToastBanner.tsx   # Toast notification alerts
│   │   ├── services/
│   │   │   └── api.ts            # Axios HTTP client
│   │   ├── types/
│   │   │   └── index.ts          # Frontend TypeScript interface definitions
│   │   ├── App.tsx               # Main application container & view manager
│   │   ├── index.css             # Tailwind CSS directives & glassmorphic styling
│   │   └── main.tsx              # React DOM mounting entry point
│   ├── Dockerfile
│   ├── nginx.conf                # Nginx production configuration
│   ├── package.json
│   ├── tailwind.config.js
│   ├── postcss.config.js
│   └── vite.config.ts
├── docker-compose.yml            # Multi-container orchestration specification
└── README.md                     # System documentation
```

---

# Database Design

The database schema utilizes 5 tables designed around relational integrity and integer range constraints.

```mermaid
erDiagram
    STATIONS {
        int id PK
        string name UK
        string code UK
        int sequence UK
        int distance_km
        timestamp created_at
    }
    COACHES {
        int id PK
        string name
        string class_type
        int total_seats
        int layout_rows
        int layout_cols
        timestamp created_at
    }
    SEATS {
        int id PK
        int coach_id FK
        string seat_number
        int row_num
        int col_num
        timestamp created_at
    }
    TRAINS {
        int id PK
        string train_number UK
        string name
        jsonb route_stations
        timestamp created_at
    }
    BOOKINGS {
        int id PK
        int train_id FK
        int seat_id FK
        string passenger_name
        string passenger_email
        int origin_station_id FK
        int destination_station_id FK
        string origin_station_name
        string destination_station_name
        int from_sequence
        int to_sequence
        int distance_km
        int fare_amount
        string status
        timestamp created_at
    }

    COACHES ||--|{ SEATS : "contains"
    TRAINS ||--|{ BOOKINGS : "has"
    SEATS ||--|{ BOOKINGS : "reserved_in"
    STATIONS ||--|{ BOOKINGS : "originates/terminates"
```

### Table Specifications & Constraints

1. **`stations`**: Stores railway station stops along the route. `sequence` defines the topological order ($0, 1, 2, \dots, N$), and `distance_km` stores the cumulative track distance from Colombo Fort ($0\text{ km}$).
2. **`coaches`**: Stores carriage details, including `class_type` (`FIRST`, `SECOND`, `THIRD`), `total_seats`, `layout_rows`, and `layout_cols`.
3. **`seats`**: Stores physical seats linked to a coach (`coach_id`). Enforces `UNIQUE(coach_id, seat_number)`.
4. **`trains`**: Stores train schedules. `route_stations` is a `JSONB` array containing ordered station references, arrival times, and departure times.
5. **`bookings`**: Stores confirmed reservations. Uses integer sequence bounds `from_sequence` and `to_sequence`.
   - **Range Exclusion Constraint**:
     ```sql
     EXCLUDE USING gist (
       train_id WITH =,
       seat_id WITH =,
       int4range(from_sequence, to_sequence, '[)') WITH &&
     ) WHERE (status = 'CONFIRMED')
     ```

---

# Core Design Decisions

### 1. Database Selection: PostgreSQL 16 with GiST Range Exclusion Constraints
While MongoDB and MySQL were evaluated, **PostgreSQL** was chosen because of its native `int4range` data type and `GiST Exclusion Constraints`. 

Instead of relying solely on complex application-level lock orchestration, PostgreSQL's engine natively enforces that no two rows in `bookings` can share the same `(train_id, seat_id)` while having overlapping `int4range(from_sequence, to_sequence, '[)')` intervals. If 1,000 concurrent requests hit the database for the exact same seat on overlapping legs, PostgreSQL permits the first insert and instantly rejects the remaining 999 with error `23P01` (`exclusion_violation`).

### 2. Segment-Based Occupancy Model: Half-Open Intervals `[from_sequence, to_sequence)`
A train route is represented as an ordered sequence of station indices $0, 1, 2, \dots, N$. Journey legs are modeled as half-open sequence intervals `[from_sequence, to_sequence)`:
- Passenger A travels *Colombo Fort ➔ Kandy* (`[0, 6)`).
- Passenger B travels *Kandy ➔ Badulla* (`[6, 12)`).

Because the intervals are half-open, Passenger A vacates at sequence `6` (Kandy), and Passenger B boards at sequence `6` (Kandy). The interval bounds `[0, 6)` and `[6, 12)` do not overlap ($\max(0, 6) < \min(6, 12)$ is `6 < 6` $\rightarrow$ `FALSE`), allowing the exact same seat to be booked by both passengers.

### 3. Configurable Stations, Coaches, and Seats
None of the station counts, coach counts, or seat grid layouts are hardcoded in the source code:
- **Stations**: Extensible by inserting new records into `stations`.
- **Coaches**: Extensible by adding rows to `coaches`.
- **Seats & 2D Grid**: `SeatMap.tsx` dynamically groups seats by `row_num` and `col_num` based on the coach's `layout_rows` and `layout_cols` fetched from the API.

### 4. Seat Availability Calculation Algorithm
To determine if a seat is available for a requested segment `[req_from, req_to)` on a train:
1. Query `bookings` where `train_id = $1` AND `status = 'CONFIRMED'` AND `int4range(from_sequence, to_sequence, '[)') && int4range(req_from, req_to, '[)')`.
2. If the query returns zero rows, the seat is **Available**.
3. If rows are returned, the seat is **Booked**, and the conflicting booking details are attached to the seat DTO so the frontend can display tooltips explaining why the seat is unavailable for that segment.

### 5. Distance-Based Fare Calculation Engine
Fares are calculated dynamically based on track distance and carriage class:

$$\text{Distance (km)} = \left| \text{Destination.distance\_km} - \text{Origin.distance\_km} \right|$$

$$\text{Fare (LKR)} = \max \Big( \text{Distance (km)} \times \text{Class Rate per km}, \; \text{Minimum Base Fare} \Big)$$

- **1st Class Observation**: LKR 12.00 / km (Minimum: LKR 300)
- **2nd Class Reserved**: LKR 8.00 / km (Minimum: LKR 200)
- **3rd Class Reserved**: LKR 5.00 / km (Minimum: LKR 100)

---

# Alternatives Considered

### 1. Database Engine: PostgreSQL vs. MongoDB vs. Redis
- **Alternative 1: MongoDB**: Initially considered for JSON document embedding. However, preventing double-bookings required multi-document MongoDB transactions (`session.startTransaction()`) and manual application overlap queries.
- **Alternative 2: Redis In-Memory Locks**: Considered setting Redis keys with TTLs per seat segment. Rejected as a primary store because Redis is volatile and requires double-writing to a persistent database.
- **Chosen Solution: PostgreSQL 16**: Selected because PostgreSQL natively enforces `EXCLUDE USING gist` constraints at the database engine level, guaranteeing zero double-bookings under concurrent load with C-speed database execution.

### 2. Overlap Checking: Application Code vs. Database Constraint
- **Alternative: Application-level Lock (`SELECT FOR UPDATE`)**: Querying existing bookings in application code and wrapping the logic in a transaction.
- **Chosen Solution: PostgreSQL `EXCLUDE USING gist` Constraint**: The database engine itself rejects overlapping intervals via error code `23P01`. This eliminates race conditions even if multiple backend server instances scale horizontally.

---

# Challenges Faced

### 1. Enforcing Native Range Constraints in PostgreSQL
- **Challenge**: Standard PostgreSQL unique indexes cannot evaluate range overlaps (`&&`) across scalar columns like `from_sequence` and `to_sequence`.
- **Solution**: Installed the `btree_gist` PostgreSQL extension during container initialization (`CREATE EXTENSION IF NOT EXISTS btree_gist;`), which enables GiST indexes to combine equality checks on `train_id` and `seat_id` with range overlap checks on `int4range(from_sequence, to_sequence, '[)')`.

### 2. Dynamic 2D Seat Map Layout Rendering
- **Challenge**: Rendering seats for coaches with different physical grid dimensions without breaking UI responsiveness.
- **Solution**: Implemented dynamic grid row mapping in `SeatMap.tsx`. The component fetches `layout_rows` and `layout_cols` from the coach model and builds rows programmatically using flexbox/grid containers.

### 3. Docker Port Binding Conflicts on Local Machines
- **Challenge**: Local development machines frequently run background PostgreSQL instances bound to host port `5432`, causing `bind: address already in use` errors during `docker compose up`.
- **Solution**: Mapped the PostgreSQL container service to host port `5433:5432` while keeping internal Docker network communication on `postgres:5432`.

---

# API Overview

All API endpoints are prefixed with `/api`.

| Method | Endpoint | Description | Query / Body Parameters |
|---|---|---|---|
| `GET` | `/api/stations` | Retrieves all stations ordered by sequence | None |
| `GET` | `/api/trains` | Retrieves all train schedules & route stops | None |
| `GET` | `/api/availability` | Computes seat availability for a journey segment | `trainId`, `originStationId`, `destinationStationId` |
| `POST` | `/api/bookings` | Creates a confirmed seat reservation | `{ trainId, seatId, passengerName, passengerEmail, originStationId, destinationStationId }` |
| `GET` | `/api/bookings` | Retrieves existing confirmed reservations | `trainId` (optional) |
| `GET` | `/api/admin/stats` | Aggregates revenue, occupancy %, and class metrics | None |
| `POST` | `/api/seed` | Resets and seeds default Colombo Fort – Badulla data | None |
| `GET` | `/health` | Health check endpoint | None |

---

# Running the Project

### Prerequisites
- [Docker Desktop](https://www.docker.com/products/docker-desktop/) (Docker Engine `20.10+` and Docker Compose `v2+`) installed and running.

---

### Step 1: Run with Docker Compose (Recommended One-Shot Setup)

Run the following command in the root directory:

```bash
docker compose up --build
```

Docker Compose will automatically:
1. Start the **PostgreSQL 16** database container (`train_postgres`).
2. Run database initialization, creating extensions (`btree_gist`) and schema tables.
3. Start the **Express Backend** (`train_backend`), which auto-seeds the Colombo Fort – Badulla line stations, coaches, seats, and schedule if empty.
4. Start the **React + Nginx Frontend** (`train_frontend`).

#### Access URLs:
- **Passenger Reservation UI**: [http://localhost:3000](http://localhost:3000)
- **Department Admin Dashboard**: Click **Department Admin** tab on [http://localhost:3000](http://localhost:3000)
- **Backend API Base**: [http://localhost:5001/api](http://localhost:5001/api)

---

### Step 2: Running Locally (Development Mode)

#### Backend Setup:
```bash
cd backend
npm install
# Set DATABASE_URL in .env or run against local PostgreSQL
npm run dev
```

#### Frontend Setup:
```bash
cd frontend
npm install
npm run dev
```
*(App available at `http://localhost:5173` in Vite dev mode)*.

---

### Environment Variables

#### Backend (`backend/.env` or Docker Compose):
```env
PORT=5001
DATABASE_URL=postgres://postgres:postgres@postgres:5432/train_booking
```

#### Frontend (`frontend/.env` or Docker Compose):
```env
VITE_API_URL=http://localhost:5001
```

---

# Screenshots

*(Placeholders for repository documentation screenshots)*

- **Passenger Seat Map View**: `![Passenger View](./docs/screenshots/passenger_view.png)`
- **Department Admin Dashboard**: `![Admin Dashboard](./docs/screenshots/admin_dashboard.png)`
- **Booking Confirmation Modal**: `![Booking Modal](./docs/screenshots/booking_modal.png)`

---

# Extra Credit Implemented

### 1. Interactive 2D Seat Map Visualization
- **Problem**: Text-only seat selection lacks visual clarity for carriage layout and class positioning.
- **Implementation**: Built `SeatMap.tsx`, which renders a visual 2D grid complete with seat class styling, aisle dividers, driver cabin indicators, and real-time hover tooltips displaying conflicting leg information.

### 2. Department Admin View
- **Problem**: Railway management lacks visibility into line revenue performance and capacity utilization.
- **Implementation**: Built `AdminDashboard.tsx` exposing `GET /api/admin/stats`. Renders real-time KPI cards (Total Revenue in LKR, Active Bookings, Overall Occupancy Rate %, Segment Re-selling Revenue Bonus) and carriage class distribution progress bars.

### 3. Distance-Based Fare Calculation
- **Problem**: Flat fares penalize short-distance travelers on reserved seats.
- **Implementation**: Implemented `calculateDistanceAndFare()` in `backend/src/utils/fare.ts` to charge passengers strictly based on kilometers traveled ($\Delta \text{km}$) multiplied by class rates with base minimum fares.

### 4. UI Booking Conflict Handling
- **Problem**: Concurrent booking collisions can leave users confused if errors are unhandled.
- **Implementation**: `ToastBanner.tsx` renders immediate warning banners upon HTTP 409 Conflict responses, while seat tooltips explain segment overlap bounds.

---

# Testing

### Verification Methods Executed:
1. **Automated TypeScript Build Checks**:
   - Backend: `npm run build` in `backend/` executed with **0 TypeScript compilation errors**.
   - Frontend: `npm run build` in `frontend/` executed with **0 TypeScript compilation errors** (Vite build completed in `867ms`).
2. **Container Integration Verification**:
   - Verified single-command container startup via `docker compose up --build`.
   - Verified PostgreSQL `btree_gist` schema migration and automatic database seeding.
3. **Concurrency Collision Verification**:
   - Verified that attempts to book overlapping segments on the exact same seat correctly trigger PostgreSQL constraint `23P01` and return HTTP 409 Conflict.

*Note: Formal automated unit test suites (e.g. Jest / Supertest) were omitted to prioritize full-stack end-to-end integration and containerization within time constraints.*

---

# Assumptions

1. **Sequential Station Direction**: Trains travel in a fixed direction from origin to destination along increasing sequence numbers ($0 \rightarrow 1 \rightarrow 2 \dots$).
2. **Single-Day Journey Schedule**: The train schedule operates on a recurring daily timetable where bookings apply to the scheduled trip.
3. **Seat Uniqueness**: Seats are uniquely identified by their parent carriage (`coach_id`) and seat number (e.g. `1A`, `2B`).

---

# Trade-offs

1. **In-Memory Seed Execution vs. Migration Tool**: Used an inline TypeScript schema initializer (`initPostgresSchema()`) on backend startup rather than a standalone CLI migration tool (like Flyway or Prisma Migrate) to ensure one-command Docker execution without external dependencies.
2. **Optimistic Exclusion vs. Redis TTL Locking**: Relied on PostgreSQL native exclusion constraints rather than a two-phase Redis checkout reservation lock. This simplified infrastructure requirements while maintaining 100% concurrency protection.

---

# Conclusion

This Segment-Based Train Seat Booking System provides a robust, production-grade solution for Sri Lanka Railways' Colombo Fort – Badulla main line. By combining flexible sequence interval math with PostgreSQL GiST Exclusion Constraints, the application solves capacity under-utilization, prevents double-bookings under concurrent load, and delivers a modern glassmorphic user experience for both passengers and railway administrators.
