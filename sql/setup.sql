CREATE DATABASE datcord;

\c datcord
DROP TABLE Users CASCADE;
DROP TABLE Friends CASCADE;
DROP TABLE Rooms CASCADE;
DROP TABLE Chats CASCADE;
DROP TABLE ChatAssociations CASCADE;


-- table for Users 
CREATE TABLE IF NOT EXISTS Users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(16) UNIQUE,
    hashedPassword VARCHAR(72),
    bio VARCHAR(190),
    status VARCHAR(32),
    birthday DATE,
    token VARCHAR(72) DEFAULT ''

);

-- table for Friend-pairs based on username
CREATE TABLE IF NOT EXISTS Friends (
    friendPair SERIAL PRIMARY KEY,
    usernameOne VARCHAR(16),
    usernameTwo VARCHAR(16),
    isFriendRequest boolean,
    sentBy VARCHAR(16),
    FOREIGN KEY (usernameOne) REFERENCES Users(username),
    FOREIGN KEY (usernameTwo) REFERENCES Users(username),
    CHECK (usernameOne <> usernameTwo)
);

CREATE TABLE IF NOT EXISTS Rooms (
    code VARCHAR(4) PRIMARY KEY
);

CREATE TABLE IF NOT EXISTS Chats (
    id SERIAL PRIMARY KEY,
    roomId VARCHAR(4) NOT NULL,
    title VARCHAR(33) NOT NULL,
    permissionLevel INT DEFAULT 1,
    isDirectMessage BOOLEAN
);

CREATE TABLE IF NOT EXISTS ChatAssociations (
    id SERIAL PRIMARY KEY,
    roomId VARCHAR(4) NOT NULL,
    username VARCHAR(16),
    FOREIGN KEY (roomId) REFERENCES Rooms(code),
    FOREIGN KEY (username) REFERENCES Users(username)
);

CREATE TABLE IF NOT EXISTS Messages (
    id SERIAL PRIMARY KEY,
    sentMessage VARCHAR(1000),
    sentBy VARCHAR(16),
    roomCode VARCHAR(4) NOT NULL,
    FOREIGN KEY (roomCode) REFERENCES Rooms(code)
);

-- making sure there is a single row in database per pair
-- e.g. id      usernameOne         usernameTwo
--      1       userA               userB
--      2       userB               userA
-- will NOT happen, only one of those rows can exist at a time
-- api endpoints account for this
CREATE UNIQUE INDEX unique_friend_pairs ON Friends (
    LEAST(usernameOne, usernameTwo),
    GREATEST(usernameOne, usernameTwo)
);

CREATE UNIQUE INDEX unique_room_user_association 
ON ChatAssociations (roomId, username);
