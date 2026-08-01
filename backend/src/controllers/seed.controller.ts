import { Request, Response, NextFunction } from 'express';
import { seedDatabase } from '../services/seed.service';

export const handleSeedDatabase = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await seedDatabase();
    res.status(200).json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
};
