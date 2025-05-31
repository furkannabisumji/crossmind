import express from 'express';
import {
  createStrategy,
  getStrategies,
  getStrategyById,
  updateStrategy,
  deleteStrategy,
  generateAiStrategy,
} from '../controllers/strategyController';
import { protect } from '../middleware';
import { asyncRoute } from '../utils/routeUtils';

const router = express.Router();

// All routes are protected
router.use(asyncRoute(protect));

// POST to create a new strategy
router.post('/', asyncRoute(createStrategy));

// GET all strategies
router.get('/', asyncRoute(getStrategies));

// GET a strategy by ID
router.get('/:id', asyncRoute(getStrategyById));

// PUT to update a strategy
router.put('/:id', asyncRoute(updateStrategy));

// DELETE a strategy
router.delete('/:id', asyncRoute(deleteStrategy));

// Generate AI strategy
router.post('/generate', asyncRoute(generateAiStrategy));

export default router;
