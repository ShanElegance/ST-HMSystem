const router = require('express').Router();
const Menu = require('../models/Menu');
const { protect, allow } = require('../middleware/auth');
router.use(protect);
router.get('/', async (req, res) => res.json(await Menu.find().sort({ order: 1 })));
router.put('/:id', allow('ADMIN', 'WARDEN'), async (req, res) => {
  const { breakfast, lunch, dinner } = req.body;
  res.json(await Menu.findByIdAndUpdate(req.params.id, { breakfast, lunch, dinner }, { new: true }));
});
module.exports = router;
