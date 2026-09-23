import express from 'express';
import AchatDirect from '../models/AchatDirect.js';
import Produit from '../models/Produit.js';
import Depense from '../models/Depense.js';
import auth from '../middleware/auth.js';

const router = express.Router();

// ========== LISTE ==========
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

  const achats = await AchatDirect.find(filter).populate('produit').lean();
  const depenses = await Depense.find({ ...filter, estAchat: false }).lean();

  const liste = [
    ...achats.map(a => ({ ...a, type: 'achat' })),
    ...depenses.map(d => ({ ...d, type: 'depense' })),
  ].sort((a, b) => new Date(b.date) - new Date(a.date));

  res.json(liste);
});

// ========== ROUTES DÉPENSES ==========
router.delete('/depense/:id', auth, async (req, res) => {
  try {
    await Depense.findByIdAndDelete(req.params.id);
    res.json({ ok: true });
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
});

router.put('/depense/:id', auth, async (req, res) => {
  try {
    const updated = await Depense.findByIdAndUpdate(
      req.params.id,
      { ...req.body, estAchat: false },
      { new: true }
    );
    if (!updated) return res.status(404).json({ error: 'Dépense introuvable' });
    res.json({ ...updated.toObject(), type: 'depense' });
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
});

// ========== CRÉER ACHAT ==========
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

    // Synchronisation : stock + prixAchat UNIQUEMENT
    const update = { $inc: { stock: quantite } };
    if (prixUnitaire && prixUnitaire > 0) {
      update.$set = { prixAchat: prixUnitaire };
    }
    await Produit.findByIdAndUpdate(produit, update);

    res.json(await achat.populate('produit'));
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
});

// ========== CRÉER DÉPENSE ==========
router.post('/depense', auth, async (req, res) => {
  try {
    const depense = await Depense.create({ ...req.body, estAchat: false });
    res.json({ ...depense.toObject(), type: 'depense' });
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
});

// ========== MODIFIER ACHAT ==========
router.put('/:id', auth, async (req, res) => {
  try {
    const old = await AchatDirect.findById(req.params.id);
    if (!old) return res.status(404).json({ error: 'Achat introuvable' });

    // 1) Annuler l'ancien stock
    await Produit.findByIdAndUpdate(old.produit, { $inc: { stock: -old.quantite } });

    // 2) Mettre à jour l'achat
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

    // 3) Appliquer + synchroniser stock + prixAchat UNIQUEMENT
    const update = { $inc: { stock: quantite } };
    if (prixUnitaire && prixUnitaire > 0) {
      update.$set = { prixAchat: prixUnitaire };
    }
    await Produit.findByIdAndUpdate(produit, update);

    res.json(await updated.populate('produit'));
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
});

// ========== SUPPRIMER ACHAT ==========
router.delete('/:id', auth, async (req, res) => {
  const a = await AchatDirect.findById(req.params.id);
  if (a) {
    await Produit.findByIdAndUpdate(a.produit, { $inc: { stock: -a.quantite } });
    await a.deleteOne();
  }
  res.json({ ok: true });
});

export default router;