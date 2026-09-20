import express from 'express';
import Vente from '../models/Vente.js';
import Facture from '../models/Facture.js';
import Depense from '../models/Depense.js';
import auth from '../middleware/auth.js';

const router = express.Router();

router.get('/dashboard', auth, async (req, res) => {
  const start = new Date(); start.setHours(0, 0, 0, 0);
  const end = new Date(); end.setHours(23, 59, 59, 999);

  const ventes = await Vente.find({ date: { $gte: start, $lte: end } });
  const factures = await Facture.find({ dateFacture: { $gte: start, $lte: end } });
  const depenses = await Depense.find({ date: { $gte: start, $lte: end } });

  const totalVentes = ventes.reduce((s, v) => s + v.total, 0);
  const totalAchats = factures.reduce((s, f) => s + f.totalTTC, 0);
  const totalDepenses = depenses.reduce((s, d) => s + d.montant, 0);

  res.json({
    date: new Date(),
    totalVentes,
    totalAchats,
    totalDepenses,
    benefice: totalVentes - totalAchats - totalDepenses,
    nbVentes: ventes.length,
  });
});

router.get('/periode', auth, async (req, res) => {
  const { from, to } = req.query;
  if (!from || !to) return res.status(400).json({ error: 'from et to requis' });

  const start = new Date(from);
  start.setHours(0, 0, 0, 0);
  const end = new Date(to);
  end.setHours(23, 59, 59, 999);

  const filter = { $gte: start, $lte: end };

  const ventes = await Vente.find({ date: filter });
  const factures = await Facture.find({ dateFacture: filter });
  const depenses = await Depense.find({ date: filter });

  const totalVentes = ventes.reduce((s, v) => s + v.total, 0);
  const totalAchats = factures.reduce((s, f) => s + f.totalTTC, 0);
  const totalDepenses = depenses.reduce((s, d) => s + d.montant, 0);

  res.json({
    from, to,
    totalVentes,
    totalAchats,
    totalDepenses,
    benefice: totalVentes - totalAchats - totalDepenses,
    nbVentes: ventes.length,
    nbFactures: factures.length,
    nbDepenses: depenses.length,
  });
});

router.get('/stock', auth, async (req, res) => {
  const Produit = (await import('../models/Produit.js')).default;
  const produits = await Produit.find().sort('code');

  const totalValeurAchat = produits.reduce((s, p) => s + p.stock * p.prixAchat, 0);
  const totalValeurVente = produits.reduce((s, p) => s + p.stock * p.prixVente, 0);
  const totalArticles = produits.reduce((s, p) => s + p.stock, 0);
  const ruptures = produits.filter(p => p.stock <= 0).length;
  const faibles = produits.filter(p => p.stock > 0 && p.stock <= 5).length;

  res.json({
    produits,
    stats: {
      totalProduits: produits.length,
      totalArticles,
      totalValeurAchat,
      totalValeurVente,
      margePotentielle: totalValeurVente - totalValeurAchat,
      ruptures,
      faibles,
    },
  });
});

export default router;