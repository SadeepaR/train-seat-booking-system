# Segment-Based Train Seat Booking System

A full-stack booking system for Sri Lanka's **Colombo Fort – Badulla** railway line that enables a single reserved seat to be independently booked by different passengers for non-overlapping legs of the same journey. The system uses PostgreSQL's native range exclusion constraints to guarantee atomically correct, race-condition-free segment bookings at the database engine level.

---

## Problem Statement

Traditional railway booking systems allocate a seat for the entire origin-to-terminus journey. On a 292 km line with 13 stops, a passenger traveling only the first two stops locks out every subsequent passenger from that seat for the remaining 11 stops — an enormous waste of capacity.

This project solves the **segment-based seat sharing problem**: the same physical seat can be sold to multiple passengers for different, non-overlapping legs of the journey. Passenger A books Seat 1A from Colombo Fort → Kandy, and Passenger B books the same Seat 1A from Kandy → Badulla. Both bookings are valid because their journey segments do not overlap.

The core technical challenge is enforcing this non-overlap invariant correctly under concurrent booking attempts, where two users might try to book the same seat for overlapping segments at the same instant.

---

## Features

### Core Features

- **Segment-based seat booking** — A single seat can be booked independently for multiple non-overlapping journey legs
- **Interactive 2D seat map** — Visual carriage layout with seats grouped by row, separated by a central aisle, color-coded by availability status
- **Real-time seat availability** — Seats are evaluated per journey segment; a seat booked for Colombo → Kandy still appears available for Kandy → Badulla
- **Overlap conflict visualization** — Occupied seats display tooltip details showing exactly which segments are conflicting
- **Multi-coach support** — Three carriage classes (1st Class Observation, 2nd Class Reserved, 3rd Class Reserved) with tabbed navigation
- **Journey segment selector** — Dropdown-based origin/destination station picker with directional validation (destination must be downstream of origin)
- **Booking confirmation modal** — Passenger name/email form with journey summary, calculated distance, and fare before confirming
- **Distance-based fare calculation** — Fares computed from real cumulative station distances using per-class rate multipliers
- **Database-level concurrency protection** — PostgreSQL GiST exclusion constraint prevents overlapping bookings atomically, even under concurrent requests
- **409 Conflict error handling** — Overlapping booking attempts return HTTP 409 with a descriptive error message displayed in the UI
- **Configurable train layout** — Coaches, seats per coach, and stations are database-driven and configurable via the seed service
- **Database reset/re-seed** — One-click button to truncate all tables and re-seed with default Colombo Fort – Badulla data

### Additional Features

- **Department Admin Dashboard** — Analytics view with KPI cards (total revenue, active bookings, occupancy rate, segment re-selling count), class-level occupancy breakdown with progress bars, and a recent reservations table
- **Dual-view UI** — Toggle between "Passenger View" and "Department Admin" via header tabs
- **Toast notification system** — Success/error banners with auto-dismiss for booking confirmations and conflict alerts
- **Multiple train schedules** — Two seeded train services (Podi Menike and Denuwara Menike) with selectable dropdown
- **Health check endpoint** — `GET /health` for container orchestration readiness probes
- **Auto-seed on first boot** — Backend automatically seeds the database if the stations table is empty, enabling zero-configuration startup

---

## Tech Stack

| Layer | Technology | Version | Purpose |
|-------|-----------|---------|---------|
| **Frontend** | React | 18.3 | UI component library |
| **Frontend** | TypeScript | 5.4 | Type safety |
| **Frontend** | Vite | 5.2 | Build tool and dev server |
| **Frontend** | Tailwind CSS | 3.4 | Utility-first styling |
| **Frontend** | Lucide React | 0.395 | Icon library |
| **Frontend** | Axios | 1.7 | HTTP client |
| **Backend** | Node.js | 20 (Alpine) | Runtime |
| **Backend** | Express | 4.19 | HTTP server framework |
| **Backend** | TypeScript | 5.4 | Type safety |
| **Backend** | pg (node-postgres) | 8.12 | PostgreSQL client driver |
| **Database** | PostgreSQL | 16 (Alpine) | Relational database with `btree_gist` extension |
| **Infrastructure** | Docker Compose | — | Multi-container orchestration |
| **Infrastructure** | Nginx | Alpine | Frontend static file server and API reverse proxy |

