const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { client } = require('../config/db');

// Register a new user
const register = async (req, res) => {
  const { name, roll_no, phone_no, profile_pic, username, password, email_id, batch_id, year } = req.body;

  try {
    // Check if the batch exists
    if (batch_id) {
      const batchCheckResult = await client.query('SELECT * FROM "Batch" WHERE "batch_id" = $1', [batch_id]);
      if (batchCheckResult.rows.length === 0) {
        return res.status(400).json({ message: 'Batch does not exist' });
      }
    }

    // Hash the password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Insert the new user into the database
    const result = await client.query(
      'INSERT INTO "Student" (name, roll_no, phone_no, profile_pic, username, password, email_id, batch_id, year) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING *',
      [name, roll_no, phone_no, profile_pic, username, hashedPassword, email_id, batch_id, year]
    );

    // Send success response
    res.status(201).json({ message: 'User registered successfully', user: result.rows[0] });
  } catch (error) {
    console.error('Error during registration:', error);
    res.status(500).json({ message: 'Server error during registration', error: error.message });
  }
};

// Login a user
const login = async (req, res) => {
  const { username, password } = req.body;

  try {
    // Check if the user exists
    const result = await client.query('SELECT * FROM "Student" WHERE username = $1', [username]);

    if (result.rows.length === 0) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const user = result.rows[0];

    // Compare the password with the stored hash
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // Generate JWT token
    const token = jwt.sign(
      { userId: user.student_id, username: user.username },
      process.env.JWT_SECRET,
      { expiresIn: '1h' }
    );

    // Send success response with the token
    res.status(200).json({ message: 'Login successful', token });
  } catch (error) {
    console.error('Error during login:', error);
    res.status(500).json({ message: 'Server error during login', error: error.message });
  }
};

// Get user profile
const getUserProfile = async (req, res) => {
  const token = req.headers['authorization'];

  if (!token) {
    return res.status(403).json({ message: 'No token provided.' });
  }

  try {
    // Extract token and verify it
    const decoded = jwt.verify(token.split(' ')[1], process.env.JWT_SECRET);  // Extract token from 'Bearer <token>'
    const userId = decoded.userId;

    // Fetch the user data from the database
    const result = await client.query('SELECT * FROM "Student" WHERE "student_id" = $1', [userId]);

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'User not found' });
    }

    const user = result.rows[0];

    // Send the user profile details
    res.status(200).json({
      user: {
        name: user.name,
        roll_no: user.roll_no,
        email_id: user.email_id,
      }
    });
  } catch (error) {
    console.error('Error fetching profile:', error);
    res.status(500).json({ message: 'Server error while fetching profile' });
  }
};



const registerAdmin = async (req, res) => {
  const { username, password, email, role = 'admin', department_id } = req.body;

  try {
    // Check if the department exists (optional, if needed)
    if (department_id) {
      const departmentCheckResult = await client.query('SELECT * FROM "Department" WHERE "department_id" = $1', [department_id]);
      if (departmentCheckResult.rows.length === 0) {
        return res.status(400).json({ message: 'Department does not exist' });
      }
    }

    // Hash the password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Insert the new admin into the database
    const result = await client.query(
      'INSERT INTO "admins" (username, email, password_hash, role, department_id) VALUES ($1, $2, $3, $4, $5) RETURNING *',
      [username, email, hashedPassword, role, department_id]
    );

    // Send success response
    res.status(201).json({ message: 'Admin registered successfully', admin: result.rows[0] });
  } catch (error) {
    console.error('Error during admin registration:', error);
    res.status(500).json({ message: 'Server error during registration', error: error.message });
  }
};

// Login admin
const loginAdmin = async (req, res) => {
  const { username, password } = req.body;

  try {
    // Check if the admin exists
    const result = await client.query('SELECT * FROM "admins" WHERE username = $1', [username]);

    if (result.rows.length === 0) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const admin = result.rows[0];

    // Compare the password with the stored hash
    const isPasswordValid = await bcrypt.compare(password, admin.password_hash);
    if (!isPasswordValid) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // Generate JWT token
    const token = jwt.sign(
      { adminId: admin.id, username: admin.username },
      process.env.JWT_SECRET,
      { expiresIn: '1h' }
    );

    // Send success response with the token
    res.status(200).json({ message: 'Login successful', token });
  } catch (error) {
    console.error('Error during admin login:', error);
    res.status(500).json({ message: 'Server error during login', error: error.message });
  }
};

// Get admin profile
const getAdminProfile = async (req, res) => {
  const token = req.headers['authorization'];

  if (!token) {
    return res.status(403).json({ message: 'No token provided.' });
  }

  try {
    // Extract token and verify it
    const decoded = jwt.verify(token.split(' ')[1], process.env.JWT_SECRET);  // Extract token from 'Bearer <token>'
    const adminId = decoded.adminId;

    // Fetch the admin data from the database
    const result = await client.query('SELECT * FROM "admins" WHERE "id" = $1', [adminId]);

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Admin not found' });
    }

    const admin = result.rows[0];

    // Send the admin profile details
    res.status(200).json({
      admin: {
        username: admin.username,
        email: admin.email,
        role: admin.role,
      }
    });
  } catch (error) {
    console.error('Error fetching admin profile:', error);
    res.status(500).json({ message: 'Server error while fetching profile' });
  }
};

module.exports = { register, login, getUserProfile, registerAdmin, loginAdmin, getAdminProfile };
