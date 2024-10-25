import { Request, Response, NextFunction } from 'express';

export const errorHandler = (
  _req: Request,
  res: Response,
  _next: NextFunction
) => {
  return (err: Error) => {
    console.error(err.stack);
    res.status(500).json({ message: 'Something went wrong!' });
  };
};
