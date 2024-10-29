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

// send username, delete old user, add new one with updated information
// NOTE: if you want to only update one field, set the new value in 'updated<target>'
// and set all other fields to current value in that user object
// the current user information can either be gotten from the profile page and grabbed in one go
// or can be gotten from the /get-user endpoint 

app.post("/modify-user", (req, res) => {
    let body = req.body;
    // make sure body has all relevant attributes
    if (
        body.hasOwnProperty("username") &&
        body.hasOwnProperty("updatedUsername") &&
        body.hasOwnProperty("updatedHashedPassword") &&
        body.hasOwnProperty("updatedBio") &&
        body.hasOwnProperty("updatedStatus") &&
        body.hasOwnProperty("updatedDate")
    ) {
        if (
            (body["updatedUsername"].length > 0 && body["updatedUsername"].length <= 16) &&
            (body["updatedHashedPassword"].length == 256) &&
            (body["updatedBio"].length >= 0 && body["updatedBio"].length <= 190) &&
            (body["updatedStatus"].length >= 0 && body["updatedStatus"].length <= 16) &&
            (body["updatedDate"].length == 3)
        ) {
            // format date and query, delete old user, then add back same user with updated information

            pool.query(`DELETE FROM Users AS U WHERE U.username = $1`,
                 [body["username"]]
            ).then((result) => {

                let formattedDate = `${body["updatedDate"][0]}-${body["updatedDate"][1].padStart(2, '0')}-${body["updatedDate"][2].padStart(2, '0')}`;
                pool.query(
                    `INSERT INTO Users (username, hashedPassword, bio, status, birthday) VALUES($1, $2, $3, $4, $5)`,
                    [body["updatedUsername"], body["updatedHashedPassword"], body["updatedBio"], body["updatedStatus"], formattedDate]
                ).then((result) => {
                    return res.status(200).json({ "message": "user successfully modified" });
                }).catch((error) => {
                    return res.status(400).json({ "message": "failed to find user in database" });
                });

            }).catch((error) => {
                return res.status(400).json({ "message": "failed to update user in database" });
            });

        } else {
            return res.status(500).json({ "error": "misformatted user information" });
        }
    } else {
        return res.status(500).json({ "error": "missing user information" });
    }
});


// send username, get all information about user
// in an object
// NOTE: it is assumed this server is not open to the public,
// hence why passwords are available to grab here
app.get("/get-user", (req, res) => {
    let username = req.query.username;
    if (username) {
        pool.query(`SELECT DISTINCT U.username, U.hashedPassword, U.bio, U.status, U.status, U.birthday FROM Users U WHERE U.username = $1`, [username])
        .then((result) => {
            let userObj = result.rows[0]
            return res.status(200).json(userObj);
        }).catch((error) => {
            return res.status(400).json({ "error": "user not found" });
        });
    }
});

// send all relevant fields, user object
// is made in database
app.post("/add-user", (req, res) => {
    let body = req.body;
    // make sure body has all relevant attributes
    if (
        body.hasOwnProperty("username") &&
        body.hasOwnProperty("hashedPassword") &&
        body.hasOwnProperty("bio") &&
        body.hasOwnProperty("status") &&
        body.hasOwnProperty("date")
    ) {
        if (
            (body["username"].length > 0 && body["username"].length <= 16) &&
            (body["hashedPassword"].length == 256) &&
            (body["bio"].length >= 0 && body["bio"].length <= 190) &&
            (body["status"].length >= 0 && body["status"].length <= 16) &&
            (body["date"].length == 3)
        ) {
            // format date and query, send query and then catch any errors
            let formattedDate = `${body["date"][0]}-${body["date"][1].padStart(2, '0')}-${body["date"][2].padStart(2, '0')}`;
            pool.query(
                `INSERT INTO Users (username, hashedPassword, bio, status, birthday) VALUES($1, $2, $3, $4, $5)`,
                [body["username"], body["hashedPassword"], body["bio"], body["status"], formattedDate]
            ).then((result) => {
                return res.status(200).json({ "message": "user successfully added to database" });
            }).catch((error) => {
                return res.status(400).json({ "message": "failed to add user to database" });
            });
        } else {
            return res.status(500).json({ "error": "misformatted user information" });
        }
    } else {
        return res.status(500).json({ "error": "missing user information" });
    }

});

// send username, returns bool
// true if user exists, false if not
app.get("/search-user", (req, res) => {
    let username = req.query.username;
    if (username) {
        pool.query(`SELECT DISTINCT U.username, U.bio, U.status, U.status, U.birthday FROM Users U WHERE U.username = $1`, [username])
        .then((result) => {
            let userObj = result.rows
            if (userObj.length == 1) {
                return res.status(200).json({ "result": true });
            } else {
                return res.status(200).json({ "result": false });
            }
        }).catch((error) => {
            return res.status(400).json({ "error": "user not found" });
        });
    }
});


//  server startup
app.listen(port, hostname, () => {
    console.log(`Listening at: http://${hostname}:${port}`);
});