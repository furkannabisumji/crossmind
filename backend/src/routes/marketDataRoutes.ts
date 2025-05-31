import express from 'express';
import {
  fetchAndStoreMarketData,
  getLatestMarketData,
  getMarketDataHistory,
  getPriceFeedData,
  compareProtocolApys,
} from '../controllers/marketDataController';
import { protect } from '../middleware';
import { asyncRoute } from '../utils/routeUtils';

const router = express.Router();

// All routes are protected
router.use(asyncRoute(protect));

// POST to fetch and store market data
router.post('/', asyncRoute(fetchAndStoreMarketData));

// GET latest market data
router.get('/latest', asyncRoute(getLatestMarketData));

// GET market data history
router.get('/history', asyncRoute(getMarketDataHistory));

// GET price feed data
router.get('/price-feed/:feedId', asyncRoute(getPriceFeedData));

// GET protocol APY comparison
router.get('/compare', asyncRoute(compareProtocolApys));

export default router;
