import { Pool } from 'pg';

const connectionString = process.env.DATABASE_URL || 'postgres://postgres:postgres@localhost:5432/train_booking';

export const pool = new Pool({
  connectionString,
});

export const initPostgresSchema = async (): Promise<void> => {
  const client = await pool.connect();
  try {
    console.log('[PostgreSQL] Initializing database schema & extensions...');

    // 1. Enable btree_gist extension for range exclusion constraints
    await client.query('CREATE EXTENSION IF NOT EXISTS btree_gist;');

    // 2. Create stations table
    await client.query(`
      CREATE TABLE IF NOT EXISTS stations (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL UNIQUE,
        code VARCHAR(50) NOT NULL UNIQUE,
        sequence INT NOT NULL UNIQUE,
        distance_km INT NOT NULL DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // 3. Create coaches table
    await client.query(`
      CREATE TABLE IF NOT EXISTS coaches (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        class_type VARCHAR(50) NOT NULL,
        total_seats INT NOT NULL,
        layout_rows INT NOT NULL DEFAULT 5,
        layout_cols INT NOT NULL DEFAULT 4,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // 4. Create seats table
    await client.query(`
      CREATE TABLE IF NOT EXISTS seats (
        id SERIAL PRIMARY KEY,
        coach_id INT NOT NULL REFERENCES coaches(id) ON DELETE CASCADE,
        seat_number VARCHAR(50) NOT NULL,
        row_num INT NOT NULL,
        col_num INT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE (coach_id, seat_number)
      );
    `);

    // 5. Create trains table
    await client.query(`
      CREATE TABLE IF NOT EXISTS trains (
        id SERIAL PRIMARY KEY,
        train_number VARCHAR(100) NOT NULL UNIQUE,
        name VARCHAR(255) NOT NULL,
        route_stations JSONB NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // 6. Create bookings table with native Range Exclusion Constraint
    await client.query(`
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
        EXCLUDE USING gist (
          train_id WITH =,
          seat_id WITH =,
          int4range(from_sequence, to_sequence, '[)') WITH &&
        ) WHERE (status = 'CONFIRMED')
      );
    `);

    console.log('[PostgreSQL] Database schema & range exclusion constraints initialized successfully!');
  } catch (error) {
    console.error('[PostgreSQL] Schema initialization error:', error);
    throw error;
  } finally {
    client.release();
  }
};
