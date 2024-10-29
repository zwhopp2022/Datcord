CREATE DATABASE datcord;

\c datcord

CREATE TABLE IF NOT EXISTS Users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(16),
    hashedPassword VARCHAR(64),
    bio VARCHAR(190),
    status VARCHAR(16),
    birthday DATE
);