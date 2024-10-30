const express = require("express");
const app = express();
const path = require("path");

const port = 3001;
const hostname = "localhost";

app.use(express.static(path.join(__dirname, 'public')));

app.get('/profile', (req, res) => {
  res.sendFile(path.resolve(__dirname, 'public', 'profile.html')); 
});

//  server startup
app.listen(port, hostname, () => {
  console.log(`Listening at: http://${hostname}:${port}`);
});
