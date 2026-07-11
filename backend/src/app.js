const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const { errorHandler } = require('./middleware/errorHandler');
const authRoutes = require('./routes/authRoutes');
const dashboardRoutes = require('./routes/dashboardRoutes');
const contentRoutes = require('./routes/contentRoutes');
const brandRoutes = require('./routes/brandRoutes');
const financeRoutes = require('./routes/financeRoutes');
const assetRoutes = require('./routes/assetRoutes');
const analyticsRoutes = require('./routes/analyticsRoutes');
const goalRoutes = require('./routes/goalRoutes');
const collaborationRoutes = require('./routes/collaborationRoutes');
const aiRoutes = require('./routes/aiRoutes');
const logger = require('./utils/logger');

const app = express();

// ─── Security Middleware ───
app.use(helmet());
app.use(cors({
  origin: (origin, callback) => {
    if (!origin) return callback(null, true);
    // Allow any localhost origin
    if (/^https?:\/\/localhost(:\d+)?$/.test(origin)) {
      return callback(null, true);
    }
    const allowed = process.env.CLIENT_URL || 'http://localhost:5173';
    if (origin === allowed) {
      return callback(null, true);
    }
    callback(new Error('Not allowed by CORS'));
  },
  credentials: true,
}));

// ─── Rate Limiting ───
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 min
  max: 200,
  message: { success: false, message: 'Too many requests, please try again later.', data: {} },
});
app.use('/api', limiter);

// Stricter limit for AI endpoints
const aiLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 min
  max: 10,
  message: { success: false, message: 'AI rate limit exceeded. Please wait a moment.', data: {} },
});
app.use('/api/v1/ai', aiLimiter);

// ─── Body Parsing ───
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(morgan('combined', { stream: { write: (msg) => logger.http(msg.trim()) } }));

// ─── Serve uploaded files ───
const path = require('path');
app.use('/uploads', express.static(path.join(__dirname, '..', 'uploads')));

// ─── Health Check ───
app.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'CreatorOS API v1',
    data: {
      version: '1.0.0',
      status: 'healthy',
      timestamp: new Date().toISOString(),
    },
  });
});

app.get('/health', (req, res) => {
  res.json({ success: true, message: 'OK', data: { uptime: process.uptime() } });
});

// ─── API Routes ───
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/dashboard', dashboardRoutes);
app.use('/api/v1/content', contentRoutes);
app.use('/api/v1/brands', brandRoutes);
app.use('/api/v1/finance', financeRoutes);
app.use('/api/v1/assets', assetRoutes);
app.use('/api/v1/analytics', analyticsRoutes);
app.use('/api/v1/goals', goalRoutes);
app.use('/api/v1/collaboration', collaborationRoutes);
app.use('/api/v1/ai', aiRoutes);

// ─── 404 ───
app.use((req, res) => {
  res.status(404).json({ success: false, message: `Route ${req.method} ${req.path} not found`, data: {} });
});

// ─── Error Handler ───
app.use(errorHandler);

module.exports = app;
