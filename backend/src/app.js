const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const compression = require('compression');
const rateLimit = require('express-rate-limit');
const routes = require('./routes');
const errorHandler = require('./middlewares/error.middleware');

const app = express();

// ─── Security Headers ────────────────────────────────────────────────────────
app.use(helmet());

// ─── Gzip Compression ────────────────────────────────────────────────────────
// Compresses all API responses. Reduces payload size by 60–80% on JSON.
app.use(compression());

// ─── CORS ────────────────────────────────────────────────────────────────────
const allowedOrigins = [process.env.CORS_ORIGIN, 'http://localhost:5173'].filter(Boolean);
const corsOptions = {
    origin: allowedOrigins.length ? allowedOrigins : '*',
    credentials: true,
    optionsSuccessStatus: 200
};
app.use(cors(corsOptions));

// ─── Body Parsing ─────────────────────────────────────────────────────────────
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// ─── Request Logging ─────────────────────────────────────────────────────────
// Log all requests in dev; log only slow/error responses in production
if (process.env.NODE_ENV !== 'production') {
    app.use(morgan('dev'));
} else {
    // In production, log combined format (Apache-style) for monitoring
    app.use(morgan('combined'));
}

// ─── Rate Limiting ───────────────────────────────────────────────────────────

// General API limiter — 200 req/min per seller IP
const apiLimiter = rateLimit({
    windowMs: 60 * 1000,
    max: 200,
    standardHeaders: true,
    legacyHeaders: false,
    message: { success: false, message: 'Too many requests, please try again later.' }
});

// Stricter limiter for auth endpoints — 20 req/min per IP
const authLimiter = rateLimit({
    windowMs: 60 * 1000,
    max: 20,
    standardHeaders: true,
    legacyHeaders: false,
    message: { success: false, message: 'Too many login attempts, please try again later.' }
});

// Reports endpoints can be heavy — 30 req/min per IP
const reportsLimiter = rateLimit({
    windowMs: 60 * 1000,
    max: 30,
    standardHeaders: true,
    legacyHeaders: false,
    message: { success: false, message: 'Too many analytics requests, please slow down.' }
});

// ─── Health Check ─────────────────────────────────────────────────────────────
app.get('/health', (req, res) => {
    res.status(200).json({ status: 'ok', timestamp: new Date().toISOString() });
});

// ─── Apply Limiters ───────────────────────────────────────────────────────────
app.use('/api/auth', authLimiter);
app.use('/api/analytics', reportsLimiter);
app.use('/api', apiLimiter);

// ─── Routes ───────────────────────────────────────────────────────────────────
app.use('/api', routes);

// ─── Error Handler ────────────────────────────────────────────────────────────
app.use(errorHandler);

module.exports = app;
