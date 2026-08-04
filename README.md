# Segment-Based Train Seat Booking System

A booking system for Sri Lanka's **Colombo Fort – Badulla** railway line that allows a single reserved seat to be booked independently by different passengers for non-overlapping legs of the same journey.

Traditional booking systems lock a seat for the entire route. On a 292 km line with 13 stops, a passenger traveling only the first two stops wastes the seat for the remaining eleven. This system solves that problem: Passenger A books Seat 1A from Colombo Fort → Kandy, and Passenger B books the same seat from Kandy → Badulla. Both are valid because their segments don't overlap.

The core technical challenge is enforcing this non-overlap invariant under concurrent access — two users booking the same seat for overlapping segments at the same instant. The system delegates this entirely to PostgreSQL's native range exclusion constraints, making double-bookings impossible at the database engine level.

---

## Features

### Core Features

- Segment-based seat booking — one seat, multiple non-overlapping passengers
- Interactive 2D seat map with per-coach carriage layouts (1st, 2nd, 3rd class tabs)
- Real-time segment availability — a seat booked for Colombo → Kandy still shows available for Kandy → Badulla
- Overlap conflict tooltips on occupied seats showing which segments are taken
- Distance-based fare calculation using real cumulative station distances and class multipliers
- Database-level concurrency protection via PostgreSQL GiST exclusion constraint
- HTTP 409 Conflict responses for overlapping booking attempts
- Configurable stations, coaches, and seats (database-driven, not hardcoded)
- Journey direction validation (destination must be downstream of origin)
- One-click database reset and re-seed

### Additional Features

- Department Admin Dashboard with revenue KPIs, class occupancy breakdown, and recent reservations
- Dual-view toggle (Passenger View / Department Admin) in the header
- Toast notification system for booking confirmations and conflict alerts
- Two seeded train schedules (Podi Menike, Denuwara Menike)
- Auto-seed on first boot — `docker compose up` just works with zero configuration

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18, TypeScript, Vite, Tailwind CSS, Axios, Lucide Icons |
| Backend | Node.js 20, Express 4, TypeScript, pg (node-postgres) |
| Database | PostgreSQL 16 with `btree_gist` extension |
| Infrastructure | Docker Compose, Nginx (reverse proxy + static serving) |

---

## Core Design Decisions

### Segment-Based Booking Model

The core requirement of this project is allowing a single reserved seat to be booked by multiple passengers as long as their journeys do not overlap. Each booking is represented using the origin and destination station sequence numbers as a half-open interval ([from, to)). This approach allows adjacent journeys—for example, Colombo Fort → Kandy followed by Kandy → Badulla—to reuse the same seat without conflict while correctly rejecting overlapping reservations. It provides a simple and reliable representation of seat occupancy throughout the journey.

### Database Choice: PostgreSQL 16

PostgreSQL was selected because it provides native support for range types and exclusion constraints, making it well suited for implementing segment-based reservations. Instead of manually checking for overlapping bookings in application code, the database guarantees that overlapping reservations for the same seat cannot be created, resulting in a simpler and more reliable design.

The booking table uses an exclusion constraint similar to:

```sql
EXCLUDE USING gist (
  train_id WITH =,
  seat_id WITH =,
  int4range(from_sequence, to_sequence, '[)') WITH &&
)
```
This ensures that overlapping bookings for the same seat are rejected atomically by the database, even under concurrent booking attempts.

### Concurrency Handling: Database-Level Enforcement

Concurrency control is delegated to PostgreSQL rather than being implemented in the application. If two users attempt to reserve overlapping journey segments for the same seat simultaneously, the database rejects the conflicting transaction. The backend catches the constraint violation and returns an HTTP 409 Conflict response, ensuring consistent behaviour without implementing custom locking or retry mechanisms.

### Configurable Train Layout

The application is designed to be configuration-driven rather than hardcoded. Stations, coaches, seat layouts, and train information are stored in the database and loaded dynamically through the API. This allows the railway department to modify the route, add new stations, or change the number of coaches and seats without requiring changes to the application code.

### Fare Calculation

Ticket fares are calculated using the distance travelled between the selected stations together with carriage-class pricing rules. This ensures passengers pay only for the portion of the journey they travel, which aligns with the objective of segment-based seat reuse while remaining flexible enough for future pricing models.

### Direct SQL over ORM

The backend communicates directly with PostgreSQL using the pg driver instead of an ORM. This provides full access to PostgreSQL's advanced features, such as range types and exclusion constraints, while keeping the implementation lightweight and giving precise control over database operations.

---

## Alternatives Considered

