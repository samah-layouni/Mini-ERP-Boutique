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
    { produit: '', designation: '', quantite: 1, prixUnitaire: 0 },
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

  const updateLigne = (i, field, val) => {
    const arr = [...lignes];
    if (field === 'produit') {
      arr[i].produit = val;
      const p = produits.find(x => x._id === val);
      if (p) {
        arr[i].prixUnitaire = p.prixAchat;
        arr[i].designation = p.nom;
      }
    } else if (field === 'quantite' || field === 'prixUnitaire') {
      arr[i][field] = +val;
    } else {
      arr[i][field] = val;
    }
    setLignes(arr);
  };

  const addLigne = () =>
    setLignes([...lignes, { produit: '', designation: '', quantite: 1, prixUnitaire: 0 }]);

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
    setLignes([{ produit: '', designation: '', quantite: 1, prixUnitaire: 0 }]);
    setRemise({ type: 'percent', valeur: 0 });
    setTva({ active: false, taux: 19 });
    setEditId(null);
  };

  const submit = async e => {
    e.preventDefault();

    const payload = {
      ...header,
      lignes: lignes.map(l => ({ ...l, totalLigne: l.quantite * l.prixUnitaire })),
      sousTotal,
      remiseType: remise.type,
      remiseValeur: remise.valeur,
      remiseMontant,
      tvaActive: tva.active,
      tvaTaux: tva.taux,
      tvaMontant,
      totalTTC,
    };

    if (editId) {
      // Pour édition : on supprime + recrée
      await api.delete(`/factures/${editId}`);
      await api.post('/factures', payload);
    } else {
      await api.post('/factures', payload);
    }

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
        produit: l.produit?._id || l.produit || '',
        designation: l.designation || '',
        quantite: l.quantite,
        prixUnitaire: l.prixUnitaire,
      }))
    );
    setRemise({ type: f.remiseType || 'percent', valeur: f.remiseValeur || 0 });
    setTva({ active: f.tvaActive || false, taux: f.tvaTaux || 19 });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const removeFacture = async id => {
    if (!confirm('Supprimer cette facture ?')) return;
    await api.delete(`/factures/${id}`);
    loadFactures();
  };

  return (
    <>
      <h1 className="text-2xl font-bold mb-6">
        {editId ? '✏️ Modifier la Facture' : '🧾 Nouvelle Facture d\'Achat'}
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
              className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded text-sm"
            >
              + Ajouter ligne
            </button>
          </div>

          <table className="w-full text-sm">
            <thead className="bg-slate-100">
              <tr>
                <th className="p-2">Produit</th>
                <th className="p-2">Désignation</th>
                <th className="p-2 w-20">Qté</th>
                <th className="p-2 w-28">P.U</th>
                <th className="p-2 w-28">Total</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {lignes.map((l, i) => (
                <tr key={i} className="border-b">
                  <td className="p-1">
                    <select
                      className="border rounded p-1 w-full"
                      value={l.produit}
                      onChange={e => updateLigne(i, 'produit', e.target.value)}
                    >
                      <option value="">--</option>
                      {produits.map(p => (
                        <option key={p._id} value={p._id}>
                          {p.nom}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td className="p-1">
                    <input
                      className="border rounded p-1 w-full"
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
                  <td className="p-1 text-right font-medium">
                    {(l.quantite * l.prixUnitaire).toFixed(2)}
                  </td>
                  <td className="p-1">
                    <button
                      type="button"
                      onClick={() => delLigne(i)}
                      className="text-red-600 hover:text-red-800"
                    >
                      <i className="fa fa-trash"></i>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
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
            className="w-full bg-slate-400 text-white py-2 rounded"
          >
            Annuler l'édition
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
          Filtrer
        </button>
        <button
          onClick={() => {
            setFrom('');
            setTo('');
            loadFactures();
          }}
          className="bg-slate-400 text-white px-4 py-2 rounded"
        >
          Reset
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
                <td className="p-2 text-right space-x-2">
                  <button
                    onClick={() => edit(f)}
                    className="text-blue-600 hover:text-blue-800"
                    title="Modifier"
                  >
                    <i className="fa fa-pen"></i>
                  </button>
                  <button
                    onClick={() => removeFacture(f._id)}
                    className="text-red-600 hover:text-red-800"
                    title="Supprimer"
                  >
                    <i className="fa fa-trash"></i>
                  </button>
                </td>
              </tr>
            ))}
            {factures.length === 0 && (
              <tr>
                <td colSpan="8" className="p-4 text-center text-slate-500">
                  Aucune facture
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