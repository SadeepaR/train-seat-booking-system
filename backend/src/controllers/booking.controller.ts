import { Request, Response, NextFunction } from 'express';
import { createBooking, getBookings } from '../services/booking.service';

export const handleCreateBooking = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { trainId, seatId, passengerName, passengerEmail, originStationId, destinationStationId } = req.body;

    const booking = await createBooking({
      trainId,
      seatId,
      passengerName,
      passengerEmail,
      originStationId,
      destinationStationId,
    });

    res.status(201).json({
      success: true,
      message: 'Seat booked successfully!',
      data: booking,
    });
  } catch (error) {
    next(error);
  }
};

export const handleGetBookings = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const trainId = req.query.trainId as string | undefined;
    const bookings = await getBookings(trainId);

    res.status(200).json({
      success: true,
      data: bookings,
    });
  } catch (error) {
    next(error);
  }
};
