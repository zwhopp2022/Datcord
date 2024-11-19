const express = require("express");
const app = express();
const path = require("path");
const cors = require('cors');
const axios = require("axios");

const port = 3001;
const hostname = "localhost";

app.use(cors({
  origin: 'http://localhost:3000',  // Allow requests from this specific origin
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

//  server startup
app.listen(port, hostname, () => {
  console.log(`Listening at: http://${hostname}:${port}`);
});
