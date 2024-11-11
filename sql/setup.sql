CREATE DATABASE datcord;

\c datcord
DROP TABLE Users;
DROP TABLE Friends;


-- table for Users 
CREATE TABLE IF NOT EXISTS Users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(16) UNIQUE,
    hashedPassword VARCHAR(72),
    bio VARCHAR(190),
    status VARCHAR(32),
    birthday DATE
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
