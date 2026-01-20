// routes/orderRoutes.js
const express = require('express');
const router = express.Router();
const db = require('../config/db'); // your MySQL connection

// GET /api/orders - get all orders
router.get('/', (req, res) => {
  const query = 'SELECT * FROM orders';
  db.query(query, (err, results) => {
    if (err) {
      console.error('DB error:', err);
      return res.status(500).json({ message: 'Server error' });
    }
    res.json(results);
  });
});

// GET /api/orders/:id - get order details by order_id
router.get('/:id', (req, res) => {
  const orderId = req.params.id;

  const orderQuery = 'SELECT * FROM orders WHERE order_id = ?';
  const itemsQuery = `
    SELECT oi.quantity, oi.price, p.name
    FROM order_items oi
    JOIN products p ON oi.product_id = p.id
    WHERE oi.order_id = ?
  `;

  db.query(orderQuery, [orderId], (orderErr, orderResults) => {
    if (orderErr) {
      console.error('Order query error:', orderErr);
      return res.status(500).json({ error: 'Database error fetching order' });
    }

    if (orderResults.length === 0) {
      return res.status(404).json({ error: 'Order not found' });
    }

    const order = orderResults[0];

    // Ensure shipping_address is a string
    if (typeof order.shipping_address !== 'string') {
      order.shipping_address = JSON.stringify(order.shipping_address || {});
    }

    db.query(itemsQuery, [orderId], (itemsErr, itemsResults) => {
      if (itemsErr) {
        console.error('Items query error:', itemsErr);
        return res.status(500).json({ error: 'Database error fetching order items' });
      }

      order.items = itemsResults || [];
      res.json(order);
    });
  });
});

// PUT /api/orders/:id - update order status
router.put('/:id', (req, res) => {
  const orderId = req.params.id;
  const { status } = req.body;

  const updateQuery = 'UPDATE orders SET status = ? WHERE order_id = ?';
  db.query(updateQuery, [status, orderId], (err, result) => {
    if (err) {
      console.error('Error updating order:', err);
      return res.status(500).json({ error: 'Failed to update order status' });
    }

    res.json({ message: 'Order status updated successfully' });
  });
});

module.exports = router;
