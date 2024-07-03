const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const { generateToken } = require('../auth');

// User credentials
const user = {
  email: 'admin@codesfortomorrow.com',
  password: bcrypt.hashSync('Admin123!@#', 8)  
};

// Login Route
router.post('/login', (req, res) => {
    console.log("Login route hit");
  const { email, password } = req.body;

  if (email !== user.email || !bcrypt.compareSync(password, user.password)) {
    return res.status(401).json({ message: 'Invalid email or password' });
  }

  const token = generateToken(user);
  res.status(200).json({ message: 'Login successful', token });
});

module.exports = router;
