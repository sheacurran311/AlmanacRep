import { Request, Response, NextFunction } from 'express';
import { LoginRequest, RegistrationRequest } from '../controllers/authController.js';

export const validateLoginInput = (
  req: Request<{}, {}, LoginRequest>,
  res: Response,
  next: NextFunction
) => {
  const { email, password, tenantId } = req.body;

  if (!email || !password || !tenantId) {
    return res.status(400).json({
      message: 'Email, password, and tenant ID are required'
    });
  }

  // Basic email validation
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return res.status(400).json({
      message: 'Invalid email format'
    });
  }

  next();
};

export const validateRegistrationInput = (
  req: Request<{}, {}, RegistrationRequest>,
  res: Response,
  next: NextFunction
) => {
  const { fullName, email, companyName, password } = req.body;

  if (!fullName || !email || !companyName || !password) {
    return res.status(400).json({
      message: 'All fields are required'
    });
  }

  // Full name validation
  if (fullName.length < 2) {
    return res.status(400).json({
      message: 'Full name must be at least 2 characters long'
    });
  }

  // Email validation
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return res.status(400).json({
      message: 'Invalid email format'
    });
  }

  // Company name validation
  if (companyName.length < 2) {
    return res.status(400).json({
      message: 'Company name must be at least 2 characters long'
    });
  }

  // Password validation
  const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/;
  if (!passwordRegex.test(password)) {
    return res.status(400).json({
      message: 'Password must be at least 8 characters long and contain at least one uppercase letter, one lowercase letter, and one number'
    });
  }

  next();
};