---

## System Architecture

The application follows a three-tier containerized architecture orchestrated by Docker Compose.

```mermaid
graph LR
    Browser["Browser :3000"]
    Nginx["Nginx (Frontend Container)"]
    Express["Express API (Backend Container)"]
    PG["PostgreSQL 16 (Database Container)"]

    Browser -->|HTTP| Nginx
    Nginx -->|Static Files| Browser
    Nginx -->|/api proxy| Express
    Express -->|SQL via pg Pool| PG

    style Browser fill:#1e293b,stroke:#3b82f6,color:#f8fafc
    style Nginx fill:#1e293b,stroke:#06b6d4,color:#f8fafc
    style Express fill:#1e293b,stroke:#10b981,color:#f8fafc
    style PG fill:#1e293b,stroke:#8b5cf6,color:#f8fafc
```

**Request flow:**

1. The browser loads the React SPA from Nginx on port 3000.
2. All API calls are made to `/api/*`, which Nginx reverse-proxies to the Express backend on port 5001.
3. The Express backend communicates with PostgreSQL using the `pg` connection pool via parameterized queries.
4. PostgreSQL enforces the booking non-overlap invariant at the database engine level using a GiST exclusion constraint.

**Container communication:**

- `frontend` (Nginx) → `backend:5001` via Docker internal network
- `backend` → `postgres:5432` via Docker internal network
- Host ports: `3000` (frontend), `5001` (backend), `5433` (PostgreSQL, mapped to avoid conflicts with local PostgreSQL instances)

---

## Project Structure

```
Train Seat Booking System/
├── docker-compose.yml              # Multi-container orchestration
├── README.md
│
├── backend/
│   ├── Dockerfile                  # Node 20 Alpine, build + run
│   ├── package.json
│   ├── tsconfig.json
│   └── src/
│       ├── server.ts               # Express entry point, schema init, auto-seed
│       ├── config/
│       │   └── db.ts               # pg Pool, DDL schema + btree_gist extension
│       ├── types/
│       │   └── index.ts            # Shared TypeScript interfaces and enums
│       ├── utils/
│       │   ├── segment.ts          # Half-open interval overlap logic
│       │   ├── fare.ts             # Distance-based fare calculation engine
│       │   └── errors.ts           # Custom error classes (BookingConflictError, ValidationError)
│       ├── middlewares/
│       │   └── errorHandler.ts     # Express error middleware (409, 400, 500)
│       ├── routes/
│       │   └── api.routes.ts       # Route registration
│       ├── controllers/            # Request/response handling
│       │   ├── station.controller.ts
│       │   ├── train.controller.ts
│       │   ├── availability.controller.ts
│       │   ├── booking.controller.ts
│       │   ├── admin.controller.ts
│       │   └── seed.controller.ts
│       └── services/               # Business logic
│           ├── availability.service.ts  # Seat availability with range overlap query
│           ├── booking.service.ts       # Booking creation with exclusion constraint
│           ├── admin.service.ts         # Department analytics aggregation
│           └── seed.service.ts          # Database seeding (stations, coaches, seats, trains)
│
└── frontend/
    ├── Dockerfile                  # Multi-stage: Node build → Nginx serve
    ├── nginx.conf                  # Static files + /api reverse proxy
    ├── index.html                  # Entry HTML with Google Fonts
    ├── package.json
    ├── tsconfig.json
    ├── vite.config.ts              # Dev server proxy config
    ├── tailwind.config.js          # Custom railway color palette
    ├── postcss.config.js
    └── src/
        ├── main.tsx                # React DOM render
        ├── App.tsx                 # Root component, state management, view routing
        ├── index.css               # Tailwind directives + glassmorphism utilities
        ├── types/
        │   └── index.ts            # Frontend TypeScript interfaces
        ├── services/
        │   └── api.ts              # Axios API client
        └── components/
            ├── Header.tsx          # Brand header, view toggle, reset button
            ├── StationSelector.tsx # Train/origin/destination dropdowns + search
            ├── CoachTabs.tsx       # Carriage class tab navigation
            ├── SeatMap.tsx         # 2D seat grid with aisle separation
            ├── SeatLegend.tsx      # Color legend (available/selected/occupied)
            ├── BookingModal.tsx    # Booking confirmation form with fare display
            ├── BookingList.tsx     # Booking list component (defined but not rendered in current view)
            ├── AdminDashboard.tsx  # Department analytics dashboard
            └── ToastBanner.tsx     # Notification banner component
```

