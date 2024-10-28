const pg = require("pg");
const express = require("express");
const app = express();

const port = 3000;
const hostname = "localhost";

const env = require("../env.json");
const Pool = pg.Pool;
const pool = new Pool(env);

// startup connections and middleware
pool.connect().then(function () {
    console.log(`Connected to database ${env.database}`);
});
  
app.use(express.static("public"));
app.use(express.json());

// event handlers

// send username, get back user object
// populated with updated user information
app.post("/modify-user", (req, res) => {
    
});


// send username, get all information about user
// in an object
app.get("/get-user", (req, res) => {

});

// send all relevant fields, user object
// is made in database
app.post("/add-user", (req, res) => {

});

// send username, returns bool
// true if user exists, false if not
app.get("/search-user", (req, res) => {

});


//  server startup
app.listen(port, hostname, () => {
    console.log(`Listening at: http://${hostname}:${port}`);
});