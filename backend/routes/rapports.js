import express from 'express';
import Vente from '../models/Vente.js';
import Facture from '../models/Facture.js';
import Depense from '../models/Depense.js';
import auth from '../middleware/auth.js';

const router = express.Router();

// ========== DASHBOARD (année en cours ou période) ==========
router.get('/dashboard', auth, async (req, res) => {
  const Facture = (await import('../models/Facture.js')).default;
  const AchatDirect = (await import('../models/AchatDirect.js')).default;

  const now = new Date();
  const defaultFrom = new Date(now.getFullYear(), 0, 1);
  const defaultTo = new Date(now.getFullYear(), 11, 31);

  const from = req.query.from ? new Date(req.query.from) : defaultFrom;
  const to = req.query.to ? new Date(req.query.to) : defaultTo;

  from.setHours(0, 0, 0, 0);
  to.setHours(23, 59, 59, 999);

  const ventes = await Vente.find({ date: { $gte: from, $lte: to } })
    .populate('produit').lean();
  const totalVentes = ventes.reduce((s, v) => s + (v.total || 0), 0);

  const ventesMap = {};
  for (const v of ventes) {
    const code = v.produit?.code || 'INCONNU';
    const nom = v.produit?.nom || '—';
    if (!ventesMap[code]) ventesMap[code] = { code, nom, quantite: 0, total: 0, nb: 0 };
    ventesMap[code].quantite += v.quantite || 0;
    ventesMap[code].total += v.total || 0;
    ventesMap[code].nb += 1;
  }
  const ventesJour = Object.values(ventesMap).sort((a, b) => b.total - a.total);

  const depenses = await Depense.find({
    date: { $gte: from, $lte: to },
    estAchat: false,
  }).lean();
  const totalDepenses = depenses.reduce((s, d) => s + (d.montant || 0), 0);

  const depensesMap = {};
  for (const d of depenses) {
    const cat = d.categorie || 'Sans catégorie';
    if (!depensesMap[cat]) depensesMap[cat] = { categorie: cat, total: 0, nb: 0, details: [] };
    depensesMap[cat].total += d.montant || 0;
    depensesMap[cat].nb += 1;
    depensesMap[cat].details.push({ libelle: d.libelle, montant: d.montant, note: d.note });
  }
  const depensesJour = Object.values(depensesMap).sort((a, b) => b.total - a.total);

  const factures = await Facture.find({ dateFacture: { $gte: from, $lte: to } }).lean();
  const achatsDirects = await AchatDirect.find({ date: { $gte: from, $lte: to } }).populate('produit').lean();

  const totalFactures = factures.reduce((s, f) => s + (f.totalTTC || 0), 0);
  const totalAchatsDirects = achatsDirects.reduce((s, a) => s + (a.total || 0), 0);
  const totalAchats = totalFactures + totalAchatsDirects;

  res.json({
    from: from.toISOString().slice(0, 10),
    to: to.toISOString().slice(0, 10),
    totalVentes,
    totalAchats,
    totalFactures,
    totalAchatsDirects,
    totalDepenses,
    benefice: totalVentes - totalAchats - totalDepenses,
    nbVentes: ventes.length,
    nbFactures: factures.length,
    nbAchatsDirects: achatsDirects.length,
    nbDepenses: depenses.length,
    ventesJour,
    depensesJour,
  });
});

