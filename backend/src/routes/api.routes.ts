import { Router } from 'express';
import { getStations } from '../controllers/station.controller';
import { getTrains } from '../controllers/train.controller';
import { checkAvailability } from '../controllers/availability.controller';
import { handleCreateBooking, handleGetBookings } from '../controllers/booking.controller';
import { handleSeedDatabase } from '../controllers/seed.controller';

const router = Router();

// Station routes
router.get('/stations', getStations);

// Train routes
router.get('/trains', getTrains);

// Seat Availability route
router.get('/availability', checkAvailability);

// Booking routes
router.post('/bookings', handleCreateBooking);
router.get('/bookings', handleGetBookings);

// Database Seeding / Reset route
router.post('/seed', handleSeedDatabase);

export default router;
