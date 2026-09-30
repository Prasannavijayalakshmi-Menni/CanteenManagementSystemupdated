const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');

// Load env vars
dotenv.config();


const connectDB = require('./config/database');
const Token = require('./models/Token');
const authRoutes = require("./routes/auth");

// Connect to database
connectDB();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use('/api/tokens', require('./routes/tokens'));
app.use('/api/auth', authRoutes);
app.use("/api/menu", require("./routes/menu"));
app.use("/api/orders", require("./routes/orders"));
app.use("/api/reviews", require("./routes/reviews"));
// ✅ ADD THIS - Root API endpoint
app.get('/api', (req, res) => {
  res.json({
    message: '🍽️ Canteen Management System API',
    version: '1.0.0',
    status: 'Server is running ✅',
    endpoints: {
      'All Tokens': 'GET /api/tokens',
      'Single Token': 'GET /api/tokens/:id',
      'Create Token': 'POST /api/tokens',
      'Update Token': 'PUT /api/tokens/:id',
      'Delete Token': 'DELETE /api/tokens/:id',
      'Update Status': 'PATCH /api/tokens/:id/status',
      'Statistics': 'GET /api/tokens/stats',
      'Cleanup Status': 'GET /api/tokens/cleanup/status',
      'Manual Cleanup': 'POST /api/tokens/cleanup/now'
    }
  });
});

// Basic route
app.get('/', (req, res) => {
  res.json({
    message: '🍽️ Canteen Management System API',
    version: '1.0.0',
    instructions: 'Use /api to see all available endpoints'
  });
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📊 MongoDB: ${process.env.MONGODB_URI}`);
  console.log(`🔗 API: http://localhost:${PORT}/api`);
  console.log(`🧹 Auto-cleanup: Enabled (manual cleanup available)`);
});

// Auto-cleanup job - runs every hour
const startCleanupJob = () => {
  setInterval(async () => {
    try {
      const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
      const result = await Token.deleteMany({
        status: 'Served',
        servedAt: { $lt: twentyFourHoursAgo },
        autoDelete: true
      });

      if (result.deletedCount > 0) {
        console.log(`🧹 Auto-cleanup: Deleted ${result.deletedCount} old served tokens`);
      }
    } catch (error) {
      console.error('Auto-cleanup job failed:', error);
    }
  }, 60 * 60 * 1000); // Run every hour
};

// Start the cleanup job
startCleanupJob();