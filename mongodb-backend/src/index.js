require('dotenv').config();
const app = require('./app');
const connectDB = require('./config/database');

// Connect to MongoDB
connectDB();

// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
  console.log('Environment:', process.env.NODE_ENV || 'development');
}); 