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
app.post("/modify", (req, res) => {});

app.get("/user", (req, res) => {});


//  server startup
app.listen(port, hostname, () => {
    console.log(`Listening at: http://${hostname}:${port}`);
});