---

## Database Design

The database uses PostgreSQL 16 with the `btree_gist` extension for range-based exclusion constraints.

```mermaid
erDiagram
    STATIONS {
        SERIAL id PK
        VARCHAR name UK
        VARCHAR code UK
        INT sequence UK
        INT distance_km
        TIMESTAMP created_at
    }

    COACHES {
        SERIAL id PK
        VARCHAR name
        VARCHAR class_type
        INT total_seats
        INT layout_rows
        INT layout_cols
        TIMESTAMP created_at
    }

    SEATS {
        SERIAL id PK
        INT coach_id FK
        VARCHAR seat_number
        INT row_num
        INT col_num
        TIMESTAMP created_at
    }

    TRAINS {
        SERIAL id PK
        VARCHAR train_number UK
        VARCHAR name
        JSONB route_stations
        TIMESTAMP created_at
    }

    BOOKINGS {
        SERIAL id PK
        INT train_id FK
        INT seat_id FK
        VARCHAR passenger_name
        VARCHAR passenger_email
        INT origin_station_id FK
        INT destination_station_id FK
        VARCHAR origin_station_name
        VARCHAR destination_station_name
        INT from_sequence
        INT to_sequence
        INT distance_km
        INT fare_amount
        VARCHAR status
        TIMESTAMP created_at
    }

    COACHES ||--o{ SEATS : contains
    TRAINS ||--o{ BOOKINGS : has
    SEATS ||--o{ BOOKINGS : reserved_in
    STATIONS ||--o{ BOOKINGS : origin
    STATIONS ||--o{ BOOKINGS : destination
```

### Key Design Details

- **`stations.sequence`** — Integer ordering of stations along the line (0 = Colombo Fort, 12 = Badulla). Used as the basis for range interval arithmetic.
- **`stations.distance_km`** — Cumulative distance from Colombo Fort in kilometers. Used for fare calculation.
- **`trains.route_stations`** — JSONB column storing the ordered array of station objects for each train's route, including station IDs, names, codes, sequences, and distances.
- **`bookings.from_sequence` / `to_sequence`** — The integer range `[from_sequence, to_sequence)` representing the journey leg. These columns drive the exclusion constraint.
- **`bookings` exclusion constraint** — The critical constraint:

```sql
EXCLUDE USING gist (
  train_id WITH =,
  seat_id WITH =,
  int4range(from_sequence, to_sequence, '[)') WITH &&
) WHERE (status = 'CONFIRMED')
```

This constraint ensures that no two confirmed bookings for the same train and seat can have overlapping sequence ranges.

---

## Core Design Decisions

### 1. Why PostgreSQL 16

PostgreSQL was chosen specifically for its native `int4range` data type and `EXCLUDE USING gist` constraint — capabilities that no other mainstream database offers. The core problem of this system is enforcing non-overlapping integer ranges under concurrent access. PostgreSQL solves this at the storage engine level with a single declarative constraint, eliminating the need for application-level locking, optimistic concurrency control, or distributed lock managers.

MongoDB, MySQL, and SQLite were evaluated but none provide a native range overlap constraint. Any solution with these databases would require either:
- Application-level `SELECT ... FOR UPDATE` followed by conditional `INSERT` (vulnerable to race conditions between the check and the insert without explicit row locking)
- Redis-based distributed locks (adds infrastructure complexity and a single point of failure)

PostgreSQL's exclusion constraint is **serializable by definition** — the database engine rejects conflicting inserts atomically, even if two transactions attempt the same overlapping booking in the same millisecond.

### 2. Half-Open Interval Arithmetic