**MongoDB vs PostgreSQL:** MongoDB was initially considered for its flexible document model, but it has no mechanism for declarative range overlap prevention. Segment booking in MongoDB would require a two-phase pattern (query for overlaps, then insert) with a race condition window between the two operations, or application-level distributed locking via Redis. PostgreSQL's exclusion constraint solves this in a single atomic operation.

**Application-level locking vs database constraint:** `SELECT ... FOR UPDATE` (pessimistic) and version-column retries (optimistic) were considered. Both work but add complexity — pessimistic locking serializes all bookings per seat and risks deadlocks; optimistic locking requires retry loops. The exclusion constraint is simpler and stronger: the conflict check happens within the INSERT itself with no window for race conditions.

**Pre-computed availability matrix vs per-query computation:** Maintaining a `seat_segments` table with one row per seat per segment would make availability lookups trivial but requires updating N rows per booking and keeping the matrix consistent with the bookings table. Per-query computation using the `&&` range overlap operator is simpler, always consistent, and performant thanks to the GiST index already built for the constraint.

**Fixed-rate vs distance-based fares:** A flat rate per segment would be simpler but unfair — a 16 km journey shouldn't cost the same as 292 km. Distance-based pricing with class multipliers is proportional and aligns with real railway pricing.

---

## Challenges Faced

**Enabling `btree_gist` in PostgreSQL:** The exclusion constraint combines equality operators on scalar columns (`train_id`, `seat_id`) with the range overlap operator on `int4range`. This requires the `btree_gist` extension, which adds B-tree-compatible operator classes to GiST indexes. The solution was running `CREATE EXTENSION IF NOT EXISTS btree_gist` during schema initialization.

**Half-open vs closed interval semantics:** With closed intervals `[0, 6]` and `[6, 12]`, contiguous segments would incorrectly overlap at station 6. Half-open intervals `[0, 6)` and `[6, 12)` correctly partition the journey. PostgreSQL's `int4range` supports this with the `'[)'` bounds argument.

**Docker networking:** The Nginx container must proxy `/api` requests to the backend container using `proxy_pass http://backend:5001/api` (Docker internal hostname), not `localhost`. Additionally, a local PostgreSQL instance on the host conflicted with port 5432, resolved by mapping the container to host port 5433.

**Rendering configurable seat maps:** Coaches have varying row counts (5, 6, 7) but a fixed 4-column layout. The frontend dynamically groups seats by row, splits each row into left (columns 1–2) and right (columns 3–4) with a central aisle, and renders interactive buttons with availability-dependent styling.

---

## Extra Credit Features

**Department Admin Dashboard:** Provides a real-time analytics view showing total line revenue (LKR), active booking count, overall occupancy rate (computed as booked segment-units / total segment capacity), segment re-selling efficiency (seats with multiple non-overlapping bookings), per-class occupancy breakdown with progress bars, and the last 10 confirmed tickets.

**Interactive 2D Seat Map:** A visual carriage rendering where each seat is an interactive button color-coded by status (green = available, blue = selected, red = occupied). Occupied seats display tooltips showing exactly which segments are conflicting, so users can see *why* a seat is unavailable and potentially choose a non-conflicting segment.

**Distance-Based Fare Engine:** Rather than a flat fare, the system computes fares proportional to actual travel distance using cumulative station-to-station distances and carriage class multipliers, with minimum fare floors.

---

## Running the Project

### Prerequisites

- Docker and Docker Compose

### Setup

```bash
git clone <repository-url>
cd "Train Seat Booking System"
docker compose up --build
```

This starts PostgreSQL 16, the Express backend (with automatic schema creation and data seeding), and the Nginx frontend.

| Service | URL |
|---------|-----|
| Frontend | http://localhost:3000 |
| Backend API | http://localhost:5001/api |
| PostgreSQL | localhost:5433 (user: `postgres`, password: `postgres`, db: `train_booking`) |

The database is fully initialized on first boot. Click **"Reset DB"** in the header to re-seed at any time.

---

## Future Improvements

- User authentication and role-based access control
- Booking cancellation (the `status` column and constraint `WHERE` clause already support this)
- Payment gateway integration
- WebSocket-based live seat map updates
- Automated tests for fare calculation, segment overlap logic, and concurrent booking scenarios
- Email booking confirmations

---

## Screenshots

*Screenshots can be captured from the running application:*

1. **Passenger View** — Journey selector and interactive seat map
2. **Seat Map** — 2D carriage layout with availability color coding
3. **Booking Modal** — Fare calculation and passenger details form
4. **Admin Dashboard** — Revenue KPIs, class occupancy, recent tickets
5. **Conflict Alert** — Toast notification on overlapping booking attempt (HTTP 409)
