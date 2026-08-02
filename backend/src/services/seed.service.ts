import { pool } from '../config/db';
import { CoachClass } from '../types';

export const seedDatabase = async () => {
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    // 1. Truncate existing tables in cascade order
    await client.query(`
      TRUNCATE TABLE bookings, seats, coaches, trains, stations RESTART IDENTITY CASCADE;
    `);

    // 2. Seed Stations (Colombo Fort - Badulla Line)
    const stationData = [
      { name: 'Colombo Fort', code: 'FOT', sequence: 0, distanceKm: 0 },
      { name: 'Ragama', code: 'RGM', sequence: 1, distanceKm: 16 },
      { name: 'Gampaha', code: 'GPH', sequence: 2, distanceKm: 28 },
      { name: 'Polgahawela', code: 'PLW', sequence: 3, distanceKm: 73 },
      { name: 'Kurunegala', code: 'KRN', sequence: 4, distanceKm: 94 },
      { name: 'Peradeniya', code: 'PDA', sequence: 5, distanceKm: 115 },
      { name: 'Kandy', code: 'KDY', sequence: 6, distanceKm: 120 },
      { name: 'Nawalapitiya', code: 'NVP', sequence: 7, distanceKm: 140 },
      { name: 'Hatton', code: 'HTN', sequence: 8, distanceKm: 175 },
      { name: 'Nanu Oya (Nuwara Eliya)', code: 'NOA', sequence: 9, distanceKm: 206 },
      { name: 'Pattipola', code: 'PTP', sequence: 10, distanceKm: 224 },
      { name: 'Ella', code: 'ELA', sequence: 11, distanceKm: 271 },
      { name: 'Badulla', code: 'BAD', sequence: 12, distanceKm: 292 },
    ];

    const insertedStations: any[] = [];
    for (const st of stationData) {
      const res = await client.query(
        `INSERT INTO stations (name, code, sequence, distance_km) VALUES ($1, $2, $3, $4) RETURNING *`,
        [st.name, st.code, st.sequence, st.distanceKm]
      );
      insertedStations.push(res.rows[0]);
    }

    // 3. Seed Coaches
    const coachData = [
      { name: 'Coach A - 1st Class Observation', classType: CoachClass.FIRST, totalSeats: 20, rows: 5, cols: 4 },
      { name: 'Coach B - 2nd Class Reserved', classType: CoachClass.SECOND, totalSeats: 24, rows: 6, cols: 4 },
      { name: 'Coach C - 3rd Class Reserved', classType: CoachClass.THIRD, totalSeats: 28, rows: 7, cols: 4 },
    ];

    const insertedCoaches: any[] = [];
    for (const c of coachData) {
      const res = await client.query(
        `INSERT INTO coaches (name, class_type, total_seats, layout_rows, layout_cols) VALUES ($1, $2, $3, $4, $5) RETURNING *`,
        [c.name, c.classType, c.totalSeats, c.rows, c.cols]
      );
      insertedCoaches.push(res.rows[0]);
    }

    // 4. Seed Seats for each Coach
    const colLetters = ['A', 'B', 'C', 'D'];
    let insertedSeatsCount = 0;

    for (const coach of insertedCoaches) {
      for (let r = 1; r <= coach.layout_rows; r++) {
        for (let c = 1; c <= coach.layout_cols; c++) {
          const seatNum = `${r}${colLetters[c - 1]}`;
          await client.query(
            `INSERT INTO seats (coach_id, seat_number, row_num, col_num) VALUES ($1, $2, $3, $4)`,
            [coach.id, seatNum, r, c]
          );
          insertedSeatsCount++;
        }
      }
    }

    // 5. Seed Train Schedule (Podi Menike and Denuwara Menike)
    const routeStations = insertedStations.map((st) => ({
      stationId: st.id,
      name: st.name,
      code: st.code,
      sequence: st.sequence,
      distanceFromOriginKm: st.distance_km,
      arrivalTime: st.sequence === 0 ? '05:55 AM' : `${6 + Math.floor(st.sequence * 0.7)}:${(st.sequence * 20) % 60}0 AM`,
      departureTime: st.sequence === 12 ? '04:30 PM' : `${6 + Math.floor(st.sequence * 0.7)}:${((st.sequence * 20) % 60) + 5}0 AM`,
    }));

    const trainData = [
      { trainNumber: '1005 - Podi Menike', name: 'Colombo Fort - Badulla Express' },
      { trainNumber: '1015 - Denuwara Menike', name: 'Colombo Fort - Badulla AC Intercity' },
    ];

    for (const t of trainData) {
      await client.query(
        `INSERT INTO trains (train_number, name, route_stations) VALUES ($1, $2, $3)`,
        [t.trainNumber, t.name, JSON.stringify(routeStations)]
      );
    }

    await client.query('COMMIT');

    return {
      message: 'PostgreSQL database seeded successfully!',
      stationsCount: insertedStations.length,
      coachesCount: insertedCoaches.length,
      seatsCount: insertedSeatsCount,
      trainsCount: trainData.length,
    };
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('[PostgreSQL Seed] Error seeding database:', error);
    throw error;
  } finally {
    client.release();
  }
};
