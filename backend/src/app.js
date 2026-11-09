const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const routes = require('./routes');
const errorHandler = require('./middlewares/error.middleware');
const AppError = require('./utils/appError');
const env = require('./config/env');
const setupSwagger = require('./docs/swagger');

const app = express();

// Security Headers
app.use(helmet());

// CORS Configuration with Credentials
app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (like mobile apps, curl or postman)
      if (!origin) return callback(null, true);
      if (env.CORS_ORIGINS.includes(origin) || env.NODE_ENV === 'development') {
        return callback(null, true);
      }
      return callback(new Error('Blocked by CORS policy'));
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
  })
);

// Body and Cookie Parsers
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cookieParser());

// Mount Swagger Documentation
setupSwagger(app);

// Mount Versioned API Routes
app.use('/api/v1', routes);

// Root Welcome Route
app.get('/', (req, res) => {
  res.json({
    name: 'LivingLink API',
    version: '1.0.0',
    documentation: '/api/v1/docs',
    healthCheck: '/api/v1/health'
  });
});

// Handle 404 for unhandled routes
app.all('*', (req, res, next) => {
  next(AppError.notFound(`Cannot find route ${req.method} ${req.originalUrl} on this server`));
});

// Centralized Global Error Handler
app.use(errorHandler);

module.exports = app;
