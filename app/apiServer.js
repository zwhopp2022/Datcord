const pg = require("pg");
const express = require("express");
const bcrypt = require('bcrypt');
const cors = require('cors');
const app = express();

const port = 3000;
const hostname = "localhost";

const env = require("../appsettings.local.json");
const Pool = pg.Pool;
const pool = new Pool(env); 

app.use(cors({
    origin: 'http://localhost:3001',  // Allow requests from this specific origin
    credentials: true
}));

async function searchUserHelper(username) {
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

function checkUserAttributes(body) {
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

function validateUserAttributes(body) {
    if (
        (body["username"].length > 0 && body["username"].length <= 16) &&
        (body["password"].length <= 72) &&
        (body["bio"].length >= 0 && body["bio"].length <= 190) &&
        (body["status"].length >= 0 && body["status"].length <= 32) &&
        (body["date"].length == 3)
    ) {
        return true;
    } else {
        return false;
    }
}

// this allows us to reuse the validors above for modifying existing users
function buildUserFromUpdatedInformation(updateBody) {
    let body = {};
    body["username"] = updateBody["updatedUsername"] || updateBody["username"];
    body["password"] = updateBody["updatedPassword"] || "dummy-password-unchanged";
    body["bio"] = updateBody["updatedBio"] || "";
    body["status"] = updateBody["updatedStatus"] || "";
    body["date"] = updateBody["updatedDate"] || [];
    return body;
}

function checkFriendAttributes(body) {
    if (
        body.hasOwnProperty("usernameOne") &&
        body.hasOwnProperty("usernameTwo")
    ) {
        return true;
    } else {
        return false;
    }
}

async function validateFriendAttributes(body) {
    if (
        (body["usernameOne"].length > 0 && body["usernameOne"].length <= 16) &&
        (body["usernameTwo"].length > 0 && body["usernameTwo"].length <= 16)
    ) {
        // both usernames are appropriate length, so we check database to make sure both exist
        let userOneExists = await searchUserHelper(body["usernameOne"]);
        let userTwoExists = await searchUserHelper(body["usernameTwo"]);
        if (userOneExists && userTwoExists) {
            return true;
        } else {
            return false;
        }
    } else {
        // return false because body contains invalid usernames due to length
        return false;
    }
}

// startup connections and middleware
pool.connect().then(function () {
    console.log(`Connected to database ${env.database}`);
});
  
app.use(express.static("public"));
app.use(express.json());

// API ENDPOINTS FOR USER CREATION AND MODIFICATION

// send username, delete old user, add new one with updated information
// NOTE: if you want to only update one field, set the new value in 'updated<target>'
// and set all other fields to current value in that user object
// the current user information can either be gotten from the profile page and grabbed in one go
// or can be gotten from the /get-user endpoint 

app.post("/modify-user", async (req, res) => {
    let body = buildUserFromUpdatedInformation(req.body);
    // make sure body has all relevant attributes
    if (checkUserAttributes(body)) {
        if (validateUserAttributes(body)) {
            if (await searchUserHelper(req.body["username"])) {
                // Only hash password if it's not the dummy value
                let hashedPassword = body["password"] === "dummy-password-unchanged" 
                    ? req.body["updatedHashedPassword"]  // Use existing hashed password
                    : await hashPassword(body["password"]);
                    
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
    if (await searchUserHelper(username)) {
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
    if (checkUserAttributes(body)) {
        // make sure we don't already have a user by this username
        if (await searchUserHelper(body["username"])) {
            return res.status(400).json({ "message": "user already exists" });
        } else {
            if (validateUserAttributes(body)) {                
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
    let userFound = await searchUserHelper(username);

    if (userFound) {
        return res.status(200).json({ "result": true });
    } else {
        return res.status(200).json({ "result": false });
    }
});


// API ENDPOINTS FOR ADD/REMOVE FRIEND


// requires current userId (as userIdOne) and
// the id of the user adding as a friend (as userIdTwo)
app.post('/add-friend', async (req, res) => {
    let body = req.body;
    if (checkFriendAttributes(body)) {
        if (body.hasOwnProperty("sentBy") && (body["sentBy"] === body["usernameOne"] || body["sentBy"] === body["usernameTwo"])) {
            if (await validateFriendAttributes(body)) {
                pool.query(
                    `INSERT INTO Friends (usernameOne, usernameTwo, isFriendRequest, sentBy) VALUES($1, $2, $3, $4)`,
                    [body["usernameOne"], body["usernameTwo"], true, body["sentBy"]]
                ).then((result) => {
                    return res.status(200).json({ "message": "friend pair successfully added to database" });
                }).catch((error) => {
                    return res.status(400).json({ "message": "failed to add friend pair to database" });
                });
            } else {
                return res.status(400).json({ "message": "one or more users not found" });
            }
        } else {
            return res.status(500).json({ "error": "sentBy field missing or misformatted" });
        }
    } else {
        return res.status(500).json({ "error": "missing user information" });
    }
});

app.post('/remove-friend', async (req, res) => {
    let body = req.body;
    if (checkFriendAttributes(body)) {
        if (await validateFriendAttributes(body)) {
            pool.query(
                `DELETE FROM Friends 
                 WHERE (usernameOne = $1 AND usernameTwo = $2) 
                    OR (usernameOne = $2 AND usernameTwo = $1)`,
                [body["usernameOne"], body["usernameTwo"]]
            ).then((result) => {
                if (result.rowCount > 0) {
                    return res.status(200).json({ "message": "friend pair successfully removed from database" });
                } else {
                    return res.status(404).json({ "message": "friend pair not found in database" });
                }
            }).catch((error) => {
                return res.status(400).json({ "message": "failed to remove friend pair from database" });
            });
        } else {
            return res.status(400).json({ "message": "one or more users not found" });
        }
    } else {
        return res.status(500).json({ "error": "missing user information" });
    }
});

app.get('/get-friends', async (req, res) => {
    let friends = [];
    let username = req.query.username;
    if (username) {
        if (username.length > 0 && username.length <= 16) {
            if (await searchUserHelper(username)) {
                pool.query(
                    `SELECT * FROM Friends WHERE (usernameOne = $1 OR usernameTwo = $1) AND isFriendRequest = FALSE`,
                     [username]
                ).then((result) => {
                    for (let row of result.rows) {
                        if (row.usernameone === username) {
                            friends.push(row.usernametwo);
                        } else {
                            friends.push(row.usernameone);
                        }
                    }
                    return res.status(200).json({ "friends": friends });
                }).catch((error) => {
                    return res.status(400).json({ "message": "failed to retrieve friends from database" });
                });
            } else {
                return res.status(400).json({ "message": "username not found in database" });
            }
        } else {
            return res.status(400).json({ "message": "username incorrectly formatted" });
        }
    } else {
        return res.status(500).json({ "error": "query param 'username' not found" });
    }
});

app.get('/search-friends', async (req, res) => {
    let username = req.query.username;
    let searchTarget = req.query.searchTarget;
    if (username) {
        if (username.length > 0 && username.length <= 16) {
            if (await searchUserHelper(username)) {
                pool.query(
                    `SELECT * FROM Friends WHERE (usernameOne = $1 OR usernameTwo = $1) AND isFriendRequest = FALSE`,
                    [username]
                ).then((result) => {
                    for (let row of result.rows) {
                        if (row.usernameone === searchTarget || row.usernametwo === searchTarget) {
                            return res.status(200).json({ "result": true });
                        }
                    }
                    return res.status(200).json({ "result": false });
                }).catch((error) => {
                    return res.status(400).json({ "message": "failed to retrieve friends from database" });
                });   
            } else {
                return res.status(400).json({ "message": "username not found in database" });
            }
        } else {
            return res.status(400).json({ "message": "username incorrectly formatted" });
        }
    } else {
        return res.status(500).json({ "error": "query param 'username' not found" });
    }
});

app.get('/get-friend-requests', async (req, res) => {
    let friends = [];
    let username = req.query.username;
    if (username) {
        if (username.length > 0 && username.length <= 16) {
            if (await searchUserHelper(username)) {
                pool.query(
                    `SELECT * FROM Friends WHERE (usernameOne = $1 OR usernameTwo = $1) AND isFriendRequest = TRUE AND sentBy != $1`,
                     [username]
                ).then((result) => {
                    for (let row of result.rows) {
                        if (row.usernameone === username) {
                            friends.push(row.usernametwo);
                        } else {
                            friends.push(row.usernameone);
                        }
                    }
                    return res.status(200).json({ "friends": friends });
                }).catch((error) => {
                    return res.status(400).json({ "message": "failed to retrieve requests from database" });
                });
            } else {
                return res.status(400).json({ "message": "username not found in database" });
            }
        } else {
            return res.status(400).json({ "message": "username incorrectly formatted" });
        }
    } else {
        return res.status(500).json({ "error": "query param 'username' not found" });
    }
});

app.post('/accept-friend-request', async (req, res) => {
    let body = req.body;
    if (checkFriendAttributes(body)) {
        if (await validateFriendAttributes(body)) {
            pool.query(
                `UPDATE Friends 
                 SET isFriendRequest = FALSE 
                 WHERE (usernameOne = $1 AND usernameTwo = $2) 
                 OR (usernameOne = $2 AND usernameTwo = $1) 
                 AND isFriendRequest = TRUE`,
                [body["usernameOne"], body["usernameTwo"]]
            ).then((result) => {
                return res.status(200).json({ "message": "friend request successfully updated to friend pair" });
            }).catch((error) => {
                return res.status(400).json({ "message": "failed to modify friend request" });
            });
        } else {
            return res.status(400).json({ "message": "one or more users not found" });
        }
    } else {
        return res.status(500).json({ "error": "missing user information" });
    }
});


//  server startup
app.listen(port, hostname, () => {
    console.log(`Listening at: http://${hostname}:${port}`);
});