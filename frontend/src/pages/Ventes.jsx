import { useEffect, useState } from 'react';
import api from '../api/axios';

function Ventes() {
  const [produits, setProduits] = useState([]);
  const [ventes, setVentes] = useState([]);
  const [form, setForm] = useState({ produit: '', quantite: 1, prixUnitaire: 0, note: '' });
  const [editId, setEditId] = useState(null);

  const today = new Date().toISOString().slice(0, 10);

  const load = () => {
    api.get(`/ventes?date=${today}`).then(r => setVentes(r.data));
    api.get('/produits').then(r => setProduits(r.data));
  };
  useEffect(load, []);

  const onProduitChange = id => {
    const p = produits.find(x => x._id === id);
    setForm({ ...form, produit: id, prixUnitaire: p ? p.prixVente : 0 });
  };

  const submit = async e => {
    e.preventDefault();
    if (!form.produit) return;

    if (editId) {
      await api.put(`/ventes/${editId}`, form);
      setEditId(null);
    } else {
      await api.post('/ventes', form);
    }

    setForm({ produit: '', quantite: 1, prixUnitaire: 0, note: '' });
    load();
  };

  const edit = v => {
    setForm({
      produit: v.produit?._id || '',
      quantite: v.quantite,
      prixUnitaire: v.prixUnitaire,
      note: v.note || '',
    });
    setEditId(v._id);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const remove = async id => {
    if (!confirm('Supprimer cette vente ? (le stock sera restauré)')) return;
    await api.delete(`/ventes/${id}`);
    load();
  };

  const totalJour = ventes.reduce((s, v) => s + v.total, 0);

  return (
    <>
      <h1 className="text-2xl font-bold mb-6">
        🛒 Ventes du jour — {new Date().toLocaleDateString('fr-FR')}
      </h1>

      <div className="grid md:grid-cols-3 gap-6">
        <form onSubmit={submit} className="md:col-span-1 bg-white rounded-xl shadow p-5 space-y-3">
          <h2 className="font-bold">{editId ? '✏️ Modifier la vente' : '➕ Nouvelle vente'}</h2>

          <select
            className="w-full border rounded p-2"
            value={form.produit}
            onChange={e => onProduitChange(e.target.value)}
            required
          >
            <option value="">-- Choisir --</option>
            {produits.map(p => (
              <option key={p._id} value={p._id}>
                {p.code} — {p.nom} ({p.stock} stock)
              </option>
            ))}
          </select>

          <input
            type="number"
            min="1"
            className="w-full border rounded p-2"
            value={form.quantite}
            onChange={e => setForm({ ...form, quantite: +e.target.value })}
            placeholder="Quantité"
          />

          <input
            type="number"
            step="0.01"
            className="w-full border rounded p-2"
            value={form.prixUnitaire}
            onChange={e => setForm({ ...form, prixUnitaire: +e.target.value })}
            placeholder="Prix unitaire"
          />

          <input
            className="w-full border rounded p-2"
            placeholder="Note (optionnel)"
            value={form.note}
            onChange={e => setForm({ ...form, note: e.target.value })}
          />

          <div className="bg-slate-50 p-2 rounded text-sm">
            Total : <b>{(form.quantite * form.prixUnitaire).toFixed(2)} DT</b>
          </div>

          <button className="w-full bg-green-600 hover:bg-green-700 text-white py-2 rounded">
            {editId ? 'Mettre à jour' : 'Enregistrer'}
          </button>

          {editId && (
            <button
              type="button"
              onClick={() => {
                setEditId(null);
                setForm({ produit: '', quantite: 1, prixUnitaire: 0, note: '' });
              }}
              className="w-full bg-slate-400 text-white py-2 rounded"
            >
              Annuler
            </button>
          )}
        </form>

        <div className="md:col-span-2 bg-white rounded-xl shadow p-5">
          <div className="flex justify-between items-center mb-4">
            <h2 className="font-bold">📋 Détail du jour</h2>
            <span className="bg-green-100 text-green-800 px-3 py-1 rounded-full font-bold">
              Total : {totalJour.toFixed(2)} DT
            </span>
          </div>

          <table className="w-full text-sm">
            <thead className="bg-slate-100">
              <tr>
                <th className="p-2 text-left">Code</th>
                <th className="p-2 text-left">Produit</th>
                <th className="p-2">Qté</th>
                <th className="p-2">P.U</th>
                <th className="p-2">Total</th>
                <th className="p-2 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {ventes.map(v => (
                <tr key={v._id} className="border-b hover:bg-slate-50">
                  <td className="p-2 font-mono text-xs bg-slate-50">
                    {v.produit?.code || '—'}
                  </td>
                  <td className="p-2">{v.produit?.nom || '—'}</td>
                  <td className="p-2 text-center">{v.quantite}</td>
                  <td className="p-2 text-center">{v.prixUnitaire.toFixed(2)}</td>
                  <td className="p-2 text-center font-bold text-green-700">
                    {v.total.toFixed(2)}
                  </td>
                  <td className="p-2 text-right">
                    <button
                      onClick={() => edit(v)}
                      className="bg-blue-100 hover:bg-blue-200 text-blue-700 px-3 py-1 rounded text-xs font-semibold mr-1"
                    >
                      ✏️ Modifier
                    </button>
                    <button
                      onClick={() => remove(v._id)}
                      className="bg-red-100 hover:bg-red-200 text-red-700 px-3 py-1 rounded text-xs font-semibold"
                    >
                      🗑️ Supprimer
                    </button>
                  </td>
                </tr>
              ))}
              {ventes.length === 0 && (
                <tr>
                  <td colSpan="6" className="p-4 text-center text-slate-500">
                    Aucune vente aujourd'hui
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}

export default Ventes;
export { Ventes };