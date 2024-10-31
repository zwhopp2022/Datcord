CREATE DATABASE datcord;

\c datcord
DROP TABLE Users;

CREATE TABLE IF NOT EXISTS Users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(16),
    hashedPassword VARCHAR(72),
    bio VARCHAR(190),
    status VARCHAR(32),
    birthday DATE
);