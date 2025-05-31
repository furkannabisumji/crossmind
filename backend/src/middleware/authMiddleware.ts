import { Request, Response, NextFunction } from 'express';
import prisma from '../clients/prisma';

/**
 * Middleware to verify wallet signature
 */
export const verifyWalletSignature = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { walletAddress, signature, message } = req.body;

    if (!walletAddress || !signature || !message) {
      return res.status(401).json({
        message: 'Authentication failed: Missing wallet address, signature, or message',
      });
    }

    // TODO: Implement actual signature verification logic
    // This would typically use ethers.js or viem to verify the signature

    // For now, we'll just check if the wallet address exists in our database
    const user = await prisma.user.findUnique({
      where: { walletAddress },
    });

    if (!user) {
      return res.status(401).json({
        message: 'Authentication failed: User not found',
      });
    }

    // Add user to request object
    req.user = user;
    next();
  } catch (error) {
    next(error);
  }
};

/**
 * Middleware to protect routes
 */
export const protect = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const walletAddress = req.headers['x-wallet-address'] as string;

    if (!walletAddress) {
      return res.status(401).json({
        message: 'Not authorized, no wallet address',
      });
    }

    // Find user by wallet address
    const user = await prisma.user.findUnique({
      where: { walletAddress },
    });

    if (!user) {
      return res.status(401).json({
        message: 'Not authorized, user not found',
      });
    }

    // Add user to request object
    req.user = user;
    next();
  } catch (error) {
    next(error);
  }
};

// Extend Express Request interface to include user
declare global {
  namespace Express {
    interface Request {
      user?: any;
    }
  }
}
