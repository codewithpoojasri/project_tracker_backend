const express = require('express');
const router = express.Router();
const { 
  register, 
  login, 
  getUserProfile, 
  registerAdmin, 
  loginAdmin, 
  getAdminProfile 
} = require('../controllers/authController');

// Student routes
router.post('/student/register', register);   // Register student
router.post('/student/login', login);         // Student login
router.get('/student/profile', getUserProfile); // Student profile

// Admin routes
router.post('/admin/register', registerAdmin);   // Register admin
router.post('/admin/login', loginAdmin);         // Admin login
router.get('/admin/profile', getAdminProfile);   // Admin profile

module.exports = router;
