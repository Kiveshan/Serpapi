const express = require('express');
const cors = require('cors');
const publicationsRoutes = require('./routes/publications/publications.routes');

const app = express();
const PORT = process.env.PORT || 5001;

// Middleware
app.use(cors());
app.use(express.json());

// API Routes
app.use('/api', publicationsRoutes);

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something went wrong!' });
});

// Start server
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
  console.log(`Health check: http://localhost:${PORT}/api/health`);
  console.log('\n✅ SerpApi is configured and active!');
  console.log('🔄 Will fallback to Semantic Scholar if SerpApi fails');
  console.log('🔄 Will fallback to web scraping if both APIs fail');
  console.log('🎯 Results are automatically filtered and ranked by relevance');
  console.log('📅 Year-based filtering now supported!');
});
