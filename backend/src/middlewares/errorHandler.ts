import { Request, Response, NextFunction } from 'express';
import { BookingConflictError, ValidationError } from '../utils/errors';

export const errorHandler = (
  err: any,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  console.error('[Error Handler]', err);

  if (err instanceof BookingConflictError) {
    return res.status(409).json({
      success: false,
      errorType: 'BOOKING_CONFLICT',
      message: err.message,
      conflictingBooking: err.conflictingBooking,
    });
  }

  if (err instanceof ValidationError) {
    return res.status(400).json({
      success: false,
      errorType: 'VALIDATION_ERROR',
      message: err.message,
    });
  }

  return res.status(500).json({
    success: false,
    errorType: 'INTERNAL_SERVER_ERROR',
    message: err.message || 'An unexpected internal server error occurred',
  });
};
