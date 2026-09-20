import express from 'express';
import Produit from '../models/Produit.js';
import auth from '../middleware/auth.js';

const router = express.Router();

router.get('/', auth, async (req, res) => {
  res.json(await Produit.find().sort('code'));
});

router.post('/', auth, async (req, res) => {
  try {
    res.json(await Produit.create(req.body));
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
});

// ⬇️⬇️⬇️ C'EST ICI LA NOUVELLE ROUTE ⬇️⬇️⬇️
router.post('/find-or-create', auth, async (req, res) => {
  try {
    const { code, nom, prixAchat, prixVente, categorie } = req.body;
    if (!code) return res.status(400).json({ error: 'Code requis' });

    const codeUpper = code.toUpperCase().trim();
    let produit = await Produit.findOne({ code: codeUpper });

    if (produit) {
      return res.json({ produit, created: false });
    }

    // Créer le produit s'il n'existe pas
    produit = await Produit.create({
      code: codeUpper,
      nom: nom || `Produit ${codeUpper}`,
      categorie: categorie || '',
      prixAchat: +prixAchat || 0,
      prixVente: +prixVente || 0,
      stock: 0,
    });

    res.json({ produit, created: true });
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