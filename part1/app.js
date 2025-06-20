var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
var mysql = require('mysql2/promise');

var app = express();

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());

let db;

(async () => {
  try {
    // Connect to MySQL without specifying a database
    const connection = await mysql.createConnection({
      host: 'localhost',
      user: 'root',
      password: '' // Set your MySQL root password
    });

    // Create the database if it doesn't exist
    await connection.query('CREATE DATABASE IF NOT EXISTS testdb');
    await connection.end();

    // Now connect to the created database
    db = await mysql.createConnection({
      host: 'localhost',
      user: 'root',
      password: '',
      database: 'DogWalkService'
    });

    // Insert data if table is empty
    const [usersrows] = await db.execute('SELECT COUNT(*) AS count FROM Users');
    if (usersrows[0].count === 0) {
      await db.execute(`
    INSERT INTO Users (username, email, password_hash, role)

VALUES

('alice123', 'alice@example.com', 'hashed123', 'owner'),
('bobwalker', 'bob@example.com', 'hashed456', 'walker'),
('carol123', 'carol@example.com', 'hashed789', 'owner'),
('cynthia', 'cynthia@example.com', 'hashed333', 'owner'),
('hanniel', 'hanniel@example.com', 'hashed321', 'owner');
      `);
    }
    const [dogsrows] = await db.execute('SELECT COUNT(*) AS count FROM Dogs');
    if (dogsrows[0].count === 0) {
        await db.execute(`
    INSERT INTO Dogs (owner_id, name, size)

VALUES

((SELECT user_id FROM Users WHERE username = 'alice123'), 'Max', 'medium'),
((SELECT user_id FROM Users WHERE username = 'carol123'), 'Bella', 'small'),
((SELECT user_id FROM Users WHERE username = 'hanniel'), 'Chloe', 'small'),
((SELECT user_id FROM Users WHERE username = 'hanniel'), 'Rye', 'small'),
((SELECT user_id FROM Users WHERE username = 'cynthia'), 'Shallow', 'large');
      `);
    }

    const [walkrequestsrows] = await db.execute('SELECT COUNT(*) AS count FROM WalkRequests');
    if (walkrequestsrows[0].count === 0) {
      await db.execute(`
    INSERT INTO WalkRequests (dog_id, requested_time, duration_minutes, location, status)

VALUES

((SELECT dog_id FROM Dogs WHERE name = 'Max'), '2025-06-10 08:00:00', 30, 'Parklands', 'open'),
((SELECT dog_id FROM Dogs WHERE name = 'Bella'), '2025-06-10 09:30:00', 45, 'Beachside Ave', 'accepted'),
((SELECT dog_id FROM Dogs WHERE name = 'Rye'), '2025-06-10 11:30:00', 30, 'Glenelg Beach', 'accepted'),
((SELECT dog_id FROM Dogs WHERE name = 'Shallow'), '2025-06-10 12:30:00', 45, 'Glenelg Beach', 'accepted'),
((SELECT dog_id FROM Dogs WHERE name = 'Chloe'), '2025-06-10 13:30:00', 45, 'Henley Beach', 'completed');
      `);
    }
  } catch (err) {
    console.error('Error setting up database. Ensure Mysql is running: service mysql start', err);
  }
})();

// Route to return books as JSON
app.get('/api/dogs', async (req, res) => {
  try {
    const [dogs] = await db.execute('Select d.name, d.size , u.username from Dogs d JOIN Users u ON d.owner_id = u.user_id;');
    return res.json(dogs);
  } catch (err) {
    return res.status(500).json({ error: 'Failed to fetch books' });
  }
});
app.get('/api/walkrequests/open', async (req, res) => {
    try {
      const [dogs] = await db.execute(`
        SELECT wr.*, d.name as dog_name, u.username as owner_username
      FROM WalkRequests wr
      JOIN Dogs d ON wr.dog_id = d.dog_id
      JOIN Users u ON d.owner_id = u.user_id
      WHERE wr.status = 'open'
      `);
      return res.json(dogs);
    } catch (err) {
      return res.status(500).json({ error: 'Failed to fetch books' });
    }
});
app.get('/api/walkers/summary', async (req, res) => {
    try {
      const [dogs] = await db.execute('SELECT * FROM Dogs');
      return res.json(dogs);
    } catch (err) {
      return res.status(500).json({ error: 'Failed to fetch books' });
    }
});
app.use(express.static(path.join(__dirname, 'public')));

app.listen(8080, () => {
    console.log("listening");
});