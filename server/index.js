require('dotenv').config();

const express = require('express');
const cors = require('cors');
const routes = require('./routes/index');
const { testConnection } = require('./db/db');

const app = express();
const PORT = process.env.PORT || 5001;

// Middleware
app.use(cors());
app.use(express.json());

// API Routes
app.use('/api', routes);

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something went wrong!' });
});

// Start server
app.listen(PORT, async () => {
  console.log(`Server is running on port ${PORT}`);
  console.log(`Health check: http://localhost:${PORT}/api/health`);
  
  const dbConnected = await testConnection();
  if (dbConnected) {
    console.log('Database connection established');
  } else {
    console.log('\n Database connection failed, but server continues running...');
  }
});
