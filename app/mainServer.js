const express = require("express");
const app = express();
const path = require("path");
const cors = require('cors');
const axios = require("axios");
const { Server } = require("socket.io");
const http = require("http");

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

app.use(express.static(path.join(__dirname, 'public')));

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

app.get('/chat', async (req, res) => {
  try {
    const response = await axios.get(`http://localhost:3000/chat?roomId=${req.query.roomId}`, {
      responseType: 'arraybuffer', // to handle binary data if necessary
    });

    res.set('Content-Type', 'text/html');
    res.send(response.data);
  } catch (error) {
    console.error("Error fetching the chat file:", error);
    res.status(500).send("Error loading the chat file.");
  }
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
