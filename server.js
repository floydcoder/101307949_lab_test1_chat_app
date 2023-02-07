require('dotenv').config();
const express = require('express');
const app = express();
const http = require('http');
const path = require('path');
const socketio = require('socket.io');
const mongoose = require('mongoose');
const session = require('express-session');
const connectDB = require('./config/db');
const PORT = process.env.PORT || 3500;

// Connect to MongoDB
connectDB();

// Create Server
const server = http.createServer(app);

// Serve Static files
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

// Create Instance of socketIo
const io = socketio(server);

const botName = 'Admin';

app.set('trust proxy', 1);
app.use(
  session({
    secret: 'my cool secret',
    resave: false,
    saveUninitialized: true,
  })
);

const requireAuth = (req, res, next) => {
  if (!req.session.username) {
    return res.status(401).redirect('/login');
  }
  next();
};

// Run this code whenever a client connects
io.on('connection', (socket) => {
  socket.on('joinRoom', ({ username, room }) => {
    const user = userJoin(socket.id, username, room);
    socket.join(user.room);
    // Welcome a new user
    socket.emit('message', formatMessage(botName, 'Welcome to the Chat!'));
    // Broadcast when a user connects
    socket.broadcast
      .to(user.room)
      .emit(
        'message',
        formatMessage(botName, `A ${user.username} has join the chat`)
      );
    // Send users and room info
    io.to(user.room).emit('roomUsers', {
      room: user.room,
      users: getRoomUsers(user.room),
    });
  });

  // Listen for chatMessage
  socket.on('chatMessage', (msg) => {
    const user = getCurrentUser(socket.id);
    io.to(user.room).emit('message', formatMessage(user.username, msg));
  });

  // Runs when client disconnect
  socket.on('disconnect', () => {
    const user = userLeave(socket.id);
    if (user) {
      io.to(user.room).emit(
        'message',
        formatMessage(botName, `${user.username} has left the chat`)
      );
      // Send users and room info
      io.to(user.room).emit('roomUsers', {
        room: user.room,
        users: getRoomUsers(user.room),
      });
    }
  });
});

app.get('/', requireAuth, (req, res) => {
  res.sendFile(path.join(__dirname, './views/rooms.html'));
});

app.get('/login', (req, res) => {
  res.sendFile(path.join(__dirname, './views/login.html'));
});

app.get('/signup', (req, res) => {
  res.sendFile(path.join(__dirname, './views/signup.html'));
});

app.get('/chat', requireAuth, (req, res) => {
  res.sendFile(path.join(__dirname, './views/chat.html'));
});

app.post('/create-user', (req, res) => {
  // get sign up data form
  const { username, password } = req.body;
  console.log(username);
  // TODO: create user in db

  // create session for user
  req.session.save(() => {
    req.session.username = username; //'id from db object';
    res.redirect('/');
  });
});

app.post('/login-user', (req, res) => {
  // get sign up data form
  const { username, password } = req.body;
  console.log(username, password);
  // TODO: validate credentials against db
  // if ivalid, send back a resposne for invaliditiy

  // create session for user
  req.session.save(() => {
    req.session.username = username; //'id from db object';
    res.redirect('/');
  });
});

app.get('/api/logged-in-user', requireAuth, (req, res) => {
  const username = req.session.userId;
  res.json({ username: username });
});

mongoose.connection.once('open', () => {
  console.log('Connected to MongoDB');
  app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
});
