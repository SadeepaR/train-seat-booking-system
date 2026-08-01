import { Request, Response, NextFunction } from 'express';
import { getSeatAvailability } from '../services/availability.service';
import { ValidationError } from '../utils/errors';

export const checkAvailability = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { trainId, originStationId, destinationStationId } = req.query;

    if (!trainId || !originStationId || !destinationStationId) {
      throw new ValidationError('trainId, originStationId, and destinationStationId query parameters are required');
    }

    const availability = await getSeatAvailability({
      trainId: trainId as string,
      originStationId: originStationId as string,
      destinationStationId: destinationStationId as string,
    });

    res.status(200).json({ success: true, data: availability });
  } catch (error) {
    next(error);
  }
};
