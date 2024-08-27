const express = require('express');
const path = require('path');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const cors = require('cors');

require('dotenv').config();

const authMiddleware = require('./authMiddleware'); // Import the auth middleware

const userRoutes = require('./Routes/userRoutes');
const applianceRoutes = require('./Routes/applianceRoutes');
const buttonRoutes = require('./Routes/buttonRoutes');
const apiRoutes = require('./Routes/apiRoutes');

const app = express();
const PORT = process.env.PORT || 3000;

// Connect to MongoDB
const uri =
  `mongodb+srv://${process.env.DB_USERNAME}:${process.env.DB_PASSWORD}@rem.ojbqh5x.mongodb.net/?retryWrites=true&w=majority&appName=ReM`;
mongoose.connect(uri, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

// Connection success and error handling
mongoose.connection.on('connected', () => {
  console.log('Connected to MongoDB successfully');
});

mongoose.connection.on('error', (err) => {
  console.error(`Failed to connect to MongoDB: ${err.message}`);
});

app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Resolve the path to the dist directory
const distPath = path.join(__dirname, '..', 'dist');

// Serve static files from the React app
app.use(express.static(distPath));

app.use('/api/user', userRoutes);
app.use('/api/appliance', applianceRoutes);
app.use('/api/button', authMiddleware, buttonRoutes);
app.use('/api/v1', apiRoutes);

// Protected route
app.get('/api/protected', authMiddleware, (req, res) => {
  res.status(200).json({ username: req.user.username });
});

// Serve the React app
app.get('*', (req, res) => {
  res.sendFile(path.join(distPath, 'index.html'));
});

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
