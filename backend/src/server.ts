import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { pool, initPostgresSchema } from './config/db';
import apiRoutes from './routes/api.routes';
import { errorHandler } from './middlewares/errorHandler';
import { seedDatabase } from './services/seed.service';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5001;

// Middleware
app.use(cors());
app.use(express.json());

// API Routes
app.use('/api', apiRoutes);

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'UP', timestamp: new Date() });
});

// Error handling middleware
app.use(errorHandler);

// Connect DB, initialize PostgreSQL schema, and launch server
initPostgresSchema()
  .then(async () => {
    // Auto-seed if stations table is empty
    const countRes = await pool.query('SELECT COUNT(*) FROM stations');
    const count = parseInt(countRes.rows[0].count, 10);
    if (count === 0) {
      console.log('[Auto-Seed] Initializing PostgreSQL database with Colombo Fort - Badulla data...');
      await seedDatabase();
    }

    app.listen(PORT, () => {
      console.log(`=================================================`);
      console.log(`🚆 Train Seat Booking API (PostgreSQL) running on port ${PORT}`);
      console.log(`   Health Check: http://localhost:${PORT}/health`);
      console.log(`   API Base:     http://localhost:${PORT}/api`);
      console.log(`=================================================`);
    });
  })
  .catch((err) => {
    console.error('[Server Error] Failed to initialize PostgreSQL:', err);
    process.exit(1);
  });
