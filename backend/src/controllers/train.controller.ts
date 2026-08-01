import { Request, Response, NextFunction } from 'express';
import { Train } from '../models/Train';

export const getTrains = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const trains = await Train.find().sort({ trainNumber: 1 });
    res.status(200).json({ success: true, data: trains });
  } catch (error) {
    next(error);
  }
};
