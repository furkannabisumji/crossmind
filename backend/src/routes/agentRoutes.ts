import express from 'express';
import {
  executeAgentDecision,
  generateRebalance,
  setupAutomation,
  getAgentDecisions,
} from '../controllers/agentController';
import { protect } from '../middleware';
import { asyncRoute } from '../utils/routeUtils';

const router = express.Router();

// All routes are protected
router.use(asyncRoute(protect));

// Execute agent decision
router.post('/execute/:decisionId', asyncRoute(executeAgentDecision));

// Generate rebalance for strategy
router.post('/rebalance/:strategyId', asyncRoute(generateRebalance));

// Setup automation for strategy
router.post('/automate/:strategyId', asyncRoute(setupAutomation));

// Get agent decisions
router.get('/:strategyId/decisions', asyncRoute(getAgentDecisions));

// Get agent decisions for strategy
router.get('/decisions/:strategyId', async (req, res, next) => {
  try {
    await getAgentDecisions(req, res);
  } catch (error) {
    next(error);
  }
});

export default router;
