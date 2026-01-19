const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');

const config = require('./config/env');
const errorHandler = require('./middlewares/error.middleware');
const { NotFoundError } = require('./utils/errors');

// Generic Routes
const shopRoutes = require('./modules/shop/shop.routes');
const categoryRoutes = require('./modules/category/category.routes');
const itemRoutes = require('./modules/item/item.routes');
const discountRoutes = require('./modules/discount/discount.routes');

const app = express();

// Security & Utility Middleware
app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

if (config.NODE_ENV !== 'test') {
    app.use(morgan('dev'));
}

// Health Check
app.get('/health', (req, res) => {
    res.status(200).json({ status: 'ok', timestamp: new Date() });
});

// API Routes
app.use('/api/v1/shop', shopRoutes);
app.use('/api/v1/categories', categoryRoutes);
app.use('/api/v1/items', itemRoutes);
app.use('/api/v1/discounts', discountRoutes);

// 404 Handler
app.use((req, res, next) => {
    next(new NotFoundError(`Route ${req.originalUrl} not found`));
});

// Global Error Handler
app.use(errorHandler);

module.exports = app;