// ========== RAPPORT PÉRIODE (analyse complète) ==========
router.get('/periode', auth, async (req, res) => {
  const Facture = (await import('../models/Facture.js')).default;
  const AchatDirect = (await import('../models/AchatDirect.js')).default;
  const Depense = (await import('../models/Depense.js')).default;

  const { from, to } = req.query;
  if (!from || !to) return res.status(400).json({ error: 'from et to requis' });

  const start = new Date(from);
  start.setHours(0, 0, 0, 0);
  const end = new Date(to);
  end.setHours(23, 59, 59, 999);

  const filter = { $gte: start, $lte: end };

  // Ventes
  const ventes = await Vente.find({ date: filter }).populate('produit').lean();
  const totalVentes = ventes.reduce((s, v) => s + (v.total || 0), 0);

  // Achats avec facture
  const factures = await Facture.find({ dateFacture: filter }).lean();
  const totalFactures = factures.reduce((s, f) => s + (f.totalTTC || 0), 0);
  const totalSousTotalFactures = factures.reduce((s, f) => s + (f.sousTotal || 0), 0);
  const totalRemiseFactures = factures.reduce((s, f) => s + (f.remiseMontant || 0), 0);
  const totalTvaFactures = factures.reduce((s, f) => s + (f.tvaMontant || 0), 0);

  // Achats hors facture
  const achatsDirects = await AchatDirect.find({ date: filter }).populate('produit').lean();
  const totalAchatsDirects = achatsDirects.reduce((s, a) => s + (a.total || 0), 0);

  // Dépenses (hors achats)
  const depenses = await Depense.find({ date: filter, estAchat: false }).lean();
  const totalDepenses = depenses.reduce((s, d) => s + (d.montant || 0), 0);

  // Total achats = factures + hors facture
  const totalAchats = totalFactures + totalAchatsDirects;

  // Bénéfice
  const benefice = totalVentes - totalAchats - totalDepenses;

  // ========== Regroupement ventes par produit ==========
  const ventesMap = {};
  for (const v of ventes) {
    const code = v.produit?.code || 'INCONNU';
    const nom = v.produit?.nom || '—';
    if (!ventesMap[code]) ventesMap[code] = { code, nom, quantite: 0, total: 0, nb: 0 };
    ventesMap[code].quantite += v.quantite || 0;
    ventesMap[code].total += v.total || 0;
    ventesMap[code].nb += 1;
  }
  const ventesParProduit = Object.values(ventesMap).sort((a, b) => b.total - a.total);

  // ========== Regroupement achats par produit ==========
  const achatsMap = {};
  for (const f of factures) {
    for (const l of f.lignes || []) {
      const code = l.designation?.match(/\[([^\]]+)\]/)?.[1] || 'INCONNU';
      const nom = l.designation?.replace(/\[[^\]]+\]\s*/, '') || '—';
      const montant = (l.quantite || 0) * (l.prixUnitaire || 0);
      if (!achatsMap[code]) achatsMap[code] = { code, nom, qteFacture: 0, qteHorsFacture: 0, totalFacture: 0, totalHorsFacture: 0, total: 0 };
      achatsMap[code].qteFacture += l.quantite || 0;
      achatsMap[code].totalFacture += montant;
      achatsMap[code].total += montant;
    }
  }
  for (const a of achatsDirects) {
    const code = a.produit?.code || 'INCONNU';
    const nom = a.produit?.nom || '—';
    if (!achatsMap[code]) achatsMap[code] = { code, nom, qteFacture: 0, qteHorsFacture: 0, totalFacture: 0, totalHorsFacture: 0, total: 0 };
    achatsMap[code].qteHorsFacture += a.quantite || 0;
    achatsMap[code].totalHorsFacture += a.total || 0;
    achatsMap[code].total += a.total || 0;
  }
  const achatsParProduit = Object.values(achatsMap).sort((a, b) => b.total - a.total);

  // ========== Regroupement dépenses par catégorie ==========
  const depensesMap = {};
  for (const d of depenses) {
    const cat = d.categorie || 'Sans catégorie';
    if (!depensesMap[cat]) depensesMap[cat] = { categorie: cat, total: 0, nb: 0 };
    depensesMap[cat].total += d.montant || 0;
    depensesMap[cat].nb += 1;
  }
  const depensesParCategorie = Object.values(depensesMap).sort((a, b) => b.total - a.total);

  res.json({
    from, to,
    totalVentes,
    totalAchats,
    totalFactures,
    totalAchatsDirects,
    totalDepenses,
    benefice,
    totalSousTotalFactures,
    totalRemiseFactures,
    totalTvaFactures,
    nbVentes: ventes.length,
    nbFactures: factures.length,
    nbAchatsDirects: achatsDirects.length,
    nbDepenses: depenses.length,
    ventesParProduit,
    achatsParProduit,
    depensesParCategorie,
  });
});

// ========== STOCK ==========
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

// ========== ÉVOLUTION INVENTAIRES ==========
router.get('/evolution', auth, async (req, res) => {
  const Inventaire = (await import('../models/Inventaire.js')).default;

  const inventaires = await Inventaire.find({ statut: 'valide' }).sort('dateDebut');

  const evolution = inventaires.map(inv => {
    const totalEcart = inv.lignes.reduce((s, l) => s + (l.ecart || 0), 0);
    const totalManquant = inv.lignes.filter(l => l.ecart < 0).reduce((s, l) => s + Math.abs(l.ecart), 0);
    const totalExcedent = inv.lignes.filter(l => l.ecart > 0).reduce((s, l) => s + l.ecart, 0);
    return {
      reference: inv.reference,
      date: inv.dateFin || inv.dateDebut,
      totalEcart,
      totalManquant,
      totalExcedent,
      nbProduits: inv.lignes.length,
      nbAvecEcart: inv.lignes.filter(l => l.ecart !== 0).length,
    };
  });

  const problemes = {};
  for (const inv of inventaires) {
    for (const l of inv.lignes) {
      if (l.ecart !== 0 && l.code) {
        if (!problemes[l.code]) problemes[l.code] = { code: l.code, nom: l.nom, totalEcart: 0, count: 0 };
        problemes[l.code].totalEcart += l.ecart;
        problemes[l.code].count += 1;
      }
    }
  }
  const topProblemes = Object.values(problemes)
    .sort((a, b) => Math.abs(b.totalEcart) - Math.abs(a.totalEcart))
    .slice(0, 10);

  res.json({ evolution, topProblemes });
});

