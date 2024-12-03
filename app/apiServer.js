const pg = require("pg");
const express = require("express");
const bcrypt = require('bcrypt');
const cookieParser = require("cookie-parser");
const cors = require('cors');
let crypto = require("crypto");
let { Server } = require("socket.io");
let http = require("http");
const axios = require("axios");
const path = require("path");


const app = express();


const port = 3000;
const hostname = "localhost";

const env = require("../appsettings.json");
const Pool = pg.Pool;
const pool = new Pool(env);
let server = http.createServer(app);
let io = new Server(server, {
    cors: {
        origin: "*",
        methods: ["GET", "POST"]
    }
});
let rooms = {};

app.use(express.static(path.join(__dirname, 'public')));
app.use(express.json());
app.use(cookieParser());

app.use(cors({
    origin: true,  // Allow all origins
    credentials: true
}));

let authorize = async (req, res, next) => {
    let noVerificationPaths = ["/", "/add-user", "/login", "/register", "/add-friend"];
    if (noVerificationPaths.includes(req.path)) {
        return next();
    }
    let { token } = req.cookies;
    if (token === undefined || await searchToken(token)) {
        console.log("not allowed");
        return res.status(403).send("Not allowed");
    }
    next();
};
app.use(authorize);

let cookieOptions = {
    httpOnly: false, // false so that client side js can read cookies
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
async function searchToken(token) {
    try {
        let result = await pool.query(`SELECT U.token FROM Users U WHERE U.token = $1`, [token]);
        return result.rows.length > 0;
    } catch (error) {
        console.log(`Error searching token: ${error}`);
        return false;
    }
}

async function searchRoom(code) {
    try {
        let result = await pool.query(`SELECT R.code FROM Rooms R WHERE R.code = $1`, [code]);
        return result.rows.length > 0;
    } catch (error) {
        console.log(`Error searching for room code: ${error}`);
        return false;
    }
}

async function saveRoom(code) {
    try {
        await pool.query(
            `INSERT INTO Rooms (code) VALUES($1)`,
            [code]
        )
    } catch (error) {
        console.log(`Error inserting room into database: ${error}`);
    }
}

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

async function hashItem(password) {
    let salt = await bcrypt.genSalt();
    let hashedItem = await bcrypt.hash(password, salt);

    return hashedItem;
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
    body["username"] = updateBody["updatedUsername"] || updateBody["username"];
    body["password"] = updateBody["updatedPassword"] || "";
    body["bio"] = updateBody["updatedBio"] || "";
    body["status"] = updateBody["updatedStatus"] || "";
    body["date"] = updateBody["updatedDate"] || [];
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

async function updateFriendsTableUsername(oldUsername, newUsername) {
    try {
        await pool.query(
            `UPDATE Friends 
             SET usernameOne = $1 
             WHERE usernameOne = $2`,
            [newUsername, oldUsername]
        );

        await pool.query(
            `UPDATE Friends 
             SET usernameTwo = $1 
             WHERE usernameTwo = $2`,
            [newUsername, oldUsername]
        );

        await pool.query(
            `UPDATE Friends 
             SET sentBy = $1 
             WHERE sentBy = $2`,
            [newUsername, oldUsername]
        );

        return true;
    } catch (error) {
        console.error('Error updating friends table:', error);
        return false;
    }
}

// startup connections and middleware
pool.connect().then(function () {
    console.log(`Connected to database ${env.database}`);
});

// API ENDPOINTS FOR USER CREATION AND MODIFICATION

// send username, delete old user, add new one with updated information
// NOTE: if you want to only update one field, set the new value in 'updated<target>'
// and set all other fields to current value in that user object
// the current user information can either be gotten from the profile page and grabbed in one go
// or can be gotten from the /get-user endpoint 

app.post("/modify-user", async (req, res) => {
    let body = buildUserFromUpdatedInformation(req.body);
    if (checkUserAttributes(body)) {
        if (validateUserAttributes(body)) {
            if (await searchUserHelper(req.body["username"])) {
                // Only update fields that were provided
                let query = 'UPDATE Users SET ';
                let params = [];
                let paramCount = 1;
                let updates = [];

                // Build dynamic query based on provided fields
                if (body["username"]) {
                    updates.push(`username = $${paramCount}`);
                    params.push(body["username"]);
                    paramCount++;
                }
                if (body["password"]) {
                    let hashedPassword = await hashItem(body["password"]);
                    updates.push(`hashedPassword = $${paramCount}`);
                    params.push(hashedPassword);
                    paramCount++;
                }
                if (body["bio"]) {
                    updates.push(`bio = $${paramCount}`);
                    params.push(body["bio"]);
                    paramCount++;
                }
                if (body["status"]) {
                    updates.push(`status = $${paramCount}`);
                    params.push(body["status"]);
                    paramCount++;
                }
                if (body["date"]) {
                    updates.push(`birthday = $${paramCount}`);
                    params.push(body["date"]);
                    paramCount++;
                }

                query += updates.join(', ');
                query += ` WHERE username = $${paramCount}`;
                params.push(req.body["username"]);
                pool.query(query, params)
                    .then(async (result) => {
                        // If username was updated, update Friends table
                        if (body["username"] && body["username"] !== req.body["username"]) {
                            const friendsUpdated = await updateFriendsTableUsername(req.body["username"], body["updatedUsername"]);
                            if (!friendsUpdated) {
                                return res.status(400).json({ "message": "Failed to update friends relationships" });
                            }
                        }
                        return res.status(200).json({ "message": "User successfully modified" });
                    })
                    .catch((error) => {
                        return res.status(400).json({ "message": "Failed to update user in database" });
                    });
            } else {
                return res.status(400).json({ "message": "Failed to find user in database" });
            }
        } else {
            return res.status(500).json({ "error": "Misformatted user information" });
        }
    } else {
        return res.status(500).json({ "error": "Missing user information" });
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

        if (!searchUserHelper(username)) {

            return res.status(400).json({ "error": "Username or Password incorrect" });
        }

        try {
            hash = await getUserPassHash(username);
            verified = await bcrypt.compare(plainPassword, hash);
        } catch (error) {
            console.log("Error verifying");
            return res.status(500);
        }

        if (!verified) {
            return res.status(400).json({ "error": "Incorrect Username or Password" });
        }

        let token = makeToken();
        let hashedToken = await hashItem(token);
        saveToken(username, hashedToken);
        return res
            .status(200)
            .cookie("token", token, cookieOptions)
            .cookie("username", username, cookieOptions)
            .json({})
            .send();
    } else {
        return res.json({ "error": "Missing login properties" });
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
    console.log(req.body);
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


// HANDLERS FOR CHATS

async function generateRoomCode() {
    let characters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
    let result = "";
    for (let i = 0; i < 4; i++) {
        result += characters.charAt(Math.floor(Math.random() * characters.length));
    }
    if (await searchRoom(result)) { // if this code exists we need to make a unique one
        return generateRoomCode();
    }

    return result;
}

function printRooms() {
    for (let [roomId, sockets] of Object.entries(rooms)) {
        console.log(roomId);
        for (let [socketId, socket] of Object.entries(sockets)) {
            console.log(`\t${socketId}`);
        }
    }
}

function validateDirectMessageCreation(body) {
    if (body.hasOwnProperty("usernameOne") && body.hasOwnProperty("usernameTwo") && body.hasOwnProperty("title")) {
        if ((body["usernameOne"].length >= 1 && body["usernameOne"].length <= 16) &&
            (body["usernameTwo"].length >= 1 && body["usernameTwo"].length <= 16) &&
            (body["title"].length >= 1 && body["title"].length <= 33)
        ) {
            console.log("sub 1");
            return true;
        } else {
            console.log("sub 2");
            return false;
        }
    } else {
        console.log("sub 3");
        return false;
    }
}

function validateUsernamesForGroupCreation(usernames) {
    if (usernames.length === 0) {
        return false;
    }
    for (let username of usernames) {
        if (username.length >= 1 && username.length <= 16) {
            continue;
        } else {
            return false;
        }
    }
    return true;
}

function validateGroupMessageCreation(body) {
    if (body.hasOwnProperty("title") && body.hasOwnProperty("usernames")) {
        if (
            (body["title"].length >= 1 && body["title"].length <= 16) &&
            validateUsernamesForGroupCreation(body["usernames"])
        ) {
            return true;
        } else {
            return false;
        }
    } else {
        return false;
    }
}

function validateMessageText(body) {
    if (
        body.hasOwnProperty("sentMessage") &&
        body.hasOwnProperty("sentBy") &&
        body.hasOwnProperty("roomCode")
    ) {
        if (
            (body["sentMessage"].length > 0 && body["sentMessage"].length <= 1000) &&
            (body["sentBy"].length > 0 && body["sentBy"].length <= 16) &&
            (body["roomCode"].length === 4)
        ) {
            return true;
        } else {
            return false;
        }
    } else {
        return false;
    }
}

// searches to see if a chat exists between two users
// returns true if yes, false if no
function searchDirectMessages(usernameOne, usernameTwo) {
    return pool.query(
        `SELECT c.id FROM Chats c
         INNER JOIN ChatAssociations ca1 ON c.roomId = ca1.roomId
         INNER JOIN ChatAssociations ca2 ON c.roomId = ca2.roomId
         WHERE c.isDirectMessage = TRUE
           AND ca1.username = $1
           AND ca2.username = $2`,
        [usernameOne, usernameTwo]
    ).then((result) => {
        return result.rows.length > 0; // Returns true if a chat exists
    }).catch((error) => {
        console.error("Error in searchDirectMessages:", error);
        return false; // Assume no match in case of an error
    });
}


// searches to see if a chat exists with certain title
// returns true if yes, false if no
function searchGroupMessages(title) {
    return pool.query(
        `SELECT 1 FROM Chats WHERE title = $1`,
        [title]
    )
        .then((result) => {
            return result.rowCount > 0; // Return true if a match is found
        })
        .catch((error) => {
            console.error("Error in searchGroupMessages:", error);
            return false; // Return false in case of an error
        });
}


// adds new direct message to database
// adds new direct message to database
async function addDirectMessageChat(roomCode, title, usernameOne, usernameTwo) {
    console.log(roomCode);
    console.log(title);
    console.log(usernameOne);
    console.log(usernameTwo);
    await pool.query(
        `INSERT INTO Chats (roomId, title, permissionLevel, isDirectMessage)
            VALUES ($1, $2, 1, TRUE)
            RETURNING roomId`,
        [roomCode, title]
    ).then(() => {
        pool.query(
            `INSERT INTO ChatAssociations (roomId, username)
            VALUES ($1, $2)`,
            [roomCode, usernameOne]
        )
    }).then(() => {
        pool.query(
            `INSERT INTO ChatAssociations (roomId, username)
                VALUES ($1, $2)`,
            [roomCode, usernameTwo]
        )
    }).catch((error) => {
        console.log(error.message);
        return false;
    });
    return true;
}


// adds new group message to database
async function addGroupMessageChat(roomCode, title, usernames) {
    try {
        await pool.query(
            `INSERT INTO Chats (roomId, title, permissionLevel, isDirectMessage)
                VALUES ($1, $2, 1, TRUE)
                RETURNING roomId`,
            [roomCode, title]
        );

        for (let username of usernames) {
            await pool.query(
                `INSERT INTO ChatAssociations (roomId, username)
                    VALUES ($1, $2)`,
                [roomCode, username]
            );
        }

    } catch (error) {
        console.log(error.message);
        return false;
    }
    return true;
}

// Check if two users are friends (not just a pending request)
async function areFriends(userOne, userTwo) {
    try {
        const result = await pool.query(
            `SELECT 1 FROM Friends 
             WHERE ((usernameOne = $1 AND usernameTwo = $2) 
             OR (usernameOne = $2 AND usernameTwo = $1))
             AND isFriendRequest = FALSE`,
            [userOne, userTwo]
        );
        return result.rows.length > 0;
    } catch (error) {
        console.error("Error in areFriends check:", error);
        return false;
    }
}

// creates a new 'chat' in database with room code and two usernames
// for direct messaging purposes only
app.post("/create-direct-message", async (req, res) => {
    let body = req.body;

    if (validateDirectMessageCreation(body)) {
        // First check if they are friends
        if (!(await areFriends(body["usernameOne"], body["usernameTwo"]))) {
            return res.status(403).json({
                "message": "Cannot create chat: users must be friends first"
            });
        }

        if (!(await searchDirectMessages(body["usernameOne"], body["usernameTwo"]))) {
            let roomId = await generateRoomCode();
            await saveRoom(roomId);
            if (await addDirectMessageChat(roomId, body["title"], body["usernameOne"], body["usernameTwo"])) {
                console.log("1");
                return res.status(200).json({ "result": true });
            } else {
                console.log("2");
                return res.status(400).json({ "result": false });
            }
        } else {
            console.log("3");
            return res.status(400).json({ "message": "Chat already exists" });
        }
    } else {
        console.log("4");
        return res.status(400).json({ "message": "Missing username information" });
    }
});


// creates a new 'chat' in database with room code and at least one username
// for group messaging
app.post("/create-group-message", async (req, res) => {
    let body = req.body;

    if (validateGroupMessageCreation(body)) {
        if (!(await searchGroupMessages(body["title"]))) {
            let roomId = await generateRoomCode();
            await saveRoom(roomId);
            if (await addGroupMessageChat(roomId, body["title"], body["usernames"])) {
                return res.status(200).json({ "result": true });
            } else {
                return res.status(400).json({ "result": false });
            }
        } else {
            return res.status(400).json({ "message": "Chat already exists" });
        }
    } else {
        return res.status(400).json({ "message": "Missing username information" });
    }
});

app.post("/remove-chat", async (req, res) => {
    let body = req.body;
    let roomId = body.roomId;

    if (!roomId || roomId.length !== 4) {
        return res.status(400).json({ message: "Misformatted or missing roomId information" });
    }

    try {
        await pool.query('BEGIN');

        await pool.query(
            `DELETE FROM ChatAssociations WHERE roomId = $1`,
            [roomId]
        );

        await pool.query(
            `DELETE FROM Chats WHERE roomId = $1`,
            [roomId]
        );

        await pool.query('COMMIT');
        return res.status(200).json({ result: true });
    } catch (error) {
        console.error("Error removing chat:", error);
        await pool.query('ROLLBACK');
        return res.status(400).json({ message: "Error removing chat from database" });
    }
});


// returns all chat objects from database to client
app.get("/get-chats", (req, res) => {
    let username = req.query.username;

    if (!username || username.length < 1 || username.length > 16) {
        return res.status(400).json({ message: "Misformatted or missing username information" });
    }

    pool.query(
        `SELECT c.*
         FROM Chats c
         INNER JOIN ChatAssociations ca ON c.roomId = ca.roomId
         WHERE ca.username = $1`,
        [username]
    )
        .then((result) => {
            return res.status(200).json({ result: result.rows });
        })
        .catch((error) => {
            console.error("Error fetching chats:", error);
            return res.status(400).json({ message: "Error finding chats in database" });
        });
});


// renders existing chat room from server to client
app.get("/home/chat", (req, res) => {
    let roomId = req.query.roomId;
    console.log(roomId);
    if (!searchRoom(roomId)) {
        return res.status(404).send();
    }
    console.log("Sending room", roomId);
    res.sendFile(path.resolve(__dirname, 'public', 'chat', 'chat.html'));
});

// saves new message in a chat
app.post("/save-message", (req, res) => {
    let body = req.body;

    if (validateMessageText(body)) {
        const { sentMessage, sentBy, roomCode } = body;

        pool.query(
            "INSERT INTO Messages (sentMessage, sentBy, roomCode) VALUES ($1, $2, $3) RETURNING id",
            [sentMessage, sentBy, roomCode]
        ).then(result => {
            let messageId = result.rows[0].id;
            res.status(200).json({ "result": true, "messageId": messageId });
        }).catch(error => {
            console.error("Error saving message:", error.message);
            res.status(500).json({ "message": "Internal server error" });
        });

    } else {
        return res.status(400).json({ "message": "Missing or misformatted message information" });
    }
});


// returns all messages in a given, existing chat
app.get("/get-messages", async (req, res) => {
    const roomId = req.query.roomId;

    if (!roomId || !(await searchRoom(roomId))) {
        return res.status(404).json({ "message": "Room not found" });
    }

    pool.query(
        "SELECT * FROM Messages WHERE roomCode = $1 ORDER BY id ASC",
        [roomId]
    ).then(result => {
        res.status(200).json({ "result": result.rows });
    }).catch(error => {
        console.error("Error retrieving messages:", error.message);
        res.status(500).json({ "message": "Internal server error" });
    });
});

app.put("/edit-message", async (req, res) => {
    let { editedMessage, messageId, roomCode } = req.body;

    await pool.query(
        "UPDATE Messages SET sentMessage = $1 WHERE id = $2 AND roomCode = $3",
        [editedMessage, messageId, roomCode]
    ).then(result => {
        res.status(200).send();
    }).catch(error => {
        console.error("Error editing message: ", error.message);
        res.status(500).json({ error: "Error editing message" });
    });

    io.to(roomCode).emit('messageUpdate', {
        messageId: messageId,
        editedMessage: editedMessage,
    });
});

// Socket.io connection handling
io.on('connection', (socket) => {
    const roomId = socket.handshake.query.roomId;
    console.log(`Client connected to room ${roomId}`);

    if (roomId) {
        socket.join(roomId);
        console.log(`Socket ${socket.id} joined room ${roomId}`);
    }

    socket.on('disconnect', () => {
        if (roomId) {
            socket.leave(roomId);
            console.log(`Socket ${socket.id} left room ${roomId}`);
        }
    });

    socket.on("messageBroadcast", async (data) => {
        const { message, username, messageId } = data;
        socket.to(roomId).emit("messageBroadcast", { message, username, messageId });
    });
});

// API endpoint to handle message reactions
app.post("/react-to-message", async (req, res) => {
    try {
        const { sentBy, sentMessage, roomCode, reactionType, reactingUser } = req.body;

        // Map camelCase reaction types to lowercase database column names
        const columnMap = {
            'thumbsUp': 'thumbsup',
            'thumbsDown': 'thumbsdown',
            'neutralFace': 'neutralface',
            'eggplant': 'eggplant'
        };

        // Validate the reaction type
        if (!columnMap[reactionType]) {
            return res.status(400).json({ success: false, error: 'Invalid reaction type' });
        }

        const columnName = columnMap[reactionType];

        // Begin transaction
        await pool.query('BEGIN');

        // Check if user has already reacted
        const existingReaction = await pool.query(
            `SELECT id FROM MessageReactions 
             WHERE message_id = (
                SELECT id FROM Messages 
                WHERE sentBy = $1 AND sentMessage = $2 AND roomCode = $3
             )
             AND reaction_type = $4 
             AND username = $5`,
            [sentBy, sentMessage, roomCode, columnName, reactingUser]
        );

        let newCount;
        const messageResult = await pool.query(
            `SELECT id, ${columnName} as count FROM Messages 
             WHERE sentBy = $1 AND sentMessage = $2 AND roomCode = $3`,
            [sentBy, sentMessage, roomCode]
        );

        if (messageResult.rows.length === 0) {
            await pool.query('ROLLBACK');
            return res.status(404).json({ success: false, error: 'Message not found' });
        }

        const messageId = messageResult.rows[0].id;

        if (existingReaction.rows.length > 0) {
            // User has already reacted - remove their reaction
            await pool.query(
                `DELETE FROM MessageReactions 
                 WHERE message_id = $1 AND reaction_type = $2 AND username = $3`,
                [messageId, columnName, reactingUser]
            );

            // Decrease the count in Messages table
            const updateResult = await pool.query(
                `UPDATE Messages 
                 SET ${columnName} = ${columnName} - 1 
                 WHERE id = $1 
                 RETURNING ${columnName} as "newCount"`,
                [messageId]
            );
            newCount = updateResult.rows[0].newCount;
        } else {
            // User hasn't reacted - add their reaction
            await pool.query(
                `INSERT INTO MessageReactions (message_id, reaction_type, username) 
                 VALUES ($1, $2, $3)`,
                [messageId, columnName, reactingUser]
            );

            // Increase the count in Messages table
            const updateResult = await pool.query(
                `UPDATE Messages 
                 SET ${columnName} = ${columnName} + 1 
                 WHERE id = $1 
                 RETURNING ${columnName} as "newCount"`,
                [messageId]
            );
            newCount = updateResult.rows[0].newCount;
        }

        await pool.query('COMMIT');

        // Emit socket event for real-time updates
        io.to(roomCode).emit('reactionUpdate', {
            sentBy,
            sentMessage,
            roomCode,
            reactionType,
            newCount,
            reactingUser,
            hasReacted: existingReaction.rows.length === 0
        });

        res.json({
            success: true,
            newCount,
            hasReacted: existingReaction.rows.length === 0
        });
    } catch (error) {
        await pool.query('ROLLBACK');
        console.error('Error handling reaction:', error);
        res.status(500).json({
            success: false,
            error: 'Internal server error'
        });
    }
});

// API endpoint to get reaction counts and user's reaction status
app.post("/get-reaction-counts", async (req, res) => {
    try {
        const { sentBy, sentMessage, roomCode, currentUser } = req.body;

        const messageResult = await pool.query(
            `SELECT id, thumbsup as "thumbsUp", 
                    thumbsdown as "thumbsDown", 
                    neutralface as "neutralFace", 
                    eggplant 
             FROM Messages 
             WHERE sentBy = $1 AND sentMessage = $2 AND roomCode = $3`,
            [sentBy, sentMessage, roomCode]
        );

        if (messageResult.rows.length === 0) {
            return res.status(404).json({ error: 'Message not found' });
        }

        const messageId = messageResult.rows[0].id;
        const counts = messageResult.rows[0];

        // Get user's reactions
        const userReactions = await pool.query(
            `SELECT reaction_type FROM MessageReactions 
             WHERE message_id = $1 AND username = $2`,
            [messageId, currentUser]
        );

        const userReactionTypes = userReactions.rows.map(row => {
            // Map database column names back to camelCase
            const columnToReaction = {
                'thumbsup': 'thumbsUp',
                'thumbsdown': 'thumbsDown',
                'neutralface': 'neutralFace',
                'eggplant': 'eggplant'
            };
            return columnToReaction[row.reaction_type];
        });

        res.json({
            ...counts,
            userReactions: userReactionTypes
        });
    } catch (error) {
        console.error('Error getting reaction counts:', error);
        res.status(500).json({
            error: 'Internal server error'
        });
    }
});

//  server startup
server.listen(port, hostname, () => {
    console.log(`Listening at: http://${hostname}:${port}`);
});
