import express from 'express';
import AchatDirect from '../models/AchatDirect.js';
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
    filter.date = { $gte: start, $lte: end };
  }
  res.json(await AchatDirect.find(filter).populate('produit').sort('-date'));
});

router.post('/', auth, async (req, res) => {
  try {
    const { produit, quantite, prixUnitaire, fournisseur, note } = req.body;
    const achat = await AchatDirect.create({
      produit,
      quantite,
      prixUnitaire,
      total: quantite * prixUnitaire,
      fournisseur: fournisseur || '',
      note: note || '',
    });
    await Produit.findByIdAndUpdate(produit, { $inc: { stock: quantite } });
    res.json(await achat.populate('produit'));
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
});

router.put('/:id', auth, async (req, res) => {
  try {
    const old = await AchatDirect.findById(req.params.id);
    if (!old) return res.status(404).json({ error: 'Achat introuvable' });

    await Produit.findByIdAndUpdate(old.produit, { $inc: { stock: -old.quantite } });

    const { produit, quantite, prixUnitaire, fournisseur, note } = req.body;
    const updated = await AchatDirect.findByIdAndUpdate(
      req.params.id,
      {
        produit,
        quantite,
        prixUnitaire,
        total: quantite * prixUnitaire,
        fournisseur: fournisseur || '',
        note: note || '',
      },
      { new: true }
    );

    await Produit.findByIdAndUpdate(produit, { $inc: { stock: quantite } });

    res.json(await updated.populate('produit'));
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
});

router.delete('/:id', auth, async (req, res) => {
  const a = await AchatDirect.findById(req.params.id);
  if (a) {
    await Produit.findByIdAndUpdate(a.produit, { $inc: { stock: -a.quantite } });
    await a.deleteOne();
  }
  res.json({ ok: true });
});

export default router;