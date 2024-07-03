const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const db = require('./pool'); 

// Middleware to check JWT token
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  if (token == null) return res.sendStatus(401);

  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) return res.sendStatus(403);
    req.user = user;
    next();
  });
};

// Create a new category
router.post('/category', authenticateToken, (req, res) => {
  const { name } = req.body;
  db.query('INSERT INTO categories (category_name) VALUES (?)', [name], (error, results) => {
    if (error) return res.status(500).json({ error });
    res.status(201).json({ id: results.insertId, name });
  });
});

// Get all categories
router.get('/categories', authenticateToken, (req, res) => {
  db.query('SELECT * FROM categories', (error, results) => {
    if (error) return res.status(500).json({ error });
    res.status(200).json(results);
  });
});

// Update a category
router.put('/:categoryId', authenticateToken, (req, res) => {
  const { categoryId } = req.params;
  const { name } = req.body; 

  db.query('UPDATE categories SET category_name = ? WHERE category_id = ?', [name, categoryId], (error, results) => {
    if (error) {
      return res.status(500).json({ error });
    }
    res.status(200).json({ id: categoryId, name });
  });
});


// Delete a category 
router.delete('/:categoryId', authenticateToken, (req, res) => {
  const { categoryId } = req.params;

  db.query('SELECT COUNT(*) AS serviceCount FROM services WHERE category_id = ?', [categoryId], (error, results) => {
    if (error) {
      return res.status(500).json({ error });
    }

    if (results[0].serviceCount > 0) {
      return res.status(400).json({ message: 'Category not empty' });
    }

    db.query('DELETE FROM categories WHERE category_id = ?', [categoryId], (error, results) => {
      if (error) {
        return res.status(500).json({ error });
      }
      res.status(200).json({ message: 'Category deleted' });
    });
  });
});


module.exports = router;


