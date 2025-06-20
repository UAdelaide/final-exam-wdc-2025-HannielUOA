var express = require('express');
var router = express.Router();

/* GET users listing. */
router.get('/dogs', function(req, res, next) {
    try {
        const [dogs] = await db.execute('SELECT * FROM Dogs');
        return res.json(dogs);
      } catch (err) {
        return res.status(500).json({ error: 'Failed to fetch books' });
      }
});

module.exports = router;