// ========== HISTORIQUE ACHATS PAR PÉRIODE ==========
router.get('/achats-periode', auth, async (req, res) => {
  const Facture = (await import('../models/Facture.js')).default;
  const AchatDirect = (await import('../models/AchatDirect.js')).default;
  const Depense = (await import('../models/Depense.js')).default;

  const now = new Date();
  const defaultFrom = new Date(now.getFullYear(), 0, 1);
  const defaultTo = new Date(now.getFullYear(), 11, 31);

  const from = req.query.from ? new Date(req.query.from) : defaultFrom;
  const to = req.query.to ? new Date(req.query.to) : defaultTo;

  from.setHours(0, 0, 0, 0);
  to.setHours(23, 59, 59, 999);

  const factures = await Facture.find({ dateFacture: { $gte: from, $lte: to } }).lean();
  const achatsDirects = await AchatDirect.find({ date: { $gte: from, $lte: to } }).lean();
  const depenses = await Depense.find({ date: { $gte: from, $lte: to }, estAchat: false }).lean();

  const jours = {};
  const addToJour = (dateObj, type, montant) => {
    const d = new Date(dateObj);
    const key = d.toISOString().slice(0, 10);
    if (!jours[key]) {
      jours[key] = {
        date: key,
        factures: 0, totalFactures: 0,
        achatsDirects: 0, totalAchatsDirects: 0,
        depenses: 0, totalDepenses: 0,
        totalGeneral: 0,
      };
    }
    if (type === 'facture') { jours[key].factures += 1; jours[key].totalFactures += montant; }
    else if (type === 'achatDirect') { jours[key].achatsDirects += 1; jours[key].totalAchatsDirects += montant; }
    else if (type === 'depense') { jours[key].depenses += 1; jours[key].totalDepenses += montant; }
    jours[key].totalGeneral = jours[key].totalFactures + jours[key].totalAchatsDirects + jours[key].totalDepenses;
  };

  for (const f of factures) addToJour(f.dateFacture, 'facture', f.totalTTC || 0);
  for (const a of achatsDirects) addToJour(a.date, 'achatDirect', a.total || 0);
  for (const d of depenses) addToJour(d.date, 'depense', d.montant || 0);

  const liste = Object.values(jours).sort((a, b) => (a.date < b.date ? 1 : -1));

  const totauxPeriode = {
    from: from.toISOString().slice(0, 10),
    to: to.toISOString().slice(0, 10),
    nbFactures: factures.length,
    totalFactures: factures.reduce((s, f) => s + (f.totalTTC || 0), 0),
    nbAchatsDirects: achatsDirects.length,
    totalAchatsDirects: achatsDirects.reduce((s, a) => s + (a.total || 0), 0),
    nbDepenses: depenses.length,
    totalDepenses: depenses.reduce((s, d) => s + (d.montant || 0), 0),
  };
  totauxPeriode.totalGeneral = totauxPeriode.totalFactures + totauxPeriode.totalAchatsDirects + totauxPeriode.totalDepenses;

  res.json({ jours: liste, totauxPeriode });
});

// ========== JOURNAL DES ACHATS ==========
router.get('/journal', auth, async (req, res) => {
  const Facture = (await import('../models/Facture.js')).default;
  const AchatDirect = (await import('../models/AchatDirect.js')).default;

  const now = new Date();
  const defaultFrom = new Date(now.getFullYear(), 0, 1);
  const defaultTo = new Date(now.getFullYear(), 11, 31);

  const from = req.query.from ? new Date(req.query.from) : defaultFrom;
  const to = req.query.to ? new Date(req.query.to) : defaultTo;

  from.setHours(0, 0, 0, 0);
  to.setHours(23, 59, 59, 999);

  const factures = await Facture.find({ dateFacture: { $gte: from, $lte: to } }).lean();
  const achatsDirects = await AchatDirect.find({ date: { $gte: from, $lte: to } }).lean();

  const jours = {};
  const getJour = key => {
    if (!jours[key]) {
      jours[key] = {
        date: key,
        nbFactures: 0, totalFactures: 0,
        nbAchatsDirects: 0, totalAchatsDirects: 0,
        totalAchats: 0,
      };
    }
    return jours[key];
  };

  for (const f of factures) {
    const key = new Date(f.dateFacture).toISOString().slice(0, 10);
    const j = getJour(key);
    j.nbFactures += 1;
    j.totalFactures += f.totalTTC || 0;
  }
  for (const a of achatsDirects) {
    const key = new Date(a.date).toISOString().slice(0, 10);
    const j = getJour(key);
    j.nbAchatsDirects += 1;
    j.totalAchatsDirects += a.total || 0;
  }
  for (const k in jours) {
    const j = jours[k];
    j.totalAchats = j.totalFactures + j.totalAchatsDirects;
  }

  const liste = Object.values(jours).sort((a, b) => (a.date < b.date ? 1 : -1));

  const totaux = {
    nbFactures: factures.length,
    totalFactures: factures.reduce((s, f) => s + (f.totalTTC || 0), 0),
    nbAchatsDirects: achatsDirects.length,
    totalAchatsDirects: achatsDirects.reduce((s, a) => s + (a.total || 0), 0),
  };
  totaux.totalAchats = totaux.totalFactures + totaux.totalAchatsDirects;

  res.json({ jours: liste, totaux });
});

export default router;