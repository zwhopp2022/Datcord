const pg = require("pg");
const express = require("express");
const bcrypt = require('bcrypt');
const cookieParser = require("cookie-parser");
const cors = require('cors');
let crypto = require("crypto");
const app = express();

const port = 3000;
const hostname = "localhost";

const env = require("../appsettings.json");
const Pool = pg.Pool;
const pool = new Pool(env); 

app.use(express.static("public"));
app.use(express.json());
app.use(cookieParser());

app.use(cors({
    origin: `http://${hostname}:3001`  // Allow requests from this specific origin
  }));


let authorize = (req, res, next) => {
    let noVerificationPaths = ["/add-user", "/login"];
    console.log(req.path);
    if (noVerificationPaths.includes(req.path)) {
        return next();
    }
    let { token } = req.cookies;
    if (token === undefined || !searchToken(token)) {
        console.log("not allowed");
        return res.status(403).send("Not allowed");
    }
    next();
};
app.use(authorize);

let cookieOptions = {
    httpOnly: true, // client js can't access
    secure: true, // prevents packet sniffing by using https
    sameSite: "strict", // only include this cookie on requests to the same domain
};

function makeToken() {
    return crypto.randomBytes(32).toString("hex");
}

function saveToken(username, hashedToken) {
    pool.query(
        `UPDATE Users SET token = $1 WHERE username = $2`,
        [hashedToken, username]
    ).then((result) => {
        return true;
    }).catch((error) => {
        console.log(`Error saving token: ${error}`);
        return false;
    });
}

// returns true if a users token is existing in the database
function searchToken(token) {
    pool.query(`SELECT U.token FROM Users U`)
    .then((result) => {
        let tokens = result.rows.map(row => row.token);
        for (currToken of tokens) {
            if (bcrypt.compare(token, currToken)) {
                return true;
            }
        }
        return false;
    }).catch((error) => {
        return false;
    })
}

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

async function hashItem(password) {
    let salt = await bcrypt.genSalt();
    let hashedItem= await bcrypt.hash(password, salt);

    return hashedItem;
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

async function getUserPassHash(username) {
    try {
        let hashedPasswordResult = await pool.query(`SELECT U.hashedPassword FROM Users U WHERE U.username = $1`, [username]);
        let hashedPassword = hashedPasswordResult.rows[0]?.hashedpassword;
        return hashedPassword || "No password hash";
    } catch (error) {
        console.log(`Error getting the password hash of user: ${username}, error: ${error}`);
    }
}

// startup connections and middleware
pool.connect().then(function () {
    console.log(`Connected to database ${env.database}`);
});
  
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
                let hashedPassword = await hashItem(body["updatedPassword"]);
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
                let hashedPassword = await hashItem(body["password"]);
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

app.post("/login", async (req, res) => {
    let body = req.body;
    let plainPassword;
    let username;
    let hash;
    let verified;
    if (body.hasOwnProperty("username") && body.hasOwnProperty("password")) {
        username = body.username;
        plainPassword = body.password;

        if (!searchHelper(username)) {
            return res.status(400).json({"error": "Username or Password incorrect"});
        } 

        try {
            hash = await getUserPassHash(username);
            verified = await bcrypt.compare(plainPassword, hash);
        } catch (error) {
            console.log("Error verifying");
            return res.status(500);
        }

        if (!verified) {
            return res.status(400).json({"error": "Incorrect Username or Password"});
        }

        let token = makeToken();
        let hashedToken = await hashItem(token);
        saveToken(username, hashedToken);
        return res.status(200).cookie("token", token, cookieOptions).send();
    } else {
        return res.json({"error": "Missing login properties"});
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