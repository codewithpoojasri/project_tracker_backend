const express = require('express');
const dotenv = require('dotenv');
const { Client } = require('pg');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

// Load environment variables
dotenv.config();

// Initialize Express app
const app = express();
app.use(express.json()); // To parse JSON request bodies

// Database client setup
const client = new Client({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT,
});

// Connect to the database
client.connect()
  .then(() => {
    console.log('Connected to the database');
  })
  .catch((err) => {
    console.error('Error connecting to the database:', err);
    process.exit(1); // Exit the process on connection failure
  });

// Register endpoint
app.post('/register', async (req, res) => {
  const { name, roll_no, phone_no, profile_pic, username, password, email_id, batch_id, year } = req.body;

  try {
    // Debug log
    console.log('Received registration request:', { name, roll_no, phone_no, profile_pic, username, email_id, batch_id, year });

    // Check if batch exists
    if (batch_id) {
      const batchCheckResult = await client.query('SELECT * FROM "Batch" WHERE "batch_id" = $1', [batch_id]);
      if (batchCheckResult.rows.length === 0) {
        return res.status(400).json({ message: 'Batch does not exist' });
      }
    }

    // Hash the password
    const hashedPassword = await bcrypt.hash(password, 10);
    console.log('Hashed password:', hashedPassword);

    // Insert the user data into the database
    const result = await client.query(
      'INSERT INTO "Student" (name, roll_no, phone_no, profile_pic, username, password, email_id, batch_id, year) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING *',
      [name, roll_no, phone_no, profile_pic, username, hashedPassword, email_id, batch_id, year]
    );
    
    // Debug log
    console.log('Registration successful:', result.rows[0]);

    res.status(201).json({ message: 'User registered successfully', user: result.rows[0] });
  } catch (error) {
    console.error('Error during registration:', error);
    res.status(500).json({ message: 'Server error during registration', error: error.message });
  }
});

// Login endpoint
app.post('/login', async (req, res) => {
  const { username, password } = req.body;

  try {
    // Debug log
    console.log('Received login request:', { username });

    // Fetch the user from the database using the username
    const result = await client.query('SELECT * FROM "Student" WHERE username = $1', [username]);

    if (result.rows.length === 0) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const user = result.rows[0];
    console.log('User found:', user);

    // Compare the provided password with the stored hashed password
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // Generate a JWT token to authenticate the user for future requests
    const token = jwt.sign({ userId: user.student_id, username: user.username }, process.env.JWT_SECRET, { expiresIn: '1h' });

    // Debug log
    console.log('Generated JWT token:', token);

    res.status(200).json({ message: 'Login successful', token });
  } catch (error) {
    console.error('Error during login:', error);
    res.status(500).json({ message: 'Server error during login', error: error.message });
  }
});

// Start the server
const port = process.env.PORT || 5000;
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
