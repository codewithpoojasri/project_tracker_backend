

// controllers/authController.js
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { client } = require('../config/db');

const register = async (req, res) => {
  const { name, roll_no, phone_no, profile_pic, username, password, email_id, batch_id, year } = req.body;

  try {
    if (batch_id) {
      const batchCheckResult = await client.query('SELECT * FROM "Batch" WHERE "batch_id" = $1', [batch_id]);
      if (batchCheckResult.rows.length === 0) {
        return res.status(400).json({ message: 'Batch does not exist' });
      }
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const result = await client.query(
      'INSERT INTO "Student" (name, roll_no, phone_no, profile_pic, username, password, email_id, batch_id, year) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING *',
      [name, roll_no, phone_no, profile_pic, username, hashedPassword, email_id, batch_id, year]
    );

    res.status(201).json({ message: 'User registered successfully', user: result.rows[0] });
  } catch (error) {
    console.error('Error during registration:', error);
    res.status(500).json({ message: 'Server error during registration', error: error.message });
  }
};

const login = async (req, res) => {
  const { username, password } = req.body;

  try {
    const result = await client.query('SELECT * FROM "Student" WHERE username = $1', [username]);

    if (result.rows.length === 0) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const user = result.rows[0];

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const token = jwt.sign(
      { userId: user.student_id, username: user.username },
      process.env.JWT_SECRET,
      { expiresIn: '1h' }
    );

    res.status(200).json({ message: 'Login successful', token });
  } catch (error) {
    console.error('Error during login:', error);
    res.status(500).json({ message: 'Server error during login', error: error.message });
  }
};

module.exports = { register, login };
