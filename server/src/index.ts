import express from 'express';
import cors from 'cors';
import usersRouter from './routes/users.js';
import footprintRouter from './routes/footprint.js';
import actionsRouter from './routes/actions.js';
import insightsRouter from './routes/insights.js';

const app = express();
const PORT = process.env.PORT ?? 3001;

app.use(cors({
  origin: process.env.NODE_ENV === 'production'
    ? true  // allow all in prod — tighten to Vercel URL after first deploy
    : ['http://localhost:5173', 'http://localhost:5174', 'http://localhost:3000'],
}));
app.use(express.json());

// Health check
app.get('/health', (_req, res) => res.json({ status: 'ok', timestamp: new Date().toISOString() }));

// Routes
app.use('/api/users', usersRouter);
app.use('/api/footprint', footprintRouter);
app.use('/api/actions', actionsRouter);
app.use('/api/insights', insightsRouter);
app.use('/api/averages', insightsRouter);

// 404 handler
app.use((_req, res) => res.status(404).json({ error: 'Route not found' }));

// Error handler
app.use((err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Internal server error', message: err.message });
});

app.listen(PORT, () => {
  console.log(`🌿 EcoTrace API running on http://localhost:${PORT}`);
});
