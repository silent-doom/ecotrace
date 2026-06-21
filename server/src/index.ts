import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import usersRouter from './routes/users.js';
import footprintRouter from './routes/footprint.js';
import actionsRouter from './routes/actions.js';
import insightsRouter from './routes/insights.js';

const app = express();
const PORT = process.env.PORT ?? 3001;

// ── Security middleware ─────────────────────────────────────────────────────
app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' }, // allow CDN assets
}));

// Rate limiting: 100 req/15min per IP (prevents brute-force / abuse)
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests. Please try again later.' },
});
app.use('/api', limiter);

// Stricter limiter for write endpoints (10 req/15min)
const writeLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: { error: 'Too many write requests. Please slow down.' },
});
app.use('/api/users', writeLimiter);

app.use(cors({
  origin: process.env.NODE_ENV === 'production'
    ? process.env.FRONTEND_URL ?? true
    : ['http://localhost:5173', 'http://localhost:5174', 'http://localhost:3000'],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));
app.use(express.json({ limit: '100kb' })); // reject oversized payloads

// ── Health check ────────────────────────────────────────────────────────────
app.get('/health', (_req, res) => res.json({
  status: 'ok',
  timestamp: new Date().toISOString(),
  version: process.env.npm_package_version ?? '1.0.0',
}));

// ── Routes ──────────────────────────────────────────────────────────────────
app.use('/api/users', usersRouter);
app.use('/api/footprint', footprintRouter);
app.use('/api/actions', actionsRouter);
app.use('/api/insights', insightsRouter);
app.use('/api/averages', insightsRouter);

// ── 404 handler ─────────────────────────────────────────────────────────────
app.use((_req, res) => res.status(404).json({ error: 'Route not found' }));

// ── Global error handler ─────────────────────────────────────────────────────
app.use((err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  const isDev = process.env.NODE_ENV !== 'production';
  console.error('[EcoTrace Error]', err.stack);
  res.status(500).json({
    error: 'Internal server error',
    ...(isDev && { message: err.message, stack: err.stack }),
  });
});

app.listen(PORT, () => {
  console.log(`🌿 EcoTrace API running on http://localhost:${PORT}`);
});