Journey segments are modeled as half-open intervals `[from_sequence, to_sequence)`:

- Colombo Fort (seq 0) → Kandy (seq 6) is stored as `[0, 6)`
- Kandy (seq 6) → Badulla (seq 12) is stored as `[6, 12)`

Two intervals overlap if and only if `max(A_start, B_start) < min(A_end, B_end)`.

For the contiguous case: `max(0, 6) = 6`, `min(6, 12) = 6`, and `6 < 6` is **false** — so contiguous segments correctly do not conflict.

This convention was chosen because:
- It aligns naturally with PostgreSQL's `int4range('[)')` syntax
- It eliminates off-by-one errors in overlap detection
- It is the standard mathematical convention for representing non-overlapping partitions of a continuous space

### 3. Database-Level Concurrency Protection

Rather than implementing optimistic locking (version columns with retry loops) or pessimistic locking (`SELECT ... FOR UPDATE`), the system delegates all concurrency control to the PostgreSQL exclusion constraint.

When two concurrent booking requests attempt to insert overlapping ranges for the same seat, PostgreSQL raises error code `23P01` (`exclusion_violation`). The booking service catches this specific error and converts it to a `BookingConflictError`, which the error handler middleware returns as HTTP 409 Conflict.

This approach was chosen because:
- It is impossible to have a race condition — the constraint is evaluated atomically within the database transaction
- It requires zero application-level locking code
- It works correctly regardless of the number of application server instances

### 4. Configurable Coaches, Seats, and Stations

The challenge specification requires that coaches, seats per coach, and stations be configurable rather than hardcoded. This is achieved through the database-driven seed service:

- **Stations** are stored in the `stations` table with configurable `name`, `code`, `sequence`, and `distance_km` fields
- **Coaches** are stored in the `coaches` table with configurable `class_type`, `total_seats`, `layout_rows`, and `layout_cols`
- **Seats** are dynamically generated based on each coach's `layout_rows × layout_cols` dimensions
- **Trains** store their route as a JSONB array, decoupling the route definition from the stations table

To change the train configuration, only the seed data needs to be modified. No application code changes are required. The frontend dynamically renders the seat map based on the `layoutRows` and `layoutCols` values returned by the API.

### 5. Seat Availability Algorithm

Availability is computed per-query, not cached, to ensure correctness:

1. The client sends a request with `trainId`, `originStationId`, and `destinationStationId`
2. The backend resolves the origin and destination to their integer sequence values from the train's route
3. A single SQL query finds all confirmed bookings whose `int4range(from_sequence, to_sequence, '[)')` overlaps with the requested range using the `&&` operator
4. The results are indexed into a `Map<seatId, conflictingSegments[]>`
5. All seats across all coaches are returned with `isAvailable: true/false` based on whether they have any conflicting bookings

This approach was chosen over pre-computing an availability matrix because:
- It is always consistent with the current database state
- It avoids cache invalidation complexity
- The query is efficient thanks to the GiST index that already exists for the exclusion constraint

### 6. Distance-Based Fare Calculation

Fares are calculated using cumulative station distances and per-class rate multipliers:

```
distanceKm = |destination.distance_km - origin.distance_km|
fareAmount = max(distanceKm × ratePerKm, minimumFare)
```

Class rates:
| Class | Rate per km (LKR) | Minimum Fare (LKR) |
|-------|-------------------|---------------------|
| 1st Class Observation | 12.00 | 300 |
| 2nd Class Reserved | 8.00 | 200 |
| 3rd Class Reserved | 5.00 | 100 |

The fare is computed both during availability queries (so the UI can display it before booking) and during booking creation (so the stored fare is authoritative). The minimum fare ensures that very short journeys (e.g., 1 km) still generate a reasonable ticket price.

### 7. API Design

The API follows a simple RESTful pattern with a flat `/api/*` namespace. All responses use a consistent envelope: `{ success: boolean, data?: T, message?: string }`. Error responses include an `errorType` discriminator (`BOOKING_CONFLICT`, `VALIDATION_ERROR`, `INTERNAL_SERVER_ERROR`) so the frontend can provide contextual error messages.

