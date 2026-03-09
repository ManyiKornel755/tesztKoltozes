const express = require('express');
const cors = require('cors');
require('dotenv').config();

const { testConnection } = require('./config/database');
const errorHandler = require('./middlewares/errorHandler');

const app = express();

// Middleware
app.use(cors({ origin: process.env.CORS_ORIGIN || 'http://localhost:5173' }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static files from uploads directory
app.use('/uploads', express.static('uploads'));

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'OK', message: 'Server is running' });
});

// Import routes
const authRoutes = require('./routes/auth');
const usersRoutes = require('./routes/users');
const rolesRoutes = require('./routes/roles');
const eventsRoutes = require('./routes/events');
const trainingsRoutes = require('./routes/trainings');
const messagesRoutes = require('./routes/messages');
const transactionsRoutes = require('./routes/transactions');
const userDocumentsRoutes = require('./routes/user-documents');
const certificatesRoutes = require('./routes/certificates');

// Register routes with /api prefix
app.use('/api/auth', authRoutes);
app.use('/api/users', usersRoutes);
app.use('/api/roles', rolesRoutes);
app.use('/api/events', eventsRoutes);
app.use('/api/trainings', trainingsRoutes);
app.use('/api/messages', messagesRoutes);
app.use('/api/transactions', transactionsRoutes);
app.use('/api/user-documents', userDocumentsRoutes);
app.use('/api/certificates', certificatesRoutes);

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    error: 'Route not found',
    status: 404
  });
});

// Error handler middleware (must be last!)
app.use(errorHandler);

const PORT = process.env.PORT || 3000;

// Start server
const startServer = async () => {
  try {
    // Test database connection
    const dbConnected = await testConnection();
    if (!dbConnected) {
      console.error('Failed to connect to database. Exiting...');
      process.exit(1);
    }

    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
      console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
    });
  } catch (error) {
    console.error('Error starting server:', error);
    process.exit(1);
  }
};

startServer();

module.exports = app;
