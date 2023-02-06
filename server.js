require('dotenv').config();
const express = require('express');
const app = express();
const http = require('http');
const path = require('path');
const socketio = require('socket.io');
const mongoose = require('mongoose');
const connectDB = require('./server/database/config');
const PORT = process.env.PORT || 3500;

// Connect to MongoDB
connectDB();

// Create Server
const server = http.createServer(app);

// Serve Static files
app.use(express.static(path.join(__dirname, 'public')));

// Create Instance of socketIo
const io = socketio(server);

mongoose.connection.once('open', () => {
  console.log('Connected to MongoDB');
  app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
});
