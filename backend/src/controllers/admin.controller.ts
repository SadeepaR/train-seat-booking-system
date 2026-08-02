import { Request, Response, NextFunction } from 'express';
import { getAdminDepartmentStats } from '../services/admin.service';

export const handleGetAdminStats = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const stats = await getAdminDepartmentStats();
    res.status(200).json({ success: true, data: stats });
  } catch (error) {
    next(error);
  }
};
