import express from 'express';
import Vente from '../models/Vente.js';
import Produit from '../models/Produit.js';
import auth from '../middleware/auth.js';

const router = express.Router();

router.get('/', auth, async (req, res) => {
  const { date } = req.query;
  const filter = {};
  if (date) {
    const d = new Date(date);
    const next = new Date(d);
    next.setDate(next.getDate() + 1);
    filter.date = { $gte: d, $lt: next };
  }
  res.json(await Vente.find(filter).populate('produit').sort('-date'));
});

router.post('/', auth, async (req, res) => {
  try {
    const { produit, quantite, prixUnitaire, note } = req.body;
    const vente = await Vente.create({
      produit,
      quantite,
      prixUnitaire,
      total: quantite * prixUnitaire,
      note: note || '',
    });
    await Produit.findByIdAndUpdate(produit, { $inc: { stock: -quantite } });
    res.json(await vente.populate('produit'));
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
});

router.put('/:id', auth, async (req, res) => {
  try {
    const old = await Vente.findById(req.params.id);
    if (!old) return res.status(404).json({ error: 'Vente introuvable' });

    await Produit.findByIdAndUpdate(old.produit, { $inc: { stock: old.quantite } });

    const { produit, quantite, prixUnitaire, note } = req.body;
    const updated = await Vente.findByIdAndUpdate(
      req.params.id,
      {
        produit,
        quantite,
        prixUnitaire,
        total: quantite * prixUnitaire,
        note: note || '',
      },
      { new: true }
    );

    await Produit.findByIdAndUpdate(produit, { $inc: { stock: -quantite } });

    res.json(await updated.populate('produit'));
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
});

router.delete('/:id', auth, async (req, res) => {
  const v = await Vente.findById(req.params.id);
  if (v) {
    await Produit.findByIdAndUpdate(v.produit, { $inc: { stock: v.quantite } });
    await v.deleteOne();
  }
  res.json({ ok: true });
});

export default router;