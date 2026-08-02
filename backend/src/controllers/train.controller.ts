import { Request, Response, NextFunction } from 'express';
import { pool } from '../config/db';

export const getTrains = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await pool.query(`SELECT * FROM trains ORDER BY train_number ASC`);
    const trains = result.rows.map((t: any) => ({
      _id: t.id.toString(),
      trainNumber: t.train_number,
      name: t.name,
      stations: typeof t.route_stations === 'string' ? JSON.parse(t.route_stations) : t.route_stations,
    }));
    res.status(200).json({ success: true, data: trains });
  } catch (error) {
    next(error);
  }
};
