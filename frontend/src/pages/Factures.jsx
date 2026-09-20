import { useEffect, useState } from 'react';
import api from '../api/axios';

function Factures() {
  const [produits, setProduits] = useState([]);
  const [factures, setFactures] = useState([]);
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [editId, setEditId] = useState(null);

  const [header, setHeader] = useState({
    numFacture: '',
    fournisseur: '',
    dateFacture: new Date().toISOString().slice(0, 10),
  });

  const [lignes, setLignes] = useState([
    {
      code: '',
      produit: '',
      designation: '',
      quantite: 1,
      prixUnitaire: 0,
      prixVente: 0,
      isNew: false,
    },
  ]);

  const [remise, setRemise] = useState({ type: 'percent', valeur: 0 });
  const [tva, setTva] = useState({ active: false, taux: 19 });

  const loadFactures = async () => {
    let url = '/factures';
    if (from && to) url += `?from=${from}&to=${to}`;
    const { data } = await api.get(url);
    setFactures(data);
  };

  useEffect(() => {
    api.get('/produits').then(r => setProduits(r.data));
    loadFactures();
  }, []);

  const onCodeChange = (i, val) => {
    const code = val.toUpperCase();
    const arr = [...lignes];
    const existing = produits.find(p => p.code === code);

    arr[i].code = code;

    if (existing) {
      arr[i].produit = existing._id;
      arr[i].designation = `[${existing.code}] ${existing.nom}`;
      arr[i].prixUnitaire = existing.prixAchat;
      arr[i].prixVente = existing.prixVente;
      arr[i].isNew = false;
    } else {
      arr[i].produit = '';
      arr[i].isNew = true;
    }

    setLignes(arr);
  };

  const updateLigne = (i, field, val) => {
    const arr = [...lignes];
    if (field === 'quantite' || field === 'prixUnitaire' || field === 'prixVente') {
      arr[i][field] = +val;
    } else {
      arr[i][field] = val;
    }
    setLignes(arr);
  };

  const addLigne = () =>
    setLignes([
      ...lignes,
      {
        code: '',
        produit: '',
        designation: '',
        quantite: 1,
        prixUnitaire: 0,
        prixVente: 0,
        isNew: false,
      },
    ]);

  const delLigne = i => setLignes(lignes.filter((_, idx) => idx !== i));

  const sousTotal = lignes.reduce((s, l) => s + l.quantite * l.prixUnitaire, 0);
  const remiseMontant =
    remise.type === 'percent' ? (sousTotal * remise.valeur) / 100 : remise.valeur;
  const baseHT = sousTotal - remiseMontant;
  const tvaMontant = tva.active ? (baseHT * tva.taux) / 100 : 0;
  const totalTTC = baseHT + tvaMontant;

  const resetForm = () => {
    setHeader({
      numFacture: '',
      fournisseur: '',
      dateFacture: new Date().toISOString().slice(0, 10),
    });
    setLignes([
      {
        code: '',
        produit: '',
        designation: '',
        quantite: 1,
        prixUnitaire: 0,
        prixVente: 0,
        isNew: false,
      },
    ]);
    setRemise({ type: 'percent', valeur: 0 });
    setTva({ active: false, taux: 19 });
    setEditId(null);
  };

  const submit = async e => {
    e.preventDefault();

    const lignesResolues = [];

    for (const l of lignes) {
      if (!l.code) continue;

      let produitId = l.produit;

      if (!produitId) {
        // Créer le produit avec prixAchat ET prixVente
        const { data } = await api.post('/produits/find-or-create', {
          code: l.code,
          nom: l.designation || `Produit ${l.code}`,
          prixAchat: l.prixUnitaire,
          prixVente: l.prixVente,
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
      ...header,
      lignes: lignesResolues,
      sousTotal,
      remiseType: remise.type,
      remiseValeur: remise.valeur,
      remiseMontant,
      tvaActive: tva.active,
      tvaTaux: tva.taux,
      tvaMontant,
      totalTTC,
    };

    if (editId) await api.put(`/factures/${editId}`, payload);
    else await api.post('/factures', payload);

    resetForm();
    loadFactures();
  };

  const edit = f => {
    setEditId(f._id);
    setHeader({
      numFacture: f.numFacture,
      fournisseur: f.fournisseur || '',
      dateFacture: f.dateFacture.slice(0, 10),
    });
    setLignes(
      f.lignes.map(l => ({
        code: '',
        produit: l.produit?._id || l.produit || '',
        designation: l.designation || '',
        quantite: l.quantite,
        prixUnitaire: l.prixUnitaire,
        prixVente: 0,
        isNew: false,
      }))
    );
    setRemise({ type: f.remiseType || 'percent', valeur: f.remiseValeur || 0 });
    setTva({ active: f.tvaActive || false, taux: f.tvaTaux || 19 });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const removeFacture = async id => {
    if (!confirm('Supprimer cette facture ? (le stock sera ajusté)')) return;
    await api.delete(`/factures/${id}`);
    loadFactures();
  };

  return (
    <>
      <h1 className="text-2xl font-bold mb-6">
        {editId ? '✏️ Modifier la Facture' : "🧾 Nouvelle Facture d'Achat"}
      </h1>

      <form onSubmit={submit} className="bg-white rounded-xl shadow p-5 space-y-5">
        <div className="grid md:grid-cols-3 gap-4">
          <div>
            <label className="text-sm text-slate-600">N° Facture *</label>
            <input
              required
              placeholder="Ex: FAC-001"
              className="w-full border rounded p-2"
              value={header.numFacture}
              onChange={e => setHeader({ ...header, numFacture: e.target.value })}
            />
          </div>
          <div>
            <label className="text-sm text-slate-600">Fournisseur</label>
            <input
              placeholder="Ex: Grossiste XYZ"
              className="w-full border rounded p-2"
              value={header.fournisseur}
              onChange={e => setHeader({ ...header, fournisseur: e.target.value })}
            />
          </div>
          <div>
            <label className="text-sm text-slate-600">Date *</label>
            <input
              type="date"
              className="w-full border rounded p-2"
              value={header.dateFacture}
              onChange={e => setHeader({ ...header, dateFacture: e.target.value })}
            />
          </div>
        </div>

        <div>
          <div className="flex justify-between items-center mb-2">
            <h3 className="font-bold">📦 Lignes d'achat</h3>
            <button
              type="button"
              onClick={addLigne}
              className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded text-sm font-semibold"
            >
              ➕ Ajouter ligne
            </button>
          </div>

          <p className="text-xs text-slate-500 mb-2">
            💡 Tape le <b>code produit</b>. S'il n'existe pas, il sera créé automatiquement
            avec le <b>prix d'achat</b> et le <b>prix de vente</b> saisis.
          </p>

          <div className="overflow-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-100">
                <tr>
                  <th className="p-2 w-28">Code</th>
                  <th className="p-2">Désignation</th>
                  <th className="p-2 w-16">Qté</th>
                  <th className="p-2 w-24">P. Achat</th>
                  <th className="p-2 w-24">P. Vente</th>
                  <th className="p-2 w-24">Total</th>
                  <th className="p-2 w-24">État</th>
                  <th className="p-2 w-12">Action</th>
                </tr>
              </thead>
              <tbody>
                {lignes.map((l, i) => {
                  const existing = produits.find(p => p.code === l.code);
                  return (
                    <tr key={i} className="border-b">
                      <td className="p-1">
                        <input
                          className="border rounded p-1 w-full font-mono uppercase"
                          placeholder="STY-001"
                          value={l.code}
                          onChange={e => onCodeChange(i, e.target.value)}
                          list={`codes-${i}`}
                        />
                        <datalist id={`codes-${i}`}>
                          {produits.map(p => (
                            <option key={p._id} value={p.code}>
                              {p.nom}
                            </option>
                          ))}
                        </datalist>
                      </td>
                      <td className="p-1">
                        <input
                          className="border rounded p-1 w-full"
                          placeholder="Nom du produit"
                          value={l.designation}
                          onChange={e => updateLigne(i, 'designation', e.target.value)}
                        />
                      </td>
                      <td className="p-1">
                        <input
                          type="number"
                          min="1"
                          className="border rounded p-1 w-full"
                          value={l.quantite}
                          onChange={e => updateLigne(i, 'quantite', e.target.value)}
                        />
                      </td>
                      <td className="p-1">
                        <input
                          type="number"
                          step="0.01"
                          className="border rounded p-1 w-full"
                          value={l.prixUnitaire}
                          onChange={e => updateLigne(i, 'prixUnitaire', e.target.value)}
                        />
                      </td>
                      <td className="p-1">
                        <input
                          type="number"
                          step="0.01"
                          className="border rounded p-1 w-full"
                          value={l.prixVente}
                          onChange={e => updateLigne(i, 'prixVente', e.target.value)}
                        />
                      </td>
                      <td className="p-1 text-right font-medium">
                        {(l.quantite * l.prixUnitaire).toFixed(2)}
                      </td>
                      <td className="p-1 text-center text-xs">
                        {!l.code ? (
                          <span className="text-slate-400">—</span>
                        ) : existing ? (
                          <span className="bg-green-100 text-green-700 px-2 py-1 rounded font-semibold">
                            ✅ Existant
                          </span>
                        ) : (
                          <span className="bg-yellow-100 text-yellow-700 px-2 py-1 rounded font-semibold">
                            ➕ Nouveau
                          </span>
                        )}
                      </td>
                      <td className="p-1 text-center">
                        <button
                          type="button"
                          onClick={() => delLigne(i)}
                          className="bg-red-100 hover:bg-red-200 text-red-700 px-2 py-1 rounded text-xs font-semibold"
                        >
                          🗑️
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          <div className="space-y-3 bg-slate-50 p-4 rounded">
            <h3 className="font-bold">💰 Calculs</h3>

            <div className="flex gap-2 items-center">
              <label className="w-32 text-sm">Sous-total</label>
              <input
                readOnly
                value={sousTotal.toFixed(2)}
                className="border rounded p-2 flex-1 bg-white"
              />
            </div>

            <div className="flex gap-2 items-center">
              <label className="w-32 text-sm">Type remise</label>
              <select
                className="border rounded p-2 flex-1"
                value={remise.type}
                onChange={e => setRemise({ ...remise, type: e.target.value })}
              >
                <option value="percent">Pourcentage (%)</option>
                <option value="montant">Montant fixe</option>
              </select>
            </div>

            <div className="flex gap-2 items-center">
              <label className="w-32 text-sm">Remise</label>
              <input
                type="number"
                step="0.01"
                className="border rounded p-2 flex-1"
                value={remise.valeur}
                onChange={e => setRemise({ ...remise, valeur: +e.target.value })}
              />
            </div>

            <div className="flex gap-2 items-center">
              <input
                type="checkbox"
                className="w-4 h-4"
                checked={tva.active}
                onChange={e => setTva({ ...tva, active: e.target.checked })}
              />
              <label className="text-sm">Appliquer TVA</label>
              <input
                type="number"
                step="0.01"
                className="border rounded p-2 w-20"
                value={tva.taux}
                onChange={e => setTva({ ...tva, taux: +e.target.value })}
              />
              <span className="text-sm">%</span>
            </div>
          </div>

          <div className="space-y-2 bg-slate-50 p-4 rounded text-sm">
            <div className="flex justify-between">
              <span>Sous-total</span>
              <b>{sousTotal.toFixed(2)}</b>
            </div>
            <div className="flex justify-between text-red-600">
              <span>Remise</span>
              <b>-{remiseMontant.toFixed(2)}</b>
            </div>
            <div className="flex justify-between">
              <span>Base HT</span>
              <b>{baseHT.toFixed(2)}</b>
            </div>
            <div className="flex justify-between text-blue-600">
              <span>TVA</span>
              <b>{tvaMontant.toFixed(2)}</b>
            </div>
            <hr />
            <div className="flex justify-between text-lg font-bold text-green-700">
              <span>TOTAL TTC</span>
              <b>{totalTTC.toFixed(2)}</b>
            </div>
          </div>
        </div>

        <button className="w-full bg-green-600 hover:bg-green-700 text-white py-3 rounded font-bold">
          {editId ? '💾 Mettre à jour la facture' : '💾 Enregistrer la facture'}
        </button>

        {editId && (
          <button
            type="button"
            onClick={resetForm}
            className="w-full bg-slate-400 hover:bg-slate-500 text-white py-2 rounded"
          >
            ❌ Annuler l'édition
          </button>
        )}
      </form>

      <h2 className="text-lg font-bold mt-8 mb-3">📚 Historique factures</h2>

      <div className="bg-white rounded-xl shadow p-4 mb-3 flex gap-3 items-end flex-wrap">
        <div>
          <label className="text-xs">Du</label>
          <input
            type="date"
            className="border rounded p-2 block"
            value={from}
            onChange={e => setFrom(e.target.value)}
          />
        </div>
        <div>
          <label className="text-xs">Au</label>
          <input
            type="date"
            className="border rounded p-2 block"
            value={to}
            onChange={e => setTo(e.target.value)}
          />
        </div>
        <button
          onClick={loadFactures}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded"
        >
          🔍 Filtrer
        </button>
        <button
          onClick={() => {
            setFrom('');
            setTo('');
            loadFactures();
          }}
          className="bg-slate-400 hover:bg-slate-500 text-white px-4 py-2 rounded"
        >
          🔄 Reset
        </button>
      </div>

      <div className="bg-white rounded-xl shadow overflow-auto">
        <table className="w-full text-sm">
          <thead className="bg-slate-100">
            <tr>
              <th className="p-2 text-left">N°</th>
              <th className="p-2 text-left">Fournisseur</th>
              <th className="p-2 text-left">Date</th>
              <th className="p-2 text-right">Sous-total</th>
              <th className="p-2 text-right">Remise</th>
              <th className="p-2 text-right">TVA</th>
              <th className="p-2 text-right">TTC</th>
              <th className="p-2 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {factures.map(f => (
              <tr key={f._id} className="border-b hover:bg-slate-50">
                <td className="p-2 font-mono">{f.numFacture}</td>
                <td className="p-2">{f.fournisseur || '—'}</td>
                <td className="p-2">{new Date(f.dateFacture).toLocaleDateString('fr-FR')}</td>
                <td className="p-2 text-right">{f.sousTotal.toFixed(2)}</td>
                <td className="p-2 text-right text-red-600">
                  -{f.remiseMontant.toFixed(2)}
                </td>
                <td className="p-2 text-right text-blue-600">{f.tvaMontant.toFixed(2)}</td>
                <td className="p-2 text-right font-bold text-green-700">
                  {f.totalTTC.toFixed(2)}
                </td>
                <td className="p-2 text-right whitespace-nowrap">
                  <button
                    onClick={() => edit(f)}
                    className="bg-blue-100 hover:bg-blue-200 text-blue-700 px-3 py-1 rounded text-xs font-semibold mr-1"
                  >
                    ✏️ Modifier
                  </button>
                  <button
                    onClick={() => removeFacture(f._id)}
                    className="bg-red-100 hover:bg-red-200 text-red-700 px-3 py-1 rounded text-xs font-semibold"
                  >
                    🗑️ Supprimer
                  </button>
                </td>
              </tr>
            ))}
            {factures.length === 0 && (
              <tr>
                <td colSpan="8" className="p-4 text-center text-slate-500">
                  Aucune facture enregistrée
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </>
  );
}

export default Factures;
export { Factures };