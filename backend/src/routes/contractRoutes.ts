import express from 'express';
import {
  deposit,
  withdraw,
  executeInvestmentStrategy,
  exitInvestmentStrategy,
  getBalances,
  getUserStrategies,
  getChainProtocols
} from '../controllers/contractController';
import { protect } from '../middleware';
import { asyncRoute } from '../utils/routeUtils';

const router = express.Router();

// All routes are protected
router.use(asyncRoute(protect));

// Deposit and withdraw routes
router.post('/deposit', asyncRoute(deposit));
router.post('/withdraw/:index', asyncRoute(withdraw));

// Strategy execution routes
router.post('/execute-strategy', asyncRoute(executeInvestmentStrategy));
router.post('/exit-strategy/:index', asyncRoute(exitInvestmentStrategy));

// Query routes
router.get('/balances', asyncRoute(getBalances));
router.get('/strategies', asyncRoute(getUserStrategies));
router.get('/protocols/:chainId', asyncRoute(getChainProtocols));

export default router;