The availability endpoint uses query parameters rather than a POST body because it is a read-only, idempotent operation. The booking endpoint uses POST because it creates a resource.

---

## Alternatives Considered

### Database Choice: PostgreSQL vs. MongoDB vs. MySQL

| Criterion | PostgreSQL 16 | MongoDB 7 | MySQL 8 |
|-----------|--------------|-----------|---------|
| Native range type | `int4range` ✅ | None ❌ | None ❌ |
| Range exclusion constraint | `EXCLUDE USING gist` ✅ | None ❌ | None ❌ |
| Overlap operator | `&&` native ✅ | `$elemMatch` workaround ❌ | None ❌ |
| Concurrent conflict detection | Atomic at engine level ✅ | Requires app-level locking ❌ | Requires `SELECT FOR UPDATE` ❌ |
| JSONB for flexible route data | ✅ | Native documents ✅ | JSON column ✅ |

**Why PostgreSQL was chosen:** The exclusion constraint is the single most impactful feature for this problem domain. It eliminates an entire category of concurrency bugs and reduces the booking service to a simple INSERT — no pre-check query, no locking, no retry loop.

**Why MongoDB was rejected:** MongoDB has no mechanism for declarative range overlap prevention. Implementing segment-based booking in MongoDB would require either:
- A two-phase pattern: query for overlaps, then insert if none found (race condition window between the two operations)
- Application-level distributed locking via Redis or MongoDB's `findOneAndUpdate` with careful atomic conditions

Both approaches are significantly more complex and error-prone than a single SQL constraint.

### Concurrency Strategy: Exclusion Constraint vs. Application-Level Locking

**Application-level optimistic locking** (version column + retry): Requires reading the current state, checking for conflicts, and writing — with a retry loop if the version has changed. This works but adds complexity and can degrade performance under contention.

**Application-level pessimistic locking** (`SELECT ... FOR UPDATE`): Requires acquiring a row-level lock on the seat row before checking availability. This serializes all bookings for the same seat, which works but reduces throughput and requires careful deadlock prevention when multiple seats are locked.

**Database exclusion constraint** (chosen): The constraint is evaluated atomically within the INSERT operation itself. There is no window between "check" and "write" where another transaction can slip in. This is the simplest correct solution.

### Availability Algorithm: Per-Query Computation vs. Pre-Computed Matrix

**Pre-computed availability matrix**: Maintain a `seat_segments` table with one row per seat per segment, updated on every booking. Availability checks become simple lookups. However, this introduces significant complexity:
- Every booking must update N segment rows (where N is the number of stations in the journey)
- Cancellations must reverse the updates
- The matrix must be kept consistent with the bookings table

**Per-query computation** (chosen): A single SQL query with the `&&` range overlap operator finds all conflicting bookings. This is simpler, always consistent, and performant because the GiST index built for the exclusion constraint also accelerates the overlap query.

### Fare Calculation: Distance-Based vs. Fixed-Rate vs. Zone-Based

**Fixed-rate per segment**: Simple but unfair — a 16 km journey costs the same as a 292 km journey.

**Zone-based pricing**: Group stations into zones and charge per zone boundary crossed. More complex to configure and less granular.

**Distance-based with class multipliers** (chosen): Proportional to actual travel distance, with class-specific rates and minimum fares. This is the fairest and most transparent approach, and aligns with real-world railway pricing models.

---

## Challenges Faced

### 1. Enforcing Non-Overlapping Segments Under Concurrency

The fundamental challenge was ensuring that two concurrent booking requests for overlapping segments on the same seat would never both succeed. The solution was to use PostgreSQL's `EXCLUDE USING gist` constraint with `int4range` and the `&&` (overlaps) operator. This required enabling the `btree_gist` extension, which is not installed by default but is available in the standard PostgreSQL Alpine Docker image.

The `btree_gist` extension is necessary because the exclusion constraint combines equality operators (`WITH =` on `train_id` and `seat_id`) with the range overlap operator (`WITH &&` on `int4range`). The default B-tree index type does not support this combination; only GiST indexes do, and `btree_gist` adds B-tree-compatible operator classes for scalar types to the GiST framework.

