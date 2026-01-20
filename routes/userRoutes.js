const express = require('express');
const router = express.Router();
const db = require('../config/db'); // your db connection

// Get all registers with columns info
router.get('/', (req, res) => {
  const sql = 'SELECT id, firstName, lastName, email, phone, password, profileImage FROM register';
  db.query(sql, (err, results, fields) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    // Extract column names only for the selected fields
    const columns = fields.map(f => f.name);
    res.json({ users: results, columns });
  });
});

// Add a new register record
router.post('/', (req, res) => {
  const data = req.body;

  // Allowed fields for insert
  const allowedFields = ['firstName', 'lastName', 'email', 'phone', 'password'];

  // Filter input data
  const filteredData = {};
  allowedFields.forEach(field => {
    if (data[field]) filteredData[field] = data[field];
    else filteredData[field] = null;  // Allow null if missing
  });

  // Build insert query dynamically
  const columns = Object.keys(filteredData).join(', ');
  const placeholders = Object.keys(filteredData).map(() => '?').join(', ');
  const values = Object.values(filteredData);

  const sql = `INSERT INTO register (${columns}) VALUES (${placeholders})`;

  db.query(sql, values, (err, result) => {
    if (err) {
      console.error('Insert error:', err);
      return res.status(500).json({ error: 'Failed to add record' });
    }
    res.json({ message: 'Record added', insertId: result.insertId });
  });
});

// Update a register record by id
router.put('/:id', (req, res) => {
  const id = req.params.id;
  const data = req.body;

  // Allowed fields for update
  const allowedFields = ['firstName', 'lastName', 'email', 'phone', 'password', 'profileImage'];
  const filteredData = {};
  allowedFields.forEach(field => {
    if (data[field] !== undefined) filteredData[field] = data[field];
  });

  if (Object.keys(filteredData).length === 0) {
    return res.status(400).json({ error: 'No valid fields provided to update' });
  }

  // Build SET part dynamically: "field1 = ?, field2 = ?"
  const setClause = Object.keys(filteredData).map(field => `${field} = ?`).join(', ');
  const values = Object.values(filteredData);

  const sql = `UPDATE register SET ${setClause} WHERE id = ?`;
  values.push(id);

  db.query(sql, values, (err, result) => {
    if (err) {
      console.error('Update error:', err);
      return res.status(500).json({ error: 'Failed to update record' });
    }
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Record not found' });
    }
    res.json({ message: 'Record updated' });
  });
});

// Delete a register record by id
router.delete('/:id', (req, res) => {
  const id = req.params.id;
  const sql = 'DELETE FROM register WHERE id = ?';

  db.query(sql, [id], (err, result) => {
    if (err) {
      console.error('Delete error:', err);
      return res.status(500).json({ error: 'Failed to delete record' });
    }
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Record not found' });
    }
    res.json({ message: 'Record deleted' });
  });
});

module.exports = router;
