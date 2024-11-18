const express = require("express");
const app = express();
const path = require("path");
const cors = require('cors');

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

//  server startup
app.listen(port, hostname, () => {
  console.log(`Listening at: http://${hostname}:${port}`);
});
