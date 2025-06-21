const express = require('express');
const router = express.Router();
const db = require('../models/db');

router.get('/my-dogs/:ownerId', async (req, res) => {
  const { ownerId } = req.params;
  try {
    const [rows] = await db.query(`
      SELECT dog_id, name FROM Dogs WHERE owner_id = ?
    `, [ownerId]);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch dogs' });
  }
});

router.get('/', async (req, res) => {
    try {
      const [rows] = await db.query('SELECT * FROM Dogs');
      res.json(rows);
    } catch (err) {
      res.status(500).json({ error: 'Failed to fetch dogs' });
    }
  });


module.exports = router;