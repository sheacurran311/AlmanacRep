import { Request, Response, NextFunction } from 'express';

export const errorHandler = (
  _error: Error,
  _req: Request,
  res: Response,
  _next: NextFunction
) => {
  console.error('Error:', _error.message);
  if (_error.stack) console.error('Stack:', _error.stack);
  res.status(500).json({ message: 'Something went wrong!' });
};
