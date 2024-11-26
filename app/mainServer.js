const express = require("express");
const path = require("path");
const cors = require('cors');
const axios = require("axios");
const { Server } = require("socket.io");
const http = require("http");
const cookieParser = require("cookie-parser");

const app = express();

const port = 3001;
const hostname = "localhost";

const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin: "http://localhost:3000",
        methods: ["GET", "POST"],
        credentials: true
    }
});

app.use(cors({
  origin: 'http://localhost:3000',
  credentials: true
}));

app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.get('/', (req, res) => {
  let { token } = req.cookies;
  if (token) {
    res.redirect('/home');
  } else {
    res.redirect('/login');
  }
});

app.get('/profile', (req, res) => {
  res.sendFile(path.resolve(__dirname, 'public', 'profile', 'profile.html')); 
});

app.get('/friends', (req, res) => {
  res.sendFile(path.resolve(__dirname, 'public', 'friends', 'friends.html')); 
});

app.get('/home', (req, res) => {
  res.sendFile(path.resolve(__dirname, 'public', 'home', 'home.html')); 
});

app.get('/login', (req, res) => {
  res.sendFile(path.resolve(__dirname, 'public', 'login', 'login.html')); 
});

app.get('/register', (req, res) => {
  res.sendFile(path.resolve(__dirname, 'public', 'register', 'register.html')); 
});

app.get("/home/chat", (req, res) => {
  let roomId = req.query.roomId;
  console.log(roomId);
  if (!searchRoom(roomId)) {
      return res.status(404).send();
  }
  console.log("Sending room", roomId);
  res.sendFile(path.resolve(__dirname, 'public', 'chat', 'chat.html'));
});

let rooms = {};

io.on("connection", (socket) => {
    console.log(`Socket ${socket.id} connected`);
    
    let roomId = socket.handshake.query.roomId;
    console.log("Room ID from query:", roomId);

    
    if (!rooms[roomId]) {
        rooms[roomId] = {};
    }

    rooms[roomId][socket.id] = socket;

    socket.on("messageBroadcast", (data) => {
        console.log(`Broadcasting message in room ${roomId}:`, data);
        
        Object.values(rooms[roomId]).forEach(clientSocket => {
            if (clientSocket.id !== socket.id) {
                clientSocket.emit("messageBroadcast", data);
            }
        });
    });

    socket.on("disconnect", () => {
        console.log(`Socket ${socket.id} disconnected from room ${roomId}`);
        if (rooms[roomId]) {
            delete rooms[roomId][socket.id];
            // Clean up empty rooms
            if (Object.keys(rooms[roomId]).length === 0) {
                delete rooms[roomId];
            }
        }
    });
});

server.listen(port, hostname, () => {
  console.log(`Listening at: http://${hostname}:${port}`);
});
