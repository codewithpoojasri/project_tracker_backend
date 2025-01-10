// config/db.js
const { Client } = require('pg');
const dotenv = require('dotenv');
dotenv.config();

const client = new Client({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT,
});

const connectDB = async () => {
  try {
    await client.connect();
    console.log('Connected to the database');
  } catch (err) {
    console.error('Error connecting to the database:', err);
    process.exit(1);
  }
};

module.exports = { client, connectDB };