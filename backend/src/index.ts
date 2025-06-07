import express from 'express';
import 'dotenv/config';
import { 
  strategyRoutes,
  agentRoutes,
  marketDataRoutes,
  contractRoutes 
} from './routes/';
import { errorHandler } from './middleware';
// Create Express application
const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(express.json());

// Routes
app.use('/api/strategies', strategyRoutes);
app.use('/api/agent', agentRoutes);
app.use('/api/market-data', marketDataRoutes);
app.use('/api/contracts', contractRoutes);

// Error handling middleware
app.use(errorHandler);

// Start server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (err) => {
  console.error('Unhandled Rejection:', err);
  // Close server & exit process
  process.exit(1);
});
