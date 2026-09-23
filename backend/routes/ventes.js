import express from 'express';
import Vente from '../models/Vente.js';
import Produit from '../models/Produit.js';
import auth from '../middleware/auth.js';

const router = express.Router();

// ========== LISTE ==========
router.get('/', auth, async (req, res) => {
  const { from, to, date } = req.query;
  const filter = {};

  if (date && !from && !to) {
    const d = new Date(date);
    const next = new Date(d);
    next.setDate(next.getDate() + 1);
    filter.date = { $gte: d, $lt: next };
  } else if (from && to) {
    const start = new Date(from);
    start.setHours(0, 0, 0, 0);
    const end = new Date(to);
    end.setHours(23, 59, 59, 999);
    filter.date = { $gte: start, $lte: end };
  }

  res.json(await Vente.find(filter).populate('produit').sort('-date'));
});

// ========== CRÉER ==========
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

    // Synchronisation : stock décrémenté + prix de vente mis à jour
    const update = { $inc: { stock: -quantite } };
    if (prixUnitaire && prixUnitaire > 0) {
      update.$set = { prixVente: prixUnitaire };
    }
    await Produit.findByIdAndUpdate(produit, update);

    res.json(await vente.populate('produit'));
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
});

// ========== MODIFIER ==========
router.put('/:id', auth, async (req, res) => {
  try {
    const old = await Vente.findById(req.params.id);
    if (!old) return res.status(404).json({ error: 'Vente introuvable' });

    // 1) Remettre l'ancien stock
    await Produit.findByIdAndUpdate(old.produit, { $inc: { stock: old.quantite } });

    // 2) Mettre à jour la vente
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

    // 3) Décrémenter le nouveau stock + synchroniser le prix de vente
    const update = { $inc: { stock: -quantite } };
    if (prixUnitaire && prixUnitaire > 0) {
      update.$set = { prixVente: prixUnitaire };
    }
    await Produit.findByIdAndUpdate(produit, update);

    res.json(await updated.populate('produit'));
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
});

// ========== SUPPRIMER ==========
router.delete('/:id', auth, async (req, res) => {
  const v = await Vente.findById(req.params.id);
  if (v) {
    await Produit.findByIdAndUpdate(v.produit, { $inc: { stock: v.quantite } });
    await v.deleteOne();
  }
  res.json({ ok: true });
});

export default router;