### 2. Rendering a 2D Seat Map from Database Layout

The challenge was rendering a visually accurate carriage layout from the `layout_rows` and `layout_cols` values stored in the database. Each coach has a different number of rows (5, 6, or 7) but a fixed 4-column layout. The frontend groups seats by row, splits each row into left (columns 1–2) and right (columns 3–4) with a central aisle label, and renders each seat as an interactive button with availability-dependent styling. Hover tooltips show detailed conflict information for occupied seats.

### 3. Docker Networking and Port Conflicts

The Nginx frontend container must proxy `/api` requests to the backend container. In the Docker Compose internal network, the backend is reachable at `backend:5001`, not `localhost:5001`. The `nginx.conf` uses `proxy_pass http://backend:5001/api` for this purpose.

Additionally, a local PostgreSQL instance running on the host machine's port 5432 conflicts with the containerized PostgreSQL. The host port mapping was changed to `5433:5432` to resolve this while keeping the internal container networking unchanged.

### 4. Half-Open vs. Closed Interval Semantics

The choice between `[from, to]` (closed) and `[from, to)` (half-open) intervals significantly impacts overlap detection. With closed intervals, two contiguous segments `[0, 6]` and `[6, 12]` would overlap at station 6 — incorrectly preventing the second booking. Half-open intervals `[0, 6)` and `[6, 12)` correctly partition the journey into non-overlapping segments. PostgreSQL's `int4range` function accepts a bounds argument (`'[)'`) that makes this explicit.

---

## API Overview

| Method | Endpoint | Purpose | Parameters |
|--------|----------|---------|------------|
| `GET` | `/api/stations` | List all stations in route order | — |
| `GET` | `/api/trains` | List all train schedules with route data | — |
| `GET` | `/api/availability` | Check seat availability for a journey segment | `?trainId=&originStationId=&destinationStationId=` |
| `POST` | `/api/bookings` | Create a new seat booking | Body: `{ trainId, seatId, passengerName, passengerEmail, originStationId, destinationStationId }` |
| `GET` | `/api/bookings` | List all bookings (optionally filtered by train) | `?trainId=` (optional) |
| `GET` | `/api/admin/stats` | Department analytics (revenue, occupancy, class breakdown) | — |
| `POST` | `/api/seed` | Reset and re-seed database with default data | — |
| `GET` | `/health` | Health check for container readiness | — |

**Response format:**

```json
{
  "success": true,
  "data": { ... },
  "message": "Optional message"
}
```

**Error response format:**

```json
{
  "success": false,
  "errorType": "BOOKING_CONFLICT | VALIDATION_ERROR | INTERNAL_SERVER_ERROR",
  "message": "Descriptive error message"
}
```

---

## Running the Project

### Prerequisites

