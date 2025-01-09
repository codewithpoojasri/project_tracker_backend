const pool = require('../db');

// Create user
const createUser = async (username, password, role) => {
  const query = `
    INSERT INTO users (username, password, role)
    VALUES ($1, $2, $3)
    RETURNING id, username, role;
  `;
  const values = [username, password, role];
  const result = await pool.query(query, values);
  return result.rows[0];
};

// Find user by username
const findUserByUsername = async (username) => {
  const query = `SELECT * FROM users WHERE username = $1`;
  const result = await pool.query(query, [username]);
  return result.rows[0];
};

module.exports = { createUser, findUserByUsername };

