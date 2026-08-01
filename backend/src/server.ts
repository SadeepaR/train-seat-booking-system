import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { connectDB } from './config/db';
import apiRoutes from './routes/api.routes';
import { errorHandler } from './middlewares/errorHandler';
import { Station } from './models/Station';
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

// Connect DB and launch server
connectDB().then(async () => {
  // Auto-seed if database has no stations
  const count = await Station.countDocuments();
  if (count === 0) {
    console.log('[Auto-Seed] Initializing database with Colombo Fort - Badulla data...');
    await seedDatabase();
  }

  app.listen(PORT, () => {
    console.log(`=================================================`);
    console.log(`🚆 Train Seat Booking API running on port ${PORT}`);
    console.log(`   Health Check: http://localhost:${PORT}/health`);
    console.log(`   API Base:     http://localhost:${PORT}/api`);
    console.log(`=================================================`);
  });
});
