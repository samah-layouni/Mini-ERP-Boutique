import express from 'express';
import Depense from '../models/Depense.js';
import auth from '../middleware/auth.js';

const router = express.Router();

router.get('/', auth, async (req, res) => {
  const { from, to } = req.query;
  const filter = {};
  if (from && to) {
    const start = new Date(from);
    start.setHours(0, 0, 0, 0);
    const end = new Date(to);
    end.setHours(23, 59, 59, 999);
    filter.date = { $gte: start, $lte: end };
  }
  res.json(await Depense.find(filter).sort('-date'));
});

router.post('/', auth, async (req, res) => {
  try {
    res.json(await Depense.create(req.body));
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
});

router.put('/:id', auth, async (req, res) => {
  try {
    const updated = await Depense.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json(updated);
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
});

router.delete('/:id', auth, async (req, res) => {
  await Depense.findByIdAndDelete(req.params.id);
  res.json({ ok: true });
});

export default router;