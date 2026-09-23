import { useEffect, useState } from 'react';
import api from '../api/axios';

function Ventes() {
  const [produits, setProduits] = useState([]);
  const [ventes, setVentes] = useState([]);
  const [form, setForm] = useState({ produit: '', quantite: 1, prixUnitaire: 0, note: '' });
  const [editId, setEditId] = useState(null);

  // 🔑 Période : par défaut aujourd'hui → aujourd'hui
  const today = new Date().toISOString().slice(0, 10);
  const [from, setFrom] = useState(today);
  const [to, setTo] = useState(today);

  const load = async () => {
    // On appelle la route ventes avec les 2 dates
    const { data } = await api.get(`/ventes?from=${from}&to=${to}`);
    setVentes(data);
  };

  const loadProduits = () => {
    api.get('/produits').then(r => setProduits(r.data));
  };

  useEffect(() => {
    load();
  }, [from, to]);

  useEffect(() => {
    loadProduits();
  }, []);

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

  // ---- Raccourcis période ----
  const setPeriodeAujourdhui = () => {
    const t = new Date().toISOString().slice(0, 10);
    setFrom(t);
    setTo(t);
  };

  const setPeriodeHier = () => {
    const d = new Date();
    d.setDate(d.getDate() - 1);
    const y = d.toISOString().slice(0, 10);
    setFrom(y);
    setTo(y);
  };

  const setPeriode7Jours = () => {
    const d = new Date();
    d.setDate(d.getDate() - 7);
    setFrom(d.toISOString().slice(0, 10));
    setTo(new Date().toISOString().slice(0, 10));
  };

  const setPeriodeMois = () => {
    const d = new Date();
    d.setDate(1);
    setFrom(d.toISOString().slice(0, 10));
    setTo(new Date().toISOString().slice(0, 10));
  };

  const setPeriodeAnnee = () => {
    const d = new Date();
    d.setMonth(0, 1);
    setFrom(d.toISOString().slice(0, 10));
    setTo(new Date().toISOString().slice(0, 10));
  };

  const setPeriodeTout = () => {
    setFrom('');
    setTo('');
  };

  // ---- Calculs ----
  const totalPeriode = ventes.reduce((s, v) => s + v.total, 0);
  const totalQuantite = ventes.reduce((s, v) => s + v.quantite, 0);
  const nbVentes = ventes.length;

  // Groupement par jour pour affichage
  const ventesParJour = {};
  ventes.forEach(v => {
    const key = new Date(v.date).toISOString().slice(0, 10);
    if (!ventesParJour[key]) ventesParJour[key] = [];
    ventesParJour[key].push(v);
  });
  const joursTries = Object.keys(ventesParJour).sort((a, b) => (a < b ? 1 : -1));

  // Libellé période
  const periodeLabel =
    from && to
      ? from === to
        ? new Date(from).toLocaleDateString('fr-FR', {
            weekday: 'long',
            day: '2-digit',
            month: 'long',
            year: 'numeric',
          })
        : `Du ${new Date(from).toLocaleDateString('fr-FR')} au ${new Date(to).toLocaleDateString('fr-FR')}`
      : 'Toutes les périodes';

  return (
    <>
      <h1 className="text-2xl font-bold mb-4">
        🛒 Ventes — {periodeLabel}
      </h1>

      {/* ========== FILTRE PÉRIODE ========== */}
      <div className="bg-white rounded-xl shadow p-4 mb-6">
        <div className="flex gap-3 items-end flex-wrap mb-3">
          <div>
            <label className="text-xs text-slate-500">Du</label>
            <input
              type="date"
              className="border rounded p-2 block"
              value={from}
              onChange={e => setFrom(e.target.value)}
            />
          </div>
          <div>
            <label className="text-xs text-slate-500">Au</label>
            <input
              type="date"
              className="border rounded p-2 block"
              value={to}
              onChange={e => setTo(e.target.value)}
            />
          </div>
          <button
            onClick={load}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded font-semibold"
          >
            🔍 Afficher
          </button>
          <button
            onClick={setPeriodeTout}
            className="bg-slate-400 hover:bg-slate-500 text-white px-4 py-2 rounded"
          >
            🔄 Tout afficher
          </button>
        </div>

        <div className="flex gap-2 flex-wrap">
          <span className="text-xs text-slate-500 self-center">Raccourcis :</span>
          <button
            onClick={setPeriodeAujourdhui}
            className="bg-slate-100 hover:bg-slate-200 text-slate-700 px-3 py-1 rounded text-xs font-semibold"
          >
            📅 Aujourd'hui
          </button>
          <button
            onClick={setPeriodeHier}
            className="bg-slate-100 hover:bg-slate-200 text-slate-700 px-3 py-1 rounded text-xs font-semibold"
          >
            📅 Hier
          </button>
          <button
            onClick={setPeriode7Jours}
            className="bg-slate-100 hover:bg-slate-200 text-slate-700 px-3 py-1 rounded text-xs font-semibold"
          >
            📅 7 derniers jours
          </button>
          <button
            onClick={setPeriodeMois}
            className="bg-slate-100 hover:bg-slate-200 text-slate-700 px-3 py-1 rounded text-xs font-semibold"
          >
            📅 Ce mois
          </button>
          <button
            onClick={setPeriodeAnnee}
            className="bg-slate-100 hover:bg-slate-200 text-slate-700 px-3 py-1 rounded text-xs font-semibold"
          >
            📅 Cette année
          </button>
        </div>
      </div>

      {/* ========== CARTES TOTAUX ========== */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-white rounded-xl shadow p-5 border-l-4 border-blue-500">
          <p className="text-sm text-slate-500">Nombre de ventes</p>
          <p className="text-2xl font-bold text-blue-600">{nbVentes}</p>
        </div>
        <div className="bg-white rounded-xl shadow p-5 border-l-4 border-purple-500">
          <p className="text-sm text-slate-500">Quantité totale vendue</p>
          <p className="text-2xl font-bold text-purple-600">{totalQuantite}</p>
        </div>
        <div className="bg-white rounded-xl shadow p-5 border-l-4 border-green-500">
          <p className="text-sm text-slate-500">Total période</p>
          <p className="text-2xl font-bold text-green-600">{totalPeriode.toFixed(2)} DT</p>
        </div>
      </div>

      <div className="grid md:grid-cols-3 gap-6">
        {/* ========== FORMULAIRE ========== */}
        <form onSubmit={submit} className="md:col-span-1 bg-white rounded-xl shadow p-5 space-y-3 h-fit">
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
                [{p.code}] {p.nom} ({p.stock} stock)
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

        {/* ========== DÉTAIL PAR JOUR ========== */}
        <div className="md:col-span-2 bg-white rounded-xl shadow p-5">
          <div className="flex justify-between items-center mb-4 flex-wrap gap-2">
            <h2 className="font-bold">📋 Détail — {periodeLabel}</h2>
            <span className="bg-green-100 text-green-800 px-3 py-1 rounded-full font-bold">
              Total : {totalPeriode.toFixed(2)} DT
            </span>
          </div>

          {joursTries.length === 0 ? (
            <p className="text-center text-slate-500 py-4">
              Aucune vente pour cette période
            </p>
          ) : (
            <div className="space-y-4">
              {joursTries.map(jour => {
                const ventesJour = ventesParJour[jour];
                const totalJour = ventesJour.reduce((s, v) => s + v.total, 0);
                const labelJour = new Date(jour).toLocaleDateString('fr-FR', {
                  weekday: 'long',
                  day: '2-digit',
                  month: 'long',
                  year: 'numeric',
                });
                return (
                  <div key={jour}>
                    <div className="flex justify-between items-center bg-slate-100 px-3 py-2 rounded-t-lg">
                      <h3 className="font-bold text-slate-700">📅 {labelJour}</h3>
                      <span className="text-sm font-bold text-green-700">
                        {totalJour.toFixed(2)} DT
                      </span>
                    </div>
                    <table className="w-full text-sm border border-slate-200">
                      <thead className="bg-slate-50">
                        <tr>
                          <th className="p-2 text-left">Code</th>
                          <th className="p-2 text-left">Produit</th>
                          <th className="p-2 text-center">Qté</th>
                          <th className="p-2 text-center">P.U</th>
                          <th className="p-2 text-right">Total</th>
                          <th className="p-2 text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {ventesJour.map(v => (
                          <tr key={v._id} className="border-b hover:bg-slate-50">
                            <td className="p-2 font-mono text-xs bg-slate-50">
                              {v.produit?.code || '—'}
                            </td>
                            <td className="p-2">{v.produit?.nom || '—'}</td>
                            <td className="p-2 text-center">{v.quantite}</td>
                            <td className="p-2 text-center">{v.prixUnitaire.toFixed(2)}</td>
                            <td className="p-2 text-right font-bold text-green-700">
                              {v.total.toFixed(2)}
                            </td>
                            <td className="p-2 text-right whitespace-nowrap">
                              <button
                                onClick={() => edit(v)}
                                className="bg-blue-100 hover:bg-blue-200 text-blue-700 px-2 py-1 rounded text-xs font-semibold mr-1"
                              >
                                ✏️
                              </button>
                              <button
                                onClick={() => remove(v._id)}
                                className="bg-red-100 hover:bg-red-200 text-red-700 px-2 py-1 rounded text-xs font-semibold"
                              >
                                🗑️
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </>
  );
}

export default Ventes;
export { Ventes };