const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const connectDB = require('./config/db');
const adminRoutes = require('./routes/adminRoutes');
const staffRoutes = require('./routes/staffRoutes');
const teacherRoutes = require('./routes/teacherRoutes');
const counselorRoutes = require('./routes/counselorRoutes');
const studentRoutes = require('./routes/studentRoutes');
const riskRoutes = require('./routes/riskRoutes');

// Load environment variables
dotenv.config();

// Connect to MongoDB
connectDB();

// Initialize Express app
const app = express();

// Middleware
app.use(cors({ 
  origin: ['http://localhost:5173', 'http://localhost:3000'], // Match Vite/React dev ports
  credentials: true 
}));
app.use(express.json());

// Healthcheck Route
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'Active',
    system: 'Student Dropout Risk System API',
    timestamp: new Date()
  });
});

// API Routes
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/students', require('./routes/studentRoutes'));
app.use('/api/risk', require('./routes/riskRoutes'));
app.use('/api/admin', adminRoutes);
app.use('/api/staff', staffRoutes);
app.use('/api/teacher', teacherRoutes);
app.use('/api/counselor', counselorRoutes);
app.use('/api/student', studentRoutes);
app.use('/api/risk', riskRoutes);

// 404 Catch-All for API routes (Prevents HTML 404 fallback responses)
app.use('/api', (req, res) => {
  res.status(404).json({
    success: false,
    message: `API endpoint not found: ${req.originalUrl}`
  });
});

// Global Error Middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(err.statusCode || 500).json({
    success: false,
    message: err.message || 'Internal Server Error'
  });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Express server running on port ${PORT}`);
});