import { Request, Response, NextFunction } from 'express';
import { ErrorResponse } from '../types';

/**
 * Error handling middleware
 */
export const errorHandler = (
  err: Error,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  console.error(err);

  const errorResponse: ErrorResponse = {
    message: err.message || 'Server Error',
  };

  // Include stack trace in development environment
  if (process.env.NODE_ENV === 'development') {
    errorResponse.stack = err.stack;
  }

  res.status(500).json(errorResponse);
};
