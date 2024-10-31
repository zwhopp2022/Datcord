const pg = require("pg");
const express = require("express");
const bcrypt = require('bcrypt');
const app = express();

const port = 3000;
const hostname = "localhost";

const env = require("../appSettings.json");
const Pool = pg.Pool;
const pool = new Pool(env); 

async function searchHelper(username) {
    if (username) {
        return pool.query(`SELECT DISTINCT U.username, U.bio, U.status, U.status, U.birthday FROM Users U WHERE U.username = $1`, [username])
        .then((result) => {
            let userObj = result.rows;
            if (userObj.length == 1) {
                return true
            } else {
                return false
            }
        }).catch((error) => {
            return false
        });
    } else {
        return false;
    }
}

async function hashPassword(password) {
    let salt = await bcrypt.genSalt();
    let hashedPassword = await bcrypt.hash(password, salt);

    return hashedPassword;
}

function checkAttributes(body) {
    if (
        body.hasOwnProperty("username") &&
        body.hasOwnProperty("password") &&
        body.hasOwnProperty("bio") &&
        body.hasOwnProperty("status") &&
        body.hasOwnProperty("date")
    ) { 
        return true;
    } else {
        return false;
    }
}

function validateAttributes(body) {
    if (
        (body["username"].length > 0 && body["username"].length <= 16) &&
        (body["password"].length <= 72) &&
        (body["bio"].length >= 0 && body["bio"].length <= 190) &&
        (body["status"].length >= 0 && body["status"].length <= 32) &&
        (body["date"].length == 10)
    ) {
        return true;
    } else {
        return false;
    }
}
// this allows us to reuse the validors above for modifying existing users
function buildUserFromUpdatedInformation(updateBody) {
    let body = {};
    body["username"] = updateBody["updatedUsername"] ? updateBody["updatedUsername"] : null;
    body["password"] = updateBody["updatedPassword"] ? updateBody["updatedPassword"] : null;
    body["bio"] = updateBody["updatedBio"] ? updateBody["updatedBio"] : null;
    body["status"] = updateBody["updatedStatus"] ? updateBody["updatedStatus"] : null;
    body["date"] = updateBody["updatedDate"] ? updateBody["updatedDate"] : null;
    return body;
}

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

app.post("/modify-user", async (req, res) => {
    let body = buildUserFromUpdatedInformation(req.body);
    // make sure body has all relevant attributes
    if (checkAttributes(body)) {
        if (validateAttributes(body)) {
            if (await searchHelper(req.body["username"])) {
                let hashedPassword = await hashPassword(body["updatedPassword"]);
                pool.query(
                    `UPDATE Users SET username = $1, hashedPassword = $2, bio = $3, status = $4, birthday = $5 WHERE username = $6`,
                    [body["username"], hashedPassword, body["bio"], body["status"], body["date"], req.body["username"]]
                ).then((result) => {
                    return res.status(200).json({ "message": "user successfully modified" });
                }).catch((error) => {
                    return res.status(400).json({ "message": "failed to find user in database" });
                });
            } else {
                return res.status(400).json({ "message": "failed to find user in database" });
            }

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
app.get("/get-user", async (req, res) => {
    let username = req.query.username;
    if (await searchHelper(username)) {
        pool.query(`SELECT DISTINCT U.username, U.hashedPassword, U.bio, U.status, U.birthday FROM Users U WHERE U.username = $1`, [username])
        .then((result) => {
            let userObj = result.rows[0];
            return res.status(200).json(userObj);
        }).catch((error) => {
            return res.status(400).json({ "error": "error getting user information" });
        });
    } else {
        return res.status(400).json({ "error": "user not found" });
    }
});

// send all relevant fields, user object
// is made in database
app.post("/add-user", async (req, res) => {
    let body = req.body;
    // make sure body has all relevant attributes
    if (checkAttributes(body)) {
        // make sure we don't already have a user by this username
        if (await searchHelper(body["username"])) {
            return res.status(400).json({ "message": "user already exists" });
        } else {
            if (validateAttributes(body)) {                
                let hashedPassword = await hashPassword(body["password"]);
                let status = "chillin on datcord :3";
                pool.query(
                    `INSERT INTO Users (username, hashedPassword, bio, status, birthday) VALUES($1, $2, $3, $4, $5)`,
                    [body["username"], hashedPassword, body["bio"], status, body["date"]]
                ).then((result) => {
                    return res.status(200).json({ "message": "user successfully added to database" });
                }).catch((error) => {
                    return res.status(400).json({ "message": "failed to add user to database" });
                });
            } else {
                return res.status(500).json({ "error": "misformatted user information" });
            }
        }
    } else {
        return res.status(500).json({ "error": "missing user information" });
    }

});

// send username, returns bool
// true if user exists, false if not
app.get("/search-user", async (req, res) => {
    let username = req.query.username;
    let userFound = await searchHelper(username);

    if (userFound) {
        return res.status(200).json({ "result": true });
    } else {
        return res.status(200).json({ "result": false });
    }
});


//  server startup
app.listen(port, hostname, () => {
    console.log(`Listening at: http://${hostname}:${port}`);
});