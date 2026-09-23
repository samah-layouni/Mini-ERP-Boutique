import { useEffect, useState } from 'react';
import api from '../api/axios';

function Achats() {
  const [filtre, setFiltre] = useState('all');

  const today = new Date().toISOString().slice(0, 10);
  const [from, setFrom] = useState(today);
  const [to, setTo] = useState(today);

  const [factures, setFactures] = useState([]);
  const [directs, setDirects] = useState([]);
  const [depenses, setDepenses] = useState([]);
  const [operations, setOperations] = useState([]);

  const [typeForm, setTypeForm] = useState('facture');
  const [editId, setEditId] = useState(null);
  const [editType, setEditType] = useState(null);
  const [err, setErr] = useState('');
  const [info, setInfo] = useState('');

  const [produits, setProduits] = useState([]);

  // FACTURE
  const [headerFacture, setHeaderFacture] = useState({
    numFacture: '',
    fournisseur: '',
    dateFacture: new Date().toISOString().slice(0, 10),
  });
  const [lignesFacture, setLignesFacture] = useState([
    { code: '', produit: '', designation: '', quantite: 1, prixUnitaire: 0, isNew: false },
  ]);
  const [remise, setRemise] = useState({ type: 'percent', valeur: 0 });
  const [tva, setTva] = useState({ active: false, taux: 19 });

  // ACHAT DIRECT
  const [formDirect, setFormDirect] = useState({
    code: '', nom: '', quantite: 1, prixAchat: 0, fournisseur: '', note: '',
  });

  // DÉPENSE
  const [formDepense, setFormDepense] = useState({
    libelle: '', montant: 0, categorie: '', note: '',
  });

  // ========== CHARGEMENT ==========
  const load = async () => {
    let urlF = '/factures';
    let urlA = '/achats-directs';
    if (from && to) {
      urlF += `?from=${from}&to=${to}`;
      urlA += `?from=${from}&to=${to}`;
    }
    try {
      const [fRes, aRes] = await Promise.all([api.get(urlF), api.get(urlA)]);
      const allFactures = fRes.data || [];
      const allOps = aRes.data || [];

      const achatsDirects = allOps.filter(op => op.type === 'achat' || op.produit);
      const toutesDepenses = allOps.filter(op => op.type === 'depense' && !op.produit);

      setFactures(allFactures);
      setDirects(achatsDirects);
      setDepenses(toutesDepenses);

      const ops = [
        ...allFactures.map(f => ({
          type: 'facture',
          _id: f._id,
          date: f.dateFacture,
          numero: f.numFacture,
          fournisseur: f.fournisseur || '—',
          total: f.totalTTC || 0,
          detail: `${f.lignes?.length || 0} ligne(s)`,
          raw: f,
        })),
        ...achatsDirects.map(a => ({
          type: 'direct',
          _id: a._id,
          date: a.date,
          numero: '—',
          fournisseur: a.fournisseur || '—',
          total: a.total || 0,
          detail: `${a.produit?.code || '—'} × ${a.quantite || 0}`,
          raw: a,
        })),
        ...toutesDepenses.map(d => ({
          type: 'depense',
          _id: d._id,
          date: d.date,
          numero: '—',
          fournisseur: d.categorie || '—',
          total: d.montant || 0,
          detail: d.libelle,
          raw: d,
        })),
      ].sort((a, b) => new Date(b.date) - new Date(a.date));

      setOperations(ops);
    } catch (e) {
      console.error(e);
    }
  };

  const loadProduits = () => {
    api.get('/produits').then(r => setProduits(r.data || []));
  };

  useEffect(() => {
    load();
    loadProduits();
  }, []);

  useEffect(() => {
    load();
  }, [from, to]);

  // Raccourcis
  const setPeriodeAujourdhui = () => { const t = new Date().toISOString().slice(0, 10); setFrom(t); setTo(t); };
  const setPeriodeSemaine = () => { const d = new Date(); d.setDate(d.getDate() - 7); setFrom(d.toISOString().slice(0, 10)); setTo(new Date().toISOString().slice(0, 10)); };
  const setPeriodeMois = () => { const d = new Date(); d.setDate(1); setFrom(d.toISOString().slice(0, 10)); setTo(new Date().toISOString().slice(0, 10)); };
  const setPeriodeAnnee = () => { const d = new Date(); d.setMonth(0, 1); setFrom(d.toISOString().slice(0, 10)); setTo(new Date().toISOString().slice(0, 10)); };
  const setPeriodeTout = () => { setFrom(''); setTo(''); };

  // ========== FACTURE — LIGNES ==========
  const onCodeChangeFacture = (i, val) => {
    const code = val.toUpperCase();
    const arr = [...lignesFacture];
    const existing = produits.find(p => p.code === code);
    arr[i].code = code;
    if (existing) {
      arr[i].produit = existing._id;
      arr[i].designation = `[${existing.code}] ${existing.nom}`;
      arr[i].prixUnitaire = existing.prixAchat;
      arr[i].isNew = false;
    } else {
      arr[i].produit = '';
      arr[i].isNew = true;
    }
    setLignesFacture(arr);
  };

  const updateLigneFacture = (i, field, val) => {
    const arr = [...lignesFacture];
    if (field === 'quantite' || field === 'prixUnitaire') arr[i][field] = +val;
    else arr[i][field] = val;
    setLignesFacture(arr);
  };

  const addLigneFacture = () =>
    setLignesFacture([...lignesFacture, { code: '', produit: '', designation: '', quantite: 1, prixUnitaire: 0, isNew: false }]);

  const delLigneFacture = i => setLignesFacture(lignesFacture.filter((_, idx) => idx !== i));

  const sousTotalFacture = lignesFacture.reduce((s, l) => s + l.quantite * l.prixUnitaire, 0);
  const remiseMontant = remise.type === 'percent' ? (sousTotalFacture * remise.valeur) / 100 : remise.valeur;
  const baseHT = sousTotalFacture - remiseMontant;
  const tvaMontant = tva.active ? (baseHT * tva.taux) / 100 : 0;
  const totalTTC = baseHT + tvaMontant;

  const resetFormFacture = () => {
    setHeaderFacture({ numFacture: '', fournisseur: '', dateFacture: new Date().toISOString().slice(0, 10) });
    setLignesFacture([{ code: '', produit: '', designation: '', quantite: 1, prixUnitaire: 0, isNew: false }]);
    setRemise({ type: 'percent', valeur: 0 });
    setTva({ active: false, taux: 19 });
  };

  // ========== SUBMIT FACTURE ==========
  const submitFacture = async e => {
    e.preventDefault();
    setErr('');
    const lignesResolues = [];
    for (const l of lignesFacture) {
      if (!l.code) continue;
      let produitId = l.produit;
      if (!produitId) {
        const { data } = await api.post('/produits/find-or-create', {
          code: l.code,
          nom: l.designation || `Produit ${l.code}`,
          prixAchat: l.prixUnitaire,
        });
        produitId = data.produit._id;
      }
      lignesResolues.push({
        produit: produitId,
        designation: l.designation || `[${l.code}]`,
        quantite: l.quantite,
        prixUnitaire: l.prixUnitaire,
        totalLigne: l.quantite * l.prixUnitaire,
      });
    }

    const payload = {
      ...headerFacture,
      lignes: lignesResolues,
      sousTotal: sousTotalFacture,
      remiseType: remise.type,
      remiseValeur: remise.valeur,
      remiseMontant,
      tvaActive: tva.active,
      tvaTaux: tva.taux,
      tvaMontant,
      totalTTC,
    };

    try {
      if (editId && editType === 'facture') {
        await api.put(`/factures/${editId}`, payload);
        setEditId(null); setEditType(null);
      } else {
        await api.post('/factures', payload);
      }
      resetFormFacture();
      load();
      loadProduits();
    } catch (e) {
      setErr(e.response?.data?.error || 'Erreur');
    }
  };

  // ========== ACHAT DIRECT ==========
  const onCodeChangeDirect = val => {
    const code = val.toUpperCase();
    const existing = produits.find(p => p.code === code);
    if (existing) {
      setInfo(`✅ Produit existant : ${existing.nom} (stock : ${existing.stock})`);
      setFormDirect({ ...formDirect, code, nom: existing.nom, prixAchat: existing.prixAchat });
    } else {
      setInfo(code ? `⚠️ Code "${code}" inconnu — sera créé` : '');
      setFormDirect({ ...formDirect, code });
    }
  };

  const submitDirect = async e => {
    e.preventDefault();
    setErr('');
    if (!formDirect.code) { setErr('Le code produit est obligatoire'); return; }
    try {
      const { data } = await api.post('/produits/find-or-create', {
        code: formDirect.code,
        nom: formDirect.nom || `Produit ${formDirect.code}`,
        prixAchat: formDirect.prixAchat,
      });

      const payload = {
        produit: data.produit._id,
        quantite: formDirect.quantite,
        prixUnitaire: formDirect.prixAchat,
        fournisseur: formDirect.fournisseur,
        note: formDirect.note,
      };

      if (editId && editType === 'direct') {
        await api.put(`/achats-directs/${editId}`, payload);
        setEditId(null); setEditType(null);
      } else {
        await api.post('/achats-directs', payload);
      }
      setFormDirect({ code: '', nom: '', quantite: 1, prixAchat: 0, fournisseur: '', note: '' });
      setInfo('');
      load();
      loadProduits();
    } catch (e) {
      setErr(e.response?.data?.error || 'Erreur');
    }
  };

  // ========== DÉPENSE ==========
  const submitDepense = async e => {
    e.preventDefault();
    setErr('');
    try {
      if (editId && editType === 'depense') {
        await api.put(`/achats-directs/depense/${editId}`, { ...formDepense, estAchat: false });
        setEditId(null); setEditType(null);
      } else {
        await api.post('/achats-directs/depense', { ...formDepense, estAchat: false });
      }
      setFormDepense({ libelle: '', montant: 0, categorie: '', note: '' });
      load();
    } catch (e) {
      setErr(e.response?.data?.error || 'Erreur');
    }
  };

  // ========== ACTIONS ==========
  const editOperation = op => {
    if (op.type === 'facture') {
      setTypeForm('facture');
      setEditType('facture');
      setHeaderFacture({
        numFacture: op.raw.numFacture,
        fournisseur: op.raw.fournisseur || '',
        dateFacture: op.raw.dateFacture.slice(0, 10),
      });
      setLignesFacture(
        op.raw.lignes.map(l => ({
          code: '',
          produit: l.produit?._id || l.produit || '',
          designation: l.designation || '',
          quantite: l.quantite,
          prixUnitaire: l.prixUnitaire,
          isNew: false,
        }))
      );
      setRemise({ type: op.raw.remiseType || 'percent', valeur: op.raw.remiseValeur || 0 });
      setTva({ active: op.raw.tvaActive || false, taux: op.raw.tvaTaux || 19 });
    } else if (op.type === 'direct') {
      setTypeForm('direct');
      setEditType('direct');
      setFormDirect({
        code: op.raw.produit?.code || '',
        nom: op.raw.produit?.nom || '',
        quantite: op.raw.quantite,
        prixAchat: op.raw.prixUnitaire,
        fournisseur: op.raw.fournisseur || '',
        note: op.raw.note || '',
      });
    } else {
      setTypeForm('depense');
      setEditType('depense');
      setFormDepense({
        libelle: op.raw.libelle || '',
        montant: op.raw.montant || 0,
        categorie: op.raw.categorie || '',
        note: op.raw.note || '',
      });
    }
    setEditId(op._id);
    setInfo('');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const removeOperation = async op => {
    if (!confirm('Supprimer cette opération ?')) return;
    try {
      if (op.type === 'facture') await api.delete(`/factures/${op._id}`);
      else if (op.type === 'direct') await api.delete(`/achats-directs/${op._id}`);
      else await api.delete(`/achats-directs/depense/${op._id}`);
      load();
      loadProduits();
    } catch (e) {
      alert('Erreur : ' + (e.response?.data?.error || e.message));
    }
  };

  const resetAll = () => {
    setEditId(null); setEditType(null);
    resetFormFacture();
    setFormDirect({ code: '', nom: '', quantite: 1, prixAchat: 0, fournisseur: '', note: '' });
    setFormDepense({ libelle: '', montant: 0, categorie: '', note: '' });
    setInfo('');
  };

  // ========== TOTAUX ==========
  const totalFactures = factures.reduce((s, f) => s + (f.totalTTC || 0), 0);
  const totalDirects = directs.reduce((s, a) => s + (a.total || 0), 0);
  const totalDepenses = depenses.reduce((s, d) => s + (d.montant || 0), 0);
  const totalGlobal = totalFactures + totalDirects + totalDepenses;

  const operationsFiltrees = operations.filter(op => filtre === 'all' || op.type === filtre);
  const totauxFiltres = operationsFiltrees.reduce((acc, op) => ({ total: acc.total + (op.total || 0), nb: acc.nb + 1 }), { total: 0, nb: 0 });

  const periodeLabel =
    from && to
      ? from === to
        ? new Date(from + 'T00:00:00').toLocaleDateString('fr-FR')
        : `Du ${new Date(from + 'T00:00:00').toLocaleDateString('fr-FR')} au ${new Date(to + 'T00:00:00').toLocaleDateString('fr-FR')}`
      : 'Toutes les périodes';

  return (
    <>
      <div className="flex justify-between items-center mb-6 flex-wrap gap-2">
        <h1 className="text-2xl font-bold">🧾 Achats & Dépenses — {periodeLabel}</h1>
      </div>

      {/* FILTRE TYPE */}
      <div className="bg-white rounded-xl shadow p-2 mb-4 flex gap-1 flex-wrap">
        <button onClick={() => setFiltre('all')} className={`px-4 py-2 rounded font-semibold text-sm ${filtre === 'all' ? 'bg-slate-800 text-white' : 'text-slate-700 hover:bg-slate-100'}`}>📋 Tous ({operations.length})</button>
        <button onClick={() => setFiltre('facture')} className={`px-4 py-2 rounded font-semibold text-sm ${filtre === 'facture' ? 'bg-red-600 text-white' : 'text-slate-700 hover:bg-slate-100'}`}>📄 Factures ({factures.length})</button>
        <button onClick={() => setFiltre('direct')} className={`px-4 py-2 rounded font-semibold text-sm ${filtre === 'direct' ? 'bg-orange-600 text-white' : 'text-slate-700 hover:bg-slate-100'}`}>🛍️ Hors facture ({directs.length})</button>
        <button onClick={() => setFiltre('depense')} className={`px-4 py-2 rounded font-semibold text-sm ${filtre === 'depense' ? 'bg-slate-700 text-white' : 'text-slate-700 hover:bg-slate-100'}`}>💸 Dépenses ({depenses.length})</button>
      </div>

      {/* FILTRE PÉRIODE */}
      <div className="bg-white rounded-xl shadow p-4 mb-6">
        <div className="flex gap-3 items-end flex-wrap mb-3">
          <div><label className="text-xs text-slate-500">Du</label><input type="date" className="border rounded p-2 block" value={from} onChange={e => setFrom(e.target.value)} /></div>
          <div><label className="text-xs text-slate-500">Au</label><input type="date" className="border rounded p-2 block" value={to} onChange={e => setTo(e.target.value)} /></div>
          <button onClick={load} className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded font-semibold">🔍 Filtrer</button>
          <button onClick={setPeriodeTout} className="bg-slate-400 hover:bg-slate-500 text-white px-4 py-2 rounded">🔄 Tout afficher</button>
        </div>
        <div className="flex gap-2 flex-wrap">
          <span className="text-xs text-slate-500 self-center">Raccourcis :</span>
          <button onClick={setPeriodeAujourdhui} className="bg-slate-100 hover:bg-slate-200 text-slate-700 px-3 py-1 rounded text-xs font-semibold">📅 Aujourd'hui</button>
          <button onClick={setPeriodeSemaine} className="bg-slate-100 hover:bg-slate-200 text-slate-700 px-3 py-1 rounded text-xs font-semibold">📅 7 derniers jours</button>
          <button onClick={setPeriodeMois} className="bg-slate-100 hover:bg-slate-200 text-slate-700 px-3 py-1 rounded text-xs font-semibold">📅 Ce mois</button>
          <button onClick={setPeriodeAnnee} className="bg-slate-100 hover:bg-slate-200 text-slate-700 px-3 py-1 rounded text-xs font-semibold">📅 Cette année</button>
        </div>
      </div>

      {/* CARTES TOTAUX */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        <div className="bg-white rounded-xl shadow p-4 border-l-4 border-red-500">
          <p className="text-xs text-slate-500">📄 Factures</p>
          <p className="text-xl font-bold text-red-600">{totalFactures.toFixed(2)} DT</p>
          <p className="text-xs text-slate-400">{factures.length}</p>
        </div>
        <div className="bg-white rounded-xl shadow p-4 border-l-4 border-orange-500">
          <p className="text-xs text-slate-500">🛍️ Hors facture</p>
          <p className="text-xl font-bold text-orange-600">{totalDirects.toFixed(2)} DT</p>
          <p className="text-xs text-slate-400">{directs.length}</p>
        </div>
        <div className="bg-white rounded-xl shadow p-4 border-l-4 border-slate-500">
          <p className="text-xs text-slate-500">💸 Dépenses</p>
          <p className="text-xl font-bold text-slate-700">{totalDepenses.toFixed(2)} DT</p>
          <p className="text-xs text-slate-400">{depenses.length}</p>
        </div>
        <div className="bg-slate-800 text-white rounded-xl shadow p-4 border-l-4 border-blue-400">
          <p className="text-xs text-slate-300">💰 TOTAL GLOBAL</p>
          <p className="text-xl font-bold">{totalGlobal.toFixed(2)} DT</p>
        </div>
      </div>

      <div className="grid md:grid-cols-3 gap-6">
        {/* FORMULAIRE */}
        <div className="bg-white rounded-xl shadow p-5 space-y-3">
          <div className="flex gap-1 bg-slate-100 p-1 rounded flex-wrap">
            <button type="button" onClick={() => { resetAll(); setTypeForm('facture'); }} className={`flex-1 py-2 rounded text-xs font-semibold ${typeForm === 'facture' ? 'bg-red-600 text-white' : 'text-slate-600'}`}>📄 Facture</button>
            <button type="button" onClick={() => { resetAll(); setTypeForm('direct'); }} className={`flex-1 py-2 rounded text-xs font-semibold ${typeForm === 'direct' ? 'bg-orange-600 text-white' : 'text-slate-600'}`}>🛍️ Hors fact.</button>
            <button type="button" onClick={() => { resetAll(); setTypeForm('depense'); }} className={`flex-1 py-2 rounded text-xs font-semibold ${typeForm === 'depense' ? 'bg-slate-700 text-white' : 'text-slate-600'}`}>💸 Dépense</button>
          </div>

          <h2 className="font-bold">{editId ? '✏️ Modifier' : '➕ Ajouter'}</h2>
          {err && <div className="bg-red-100 text-red-700 p-2 rounded text-sm">{err}</div>}

          {/* FORM FACTURE */}
          {typeForm === 'facture' && (
            <form onSubmit={submitFacture} className="space-y-3">
              <input required placeholder="N° Facture *" className="w-full border rounded p-2 font-mono" value={headerFacture.numFacture} onChange={e => setHeaderFacture({ ...headerFacture, numFacture: e.target.value })} />
              <input placeholder="Fournisseur" className="w-full border rounded p-2" value={headerFacture.fournisseur} onChange={e => setHeaderFacture({ ...headerFacture, fournisseur: e.target.value })} />
              <input type="date" className="w-full border rounded p-2" value={headerFacture.dateFacture} onChange={e => setHeaderFacture({ ...headerFacture, dateFacture: e.target.value })} />

              <div className="border-t pt-2">
                <p className="text-xs text-slate-500 mb-1">Lignes :</p>
                {lignesFacture.map((l, i) => (
                  <div key={i} className="border rounded p-2 mb-1 bg-slate-50 space-y-1 text-xs">
                    <input placeholder="Code (STY-001)" className="w-full border rounded p-1 font-mono uppercase" value={l.code} onChange={e => onCodeChangeFacture(i, e.target.value)} list={`codes-f-${i}`} />
                    <datalist id={`codes-f-${i}`}>{produits.map(p => (<option key={p._id} value={p.code}>{p.nom}</option>))}</datalist>
                    <input placeholder="Désignation" className="w-full border rounded p-1" value={l.designation} onChange={e => updateLigneFacture(i, 'designation', e.target.value)} />
                    <div className="grid grid-cols-2 gap-1">
                      <input type="number" min="1" placeholder="Qté" className="border rounded p-1" value={l.quantite} onChange={e => updateLigneFacture(i, 'quantite', e.target.value)} />
                      <input type="number" step="0.01" placeholder="Prix achat" className="border rounded p-1" value={l.prixUnitaire} onChange={e => updateLigneFacture(i, 'prixUnitaire', e.target.value)} />
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="font-bold">Total : {(l.quantite * l.prixUnitaire).toFixed(2)}</span>
                      <button type="button" onClick={() => delLigneFacture(i)} className="text-red-600 text-xs">🗑️</button>
                    </div>
                  </div>
                ))}
                <button type="button" onClick={addLigneFacture} className="bg-blue-600 hover:bg-blue-700 text-white px-2 py-1 rounded text-xs">➕ Ligne</button>
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs">
                <div><label>Remise type</label><select className="w-full border rounded p-1" value={remise.type} onChange={e => setRemise({ ...remise, type: e.target.value })}><option value="percent">%</option><option value="montant">Montant</option></select></div>
                <div><label>Remise</label><input type="number" step="0.01" className="w-full border rounded p-1" value={remise.valeur} onChange={e => setRemise({ ...remise, valeur: +e.target.value })} /></div>
              </div>

              <div className="flex gap-2 items-center text-xs">
                <input type="checkbox" checked={tva.active} onChange={e => setTva({ ...tva, active: e.target.checked })} />
                <label>TVA</label>
                <input type="number" step="0.01" className="border rounded p-1 w-16" value={tva.taux} onChange={e => setTva({ ...tva, taux: +e.target.value })} />
                <span>%</span>
              </div>

              <div className="bg-slate-100 p-2 rounded text-xs space-y-1">
                <div className="flex justify-between"><span>Sous-total</span><b>{sousTotalFacture.toFixed(2)}</b></div>
                <div className="flex justify-between text-red-600"><span>Remise</span><b>-{remiseMontant.toFixed(2)}</b></div>
                <div className="flex justify-between text-blue-600"><span>TVA</span><b>{tvaMontant.toFixed(2)}</b></div>
                <div className="flex justify-between text-green-700 font-bold"><span>TOTAL TTC</span><b>{totalTTC.toFixed(2)}</b></div>
              </div>

              <button className="w-full bg-red-600 hover:bg-red-700 text-white py-2 rounded font-semibold">{editId ? '💾 Mettre à jour' : '💾 Enregistrer'}</button>
            </form>
          )}

          {/* FORM ACHAT DIRECT */}
          {typeForm === 'direct' && (
            <form onSubmit={submitDirect} className="space-y-2">
              <input required className="w-full border rounded p-2 font-mono uppercase" placeholder="Code (STY-001)" value={formDirect.code} onChange={e => onCodeChangeDirect(e.target.value)} list="codes-d" />
              <datalist id="codes-d">{produits.map(p => (<option key={p._id} value={p.code}>{p.nom}</option>))}</datalist>

              {info && (<div className={`p-2 rounded text-xs ${info.startsWith('✅') ? 'bg-green-50 text-green-700' : 'bg-yellow-50 text-yellow-700'}`}>{info}</div>)}

              <input placeholder="Nom" className="w-full border rounded p-2" value={formDirect.nom} onChange={e => setFormDirect({ ...formDirect, nom: e.target.value })} />
              <input type="number" step="0.01" placeholder="Prix achat" className="w-full border rounded p-2" value={formDirect.prixAchat} onChange={e => setFormDirect({ ...formDirect, prixAchat: +e.target.value })} />
              <input type="number" min="1" placeholder="Quantité" className="w-full border rounded p-2" value={formDirect.quantite} onChange={e => setFormDirect({ ...formDirect, quantite: +e.target.value })} />
              <input placeholder="Fournisseur" className="w-full border rounded p-2" value={formDirect.fournisseur} onChange={e => setFormDirect({ ...formDirect, fournisseur: e.target.value })} />
              <input placeholder="Note" className="w-full border rounded p-2" value={formDirect.note} onChange={e => setFormDirect({ ...formDirect, note: e.target.value })} />

              <div className="bg-orange-50 p-2 rounded text-sm">Total : <b className="text-orange-700">{(formDirect.quantite * formDirect.prixAchat).toFixed(2)} DT</b></div>

              <button className="w-full bg-orange-600 hover:bg-orange-700 text-white py-2 rounded font-semibold">{editId ? '💾 Mettre à jour' : '💾 Enregistrer'}</button>
            </form>
          )}

          {/* FORM DÉPENSE */}
          {typeForm === 'depense' && (
            <form onSubmit={submitDepense} className="space-y-2">
              <input required placeholder="Libellé *" className="w-full border rounded p-2" value={formDepense.libelle} onChange={e => setFormDepense({ ...formDepense, libelle: e.target.value })} />
              <input required type="number" step="0.01" placeholder="Montant *" className="w-full border rounded p-2" value={formDepense.montant} onChange={e => setFormDepense({ ...formDepense, montant: +e.target.value })} />
              <input placeholder="Catégorie" className="w-full border rounded p-2" value={formDepense.categorie} onChange={e => setFormDepense({ ...formDepense, categorie: e.target.value })} />
              <input placeholder="Note" className="w-full border rounded p-2" value={formDepense.note} onChange={e => setFormDepense({ ...formDepense, note: e.target.value })} />
              <button className="w-full bg-slate-700 hover:bg-slate-800 text-white py-2 rounded font-semibold">{editId ? '💾 Mettre à jour' : '💾 Enregistrer'}</button>
            </form>
          )}

          {editId && (
            <button type="button" onClick={resetAll} className="w-full bg-slate-400 hover:bg-slate-500 text-white py-2 rounded">❌ Annuler</button>
          )}
        </div>

        {/* TABLEAU */}
        <div className="md:col-span-2 bg-white rounded-xl shadow p-5">
          <div className="flex justify-between items-center mb-3 flex-wrap gap-2">
            <h2 className="font-bold">📋 Historique</h2>
            <span className="bg-slate-100 text-slate-800 px-3 py-1 rounded-full font-bold">
              {filtre === 'all' && `Total : ${totalGlobal.toFixed(2)} DT`}
              {filtre === 'facture' && `Factures : ${totalFactures.toFixed(2)} DT`}
              {filtre === 'direct' && `Hors facture : ${totalDirects.toFixed(2)} DT`}
              {filtre === 'depense' && `Dépenses : ${totalDepenses.toFixed(2)} DT`}
            </span>
          </div>

          <div className="overflow-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-100">
                <tr>
                  <th className="p-2 text-left">Type</th>
                  <th className="p-2 text-left">Détail</th>
                  <th className="p-2 text-left">Fournisseur / Cat.</th>
                  <th className="p-2 text-left">Date</th>
                  <th className="p-2 text-right">Montant</th>
                  <th className="p-2 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {operationsFiltrees.map(op => (
                  <tr key={`${op.type}-${op._id}`} className="border-b hover:bg-slate-50">
                    <td className="p-2">
                      {op.type === 'facture' && <span className="bg-red-100 text-red-700 px-2 py-1 rounded text-xs font-bold">📄 Facture</span>}
                      {op.type === 'direct' && <span className="bg-orange-100 text-orange-700 px-2 py-1 rounded text-xs font-bold">🛍️ Hors fact.</span>}
                      {op.type === 'depense' && <span className="bg-slate-200 text-slate-700 px-2 py-1 rounded text-xs font-bold">💸 Dépense</span>}
                    </td>
                    <td className="p-2 font-medium">{op.type === 'facture' ? op.numero : op.detail}</td>
                    <td className="p-2 text-xs text-slate-600">{op.fournisseur}</td>
                    <td className="p-2 text-xs">{new Date(op.date).toLocaleDateString('fr-FR')}</td>
                    <td className="p-2 text-right font-bold text-slate-800">{op.total.toFixed(2)} DT</td>
                    <td className="p-2 text-right whitespace-nowrap">
                      <button onClick={() => editOperation(op)} className="bg-blue-100 hover:bg-blue-200 text-blue-700 px-2 py-1 rounded text-xs font-semibold mr-1">✏️</button>
                      <button onClick={() => removeOperation(op)} className="bg-red-100 hover:bg-red-200 text-red-700 px-2 py-1 rounded text-xs font-semibold">🗑️</button>
                    </td>
                  </tr>
                ))}
                {operationsFiltrees.length === 0 && (<tr><td colSpan="6" className="p-4 text-center text-slate-500">Aucune opération</td></tr>)}
                {operationsFiltrees.length > 0 && (
                  <tr className="bg-slate-800 text-white font-bold border-t-2 border-slate-900">
                    <td className="p-2" colSpan="4">TOTAL ({totauxFiltres.nb} opération{totauxFiltres.nb > 1 ? 's' : ''})</td>
                    <td className="p-2 text-right text-base">{totauxFiltres.total.toFixed(2)} DT</td>
                    <td></td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </>
  );
}

export default Achats;
export { Achats };