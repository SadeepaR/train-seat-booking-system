import { Request, Response, NextFunction } from 'express';
import { pool } from '../config/db';

export const getStations = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await pool.query(`SELECT * FROM stations ORDER BY sequence ASC`);
    const stations = result.rows.map((s: any) => ({
      _id: s.id.toString(),
      name: s.name,
      code: s.code,
      sequence: s.sequence,
      distanceFromOriginKm: s.distance_km,
    }));
    res.status(200).json({ success: true, data: stations });
  } catch (error) {
    next(error);
  }
};
