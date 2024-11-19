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

const env = require("../appsettings.local.json");
const Pool = pg.Pool;
const pool = new Pool(env); 
let server = http.createServer(app);
let io = new Server(server);

app.use(express.static("public"));
app.use(express.json());
app.use(cookieParser());

app.use(cors({
    origin: `http://${hostname}:3001`,  // Allow requests from this specific origin
    credentials: true
  }));

let authorize = async (req, res, next) => {
    let noVerificationPaths = ["/add-user", "/login", "/chat", "/create"];
    console.log(req.path);
    if (noVerificationPaths.includes(req.path)) {
        return next();
    }
    let token = req.headers['authorization']?.split(' ')[1];
    if (token === undefined || await searchToken(token)) {
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
    return crypto.randomBytes(16).toString("hex");
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
    let hashedItem= await bcrypt.hash(password, salt);

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
                            const friendsUpdated = await updateFriendsTableUsername(req.body["username"], body["username"]);
                            if (!friendsUpdated) {
                                return res.status(400).json({ "message": "failed to update friends relationships" });
                            }
                        }
                        return res.status(200).json({ "message": "user successfully modified" });
                    })
                    .catch((error) => {
                        return res.status(400).json({ "message": "failed to update user in database" });
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
        return res.status(200).cookie("token", token, cookieOptions).json({ "token": token }).send();
    } else {
        return res.json({"error": "Missing login properties"});
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































let rooms = {};

function generateRoomCode() {
  let characters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
  let result = "";
  for (let i = 0; i < 4; i++) {
    result += characters.charAt(Math.floor(Math.random() * characters.length));
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

app.post("/create", (req, res) => {
  let roomId = generateRoomCode();
  rooms[roomId] = {};
  return res.json({ roomId });
});

app.get("/chat", (req, res) => {
  let roomId = req.query.roomId;
  console.log(roomId);
  if (!rooms.hasOwnProperty(roomId)) {
    return res.status(404).send();
  }
  console.log("Sending room", roomId);
  res.sendFile(path.resolve(__dirname, 'public', 'directmessage', 'directmessage.html')); 
});

// if you need to do things like associate a socket with a logged in user, see
// https://socket.io/how-to/deal-with-cookies
// to see how you can fetch application cookies from the socket

io.on("connection", (socket) => {
  console.log(`Socket ${socket.id} connected`);

  let url = socket.handshake.headers.referer;
  let pathParts = url.split("/");
  let roomId = pathParts[pathParts.length - 1];
  console.log(pathParts, roomId);

  if (!rooms.hasOwnProperty(roomId)) {
    return;
  }

  // add socket object to room so other sockets in same room
  // can send messages to it later
  rooms[roomId][socket.id] = socket;

  /* MUST REGISTER socket.on(event) listener FOR EVERY event CLIENT CAN SEND */

  socket.on("disconnect", () => {
    console.log(`Socket ${socket.id} disconnected`);
    delete rooms[roomId][socket.id];
  });

  socket.on("foo", ({ message }) => {
    // we still have a reference to the roomId defined above
    // b/c this function is defined inside the outer function
    console.log(`Socket ${socket.id} sent message: ${message}, ${roomId}`);
    console.log("Broadcasting message to other sockets");

    // this would send the message to all other sockets
    // but we want to only send it to other sockets in this room
    // socket.broadcast.emit("message", message);

    for (let otherSocket of Object.values(rooms[roomId])) {
      // don't need to send same message back to socket
      // socket.broadcast.emit automatically skips current socket
      // but since we're doing this manually, we need to do it ourselves
      if (otherSocket.id === socket.id) {
        continue;
      }
      console.log(`Sending message ${message} to socket ${otherSocket.id}`);
      otherSocket.emit("bar", message);
    }
  });

  socket.on("hello", (data) => {
    console.log(data);
  });
});


//  server startup
server.listen(port, hostname, () => {
    console.log(`Listening at: http://${hostname}:${port}`);
});
