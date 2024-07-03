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

router.post('/category/:categoryId/service', authenticateToken, (req, res) => {
    const { categoryId } = req.params;
    const { service_name, service_type, price_options } = req.body;

    db.query('INSERT INTO services (category_id, service_name, service_type) VALUES (?, ?, ?)', 
    [categoryId, service_name, service_type], (error, results) => {
        if (error) return res.status(500).json({ error });

        const serviceId = results.insertId;
        const priceOptions = price_options.map(option => [serviceId, option.duration, option.price, option.type]);

        db.query('INSERT INTO servicepriceoptions (service_id, duration, price, price_type) VALUES ?', 
        [priceOptions], (error) => {
            if (error) return res.status(500).json({ error });
            res.status(201).json({ id: serviceId, service_name, service_type, price_options });
        });
    });
});

// Get all services in a category
router.get('/category/:categoryId/services', authenticateToken, (req, res) => {
  const { categoryId } = req.params;

  db.query('SELECT * FROM services WHERE category_id = ?', [categoryId], (error, results) => {
    if (error) return res.status(500).json({ error });
    res.status(200).json(results);
  });
});

// Update a service
router.put('/category/:categoryId/service/:serviceId', authenticateToken, (req, res) => {
  const { categoryId, serviceId } = req.params;
  const { service_name, service_type, price_options } = req.body;

  db.query('UPDATE services SET service_name = ?, service_type = ? WHERE service_id = ? AND category_id = ?', [service_name, service_type, serviceId, categoryId], (error) => {
    if (error) return res.status(500).json({ error });

    db.query('DELETE FROM servicepriceoptions WHERE service_id = ?', [serviceId], (error) => {
      if (error) return res.status(500).json({ error });

      const priceOptions = price_options.map(option => [serviceId, option.duration, option.price, option.type]);
      db.query('INSERT INTO servicepriceoptions (service_id, duration, price, price_type) VALUES ?', [priceOptions], (error) => {
        if (error) return res.status(500).json({ error });
        res.status(200).json({ id: serviceId, service_name, service_type, price_options });
      });
    });
  });
});

// Delete a service
router.delete('/category/:categoryId/service/:serviceId', authenticateToken, (req, res) => {
  const { serviceId } = req.params;

  db.query('DELETE FROM services WHERE service_id = ?', [serviceId], (error) => {
    if (error) return res.status(500).json({ error });

    db.query('DELETE FROM servicepriceoptions WHERE service_id = ?', [serviceId], (error) => {
      if (error) return res.status(500).json({ error });
      res.status(200).json({ message: 'Service deleted' });
    });
  });
});

module.exports = router;