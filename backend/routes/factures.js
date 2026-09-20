import express from 'express';
import Facture from '../models/Facture.js';
import Produit from '../models/Produit.js';
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
    filter.dateFacture = { $gte: start, $lte: end };
  }
  res.json(await Facture.find(filter).sort('-dateFacture'));
});

router.post('/', auth, async (req, res) => {
  try {
    const f = await Facture.create(req.body);
    for (const l of f.lignes) {
      if (l.produit) {
        await Produit.findByIdAndUpdate(l.produit, { $inc: { stock: l.quantite } });
      }
    }
    res.json(f);
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
});

router.put('/:id', auth, async (req, res) => {
  try {
    const old = await Facture.findById(req.params.id);
    if (!old) return res.status(404).json({ error: 'Facture introuvable' });

    // Annuler l'effet de l'ancienne facture sur le stock
    for (const l of old.lignes) {
      if (l.produit) {
        await Produit.findByIdAndUpdate(l.produit, { $inc: { stock: -l.quantite } });
      }
    }

    const updated = await Facture.findByIdAndUpdate(req.params.id, req.body, { new: true });

    // Appliquer la nouvelle
    for (const l of updated.lignes) {
      if (l.produit) {
        await Produit.findByIdAndUpdate(l.produit, { $inc: { stock: l.quantite } });
      }
    }

    res.json(updated);
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
});

router.delete('/:id', auth, async (req, res) => {
  const f = await Facture.findById(req.params.id);
  if (f) {
    // Annuler l'effet sur le stock
    for (const l of f.lignes) {
      if (l.produit) {
        await Produit.findByIdAndUpdate(l.produit, { $inc: { stock: -l.quantite } });
      }
    }
    await f.deleteOne();
  }
  res.json({ ok: true });
});

export default router;