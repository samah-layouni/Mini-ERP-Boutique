import express from 'express';
import Inventaire from '../models/Inventaire.js';
import Produit from '../models/Produit.js';
import auth from '../middleware/auth.js';

const router = express.Router();

router.get('/', auth, async (req, res) => {
  res.json(await Inventaire.find().sort('-dateDebut'));
});

router.get('/:id', auth, async (req, res) => {
  const inv = await Inventaire.findById(req.params.id);
  if (!inv) return res.status(404).json({ error: 'Inventaire introuvable' });
  res.json(inv);
});

router.post('/demarrer', auth, async (req, res) => {
  try {
    const produits = await Produit.find().sort('code');

    const reference = `INV-${new Date().toISOString().slice(0, 10)}-${Date.now()
      .toString()
      .slice(-4)}`;

    const lignes = produits.map(p => ({
      produit: p._id,
      code: p.code,
      nom: p.nom,
      stockTheorique: p.stock,
      stockCompte: p.stock,
      ecart: 0,
      note: '',
    }));

    const inv = await Inventaire.create({
      reference,
      statut: 'en_cours',
      lignes,
      note: req.body.note || '',
    });

    res.json(inv);
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
});

router.put('/:id', auth, async (req, res) => {
  try {
    const { lignes, note } = req.body;

    const lignesCalculees = lignes.map(l => ({
      ...l,
      ecart: (l.stockCompte || 0) - (l.stockTheorique || 0),
    }));

    const inv = await Inventaire.findByIdAndUpdate(
      req.params.id,
      { lignes: lignesCalculees, note: note || '' },
      { new: true }
    );

    res.json(inv);
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
});

router.post('/:id/valider', auth, async (req, res) => {
  try {
    const inv = await Inventaire.findById(req.params.id);
    if (!inv) return res.status(404).json({ error: 'Inventaire introuvable' });
    if (inv.statut === 'valide') {
      return res.status(400).json({ error: 'Inventaire déjà validé' });
    }

    for (const l of inv.lignes) {
      if (l.produit) {
        await Produit.findByIdAndUpdate(l.produit, { stock: l.stockCompte });
      }
    }

    inv.statut = 'valide';
    inv.dateFin = new Date();
    await inv.save();

    res.json(inv);
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
});

router.delete('/:id', auth, async (req, res) => {
  await Inventaire.findByIdAndDelete(req.params.id);
  res.json({ ok: true });
});

export default router;