- [Docker](https://www.docker.com/) and [Docker Compose](https://docs.docker.com/compose/)

### Quick Start with Docker Compose

```bash
# Clone the repository
git clone <repository-url>
cd "Train Seat Booking System"

# Build and start all containers
docker compose up --build
```

This command:
1. Starts a **PostgreSQL 16** container with the `btree_gist` extension
2. Starts the **Express backend**, which automatically creates all database tables and seeds the data on first boot
3. Starts the **Nginx frontend**, which serves the React SPA and proxies API requests

**Access the application:**
- Frontend: [http://localhost:3000](http://localhost:3000)
- Backend API: [http://localhost:5001/api](http://localhost:5001/api)
- Health Check: [http://localhost:5001/health](http://localhost:5001/health)
- PostgreSQL: `localhost:5433` (user: `postgres`, password: `postgres`, database: `train_booking`)

### Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `PORT` | `5001` | Backend server port |
| `DATABASE_URL` | `postgres://postgres:postgres@postgres:5432/train_booking` | PostgreSQL connection string |
| `VITE_API_URL` | `http://backend:5001` | Backend URL for Vite dev proxy |

### Database Initialization

The database is automatically initialized on first boot:
1. The `btree_gist` extension is enabled
2. All tables (`stations`, `coaches`, `seats`, `trains`, `bookings`) are created with their constraints
3. If the `stations` table is empty, the seed service populates 13 stations, 3 coaches, 72 seats, and 2 train schedules

To reset the database at any time, click the **"Reset DB"** button in the application header or call `POST /api/seed`.

### Running Locally (Without Docker)

```bash
# Ensure PostgreSQL 16 is running locally with btree_gist available

# Backend
cd backend
npm install
npm run dev     # Starts with nodemon + ts-node on port 5001

# Frontend (in a separate terminal)
cd frontend
npm install
npm run dev     # Starts Vite dev server on port 3000
```

Ensure the `DATABASE_URL` environment variable points to your local PostgreSQL instance.

---

## Screenshots

Screenshots can be captured from the running application at the following views:

1. **Passenger View** — Journey selector with origin/destination dropdowns and the interactive seat map
2. **Seat Map** — 2D carriage layout showing available (green), selected (blue), and occupied (red) seats with hover tooltips
3. **Booking Modal** — Confirmation dialog showing journey details, fare calculation, and passenger form
4. **Admin Dashboard** — KPI cards, class occupancy progress bars, and recent reservations table
5. **Conflict Toast** — Error notification when attempting to book an overlapping segment (HTTP 409)

---

## Future Improvements

- **Authentication and authorization** — User accounts for passengers, admin role separation with JWT or session-based auth
- **Booking cancellation** — Allow passengers to cancel bookings, freeing segments for re-sale (the `status` column and exclusion constraint `WHERE` clause already support this)
- **Payment gateway integration** — Stripe/PayHere integration for real payment processing before confirming bookings
- **Waitlist system** — Queue passengers for fully-booked segments and notify them when cancellations free up seats
- **Real-time seat updates** — WebSocket-based live seat map updates so multiple users see availability changes instantly
- **Email confirmation** — Send booking confirmation emails with journey details and a reference number
- **Multiple train lines** — Extend the system to support other Sri Lanka Railway lines beyond Colombo Fort – Badulla
- **Dynamic pricing** — Peak/off-peak rate multipliers based on time of day, day of week, or demand
- **Automated testing** — Unit tests for fare calculation and segment overlap logic, integration tests for the booking API with concurrent request scenarios

---

## Extra Credit

### 1. Database-Level Overlap Prevention via GiST Exclusion Constraint

**Problem:** The core challenge of segment-based booking is preventing two passengers from booking the same seat for overlapping journey legs, especially under concurrent access.

**Implementation:** Rather than checking for overlaps in application code and then inserting (which has a race condition window), the system uses PostgreSQL's `EXCLUDE USING gist` constraint:

```sql
EXCLUDE USING gist (
  train_id WITH =,
  seat_id WITH =,
  int4range(from_sequence, to_sequence, '[)') WITH &&
) WHERE (status = 'CONFIRMED')
```

This constraint is evaluated atomically by the database engine during the INSERT operation. If two concurrent transactions attempt to insert overlapping ranges for the same seat, exactly one will succeed and the other will fail with error code `23P01` (`exclusion_violation`).

**Design rationale:** This eliminates the need for application-level locking (optimistic or pessimistic), retry loops, or distributed lock managers. The booking service is a simple INSERT — the database handles all concurrency control. This is the strongest possible guarantee: it is impossible for the constraint to be violated regardless of application bugs, race conditions, or the number of server instances.

### 2. Distance-Based Fare Calculation Engine

**Problem:** A flat-rate fare structure is unfair for a 292 km line — passengers traveling 16 km should not pay the same as passengers traveling 292 km.

**Implementation:** Each station stores its cumulative distance from Colombo Fort. The fare is calculated as:

```
fare = max(|dest_km - origin_km| × class_rate_per_km, minimum_fare)
```

Three carriage classes have different rates (LKR 12/km, 8/km, 5/km) and minimum fares (LKR 300, 200, 100). The fare is computed during both availability queries and booking creation.

**Design rationale:** Distance-based pricing is proportional, transparent, and aligns with real-world railway pricing. The minimum fare prevents degenerate cases where very short journeys would cost less than the operational overhead of issuing a ticket.

### 3. Department Admin Analytics Dashboard

**Problem:** The railway department needs visibility into booking performance, revenue, and segment utilization — not just individual bookings.

**Implementation:** The admin dashboard aggregates all confirmed bookings to compute:
- Total line revenue (sum of all fare amounts)
- Active booking count
- Overall occupancy rate (booked segment-units / total segment capacity × 100%)
- Segment re-selling count (seats with more than one non-overlapping booking)
- Per-class occupancy breakdown with progress bars
- Last 10 confirmed tickets

**Design rationale:** The occupancy rate is computed as a ratio of "booked segment-units" to "total segment capacity," where total capacity = (total seats) × (total segments per train) × (number of trains). This metric captures the value of segment-based booking: a system where the same seat is booked for 3 non-overlapping legs has 3× the segment-units of a system where it is booked once for the full journey.

---

## Testing

No automated tests are currently implemented. The system has been manually verified by:

1. Booking seats for non-overlapping segments and confirming both succeed
2. Attempting to book the same seat for an overlapping segment and confirming the system returns HTTP 409 with a descriptive error message
3. Verifying that contiguous segments (e.g., Colombo → Kandy then Kandy → Badulla) do not conflict
4. Resetting the database via the seed endpoint and confirming clean re-initialization
5. Building both frontend and backend with `npm run build` (0 TypeScript errors)
6. Running `docker compose up --build` and confirming all three containers start and communicate correctly

---

## Assumptions

1. **Single-direction journeys only** — Passengers travel from a lower-sequence station to a higher-sequence station. The system validates that `from_sequence < to_sequence` and does not support return journeys.
2. **No authentication required** — The system does not implement user accounts. Any user can book any seat, view any booking, and access the admin dashboard. This is appropriate for a take-home assessment scope.
3. **Booking is immediate and final** — There is no payment step, no provisional holding period, and no cancellation flow. A booking is confirmed the moment the INSERT succeeds.
4. **Shared coaches across trains** — All trains share the same set of coaches and seats. In a production system, each train would have its own coach/seat configuration.
5. **Station distances are approximate** — The seeded cumulative distances (0 km to 292 km) are representative but not precise geodetic measurements.
6. **4-column seat layout** — All coaches use a 4-column layout (2 seats, aisle, 2 seats). The number of rows varies by class. This is configurable via the database but the frontend rendering assumes a 4-column layout with a central aisle.

---

## Trade-offs

| Decision | Benefit | Cost |
|----------|---------|------|
| PostgreSQL exclusion constraint | Zero application-level concurrency code; impossible to violate | Requires PostgreSQL specifically; not portable to other databases |
| Per-query availability computation | Always consistent; no cache invalidation | Slightly higher latency than a pre-computed matrix for very large datasets |
| JSONB route storage on trains table | Flexible schema for route variations; single query to fetch full route | Denormalized data; route changes require updating the JSONB column |
| Raw SQL via `pg` driver (no ORM) | Full control over queries; no ORM abstraction leaks; smaller bundle | No migration framework; manual schema management in `db.ts` |
| Three reserved coaches (72 seats total) | Manageable for demonstration and visual seat map | Does not match the challenge's 8-coach specification (3 reserved, 5 unreserved); unreserved coaches are omitted because they do not participate in seat booking |
| No automated tests | Faster development for take-home scope | Reduced confidence in edge cases; no regression protection |
| Auto-seed on empty database | Zero-configuration startup; `docker compose up` just works | Re-seeding requires manual "Reset DB" click or API call; no migration versioning |

---

## Conclusion

This project demonstrates a segment-based train seat booking system where the core engineering challenge — preventing overlapping bookings under concurrent access — is solved at the most appropriate layer: the database engine itself. By leveraging PostgreSQL's `int4range` type and `EXCLUDE USING gist` constraint, the system provides a mathematically rigorous guarantee that no two confirmed bookings for the same seat can have overlapping journey segments, regardless of application-level race conditions.

The solution is intentionally built around this single architectural insight: if the database can enforce the invariant atomically, the application layer can remain simple. The booking service is a single INSERT statement. The availability service is a single SELECT with a range overlap predicate. There are no locks, no retry loops, no version columns, and no distributed coordination — just a declarative constraint that the database evaluates on every write.
