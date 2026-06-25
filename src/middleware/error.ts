import { Request, Response, NextFunction } from 'express';
import { ApiError } from '../utils/ApiError';

export function notFound(_req: Request, res: Response): void {
  res.status(404).json({ success: false, message: 'Route not found' });
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function errorHandler(err: unknown, _req: Request, res: Response, _next: NextFunction): void {
  if (err instanceof ApiError) {
    res.status(err.statusCode).json({ success: false, message: err.message, details: err.details });
    return;
  }
  const message = err instanceof Error ? err.message : 'Internal server error';
  console.error('[error]', err);
  res.status(500).json({ success: false, message });
}
