import express from 'express';
import Produit from '../models/Produit.js';
import auth from '../middleware/auth.js';

const router = express.Router();

router.get('/', auth, async (req, res) => {
  res.json(await Produit.find().sort('nom'));
});

router.post('/', auth, async (req, res) => {
  try {
    res.json(await Produit.create(req.body));
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
});

router.put('/:id', auth, async (req, res) => {
  try {
    const p = await Produit.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!p) return res.status(404).json({ error: 'Produit introuvable' });
    res.json(p);
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
});

router.delete('/:id', auth, async (req, res) => {
  await Produit.findByIdAndDelete(req.params.id);
  res.json({ ok: true });
});

export default router;