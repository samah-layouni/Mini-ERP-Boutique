import { useEffect, useState } from 'react';
import api from '../api/axios';
import { exportStockPDF } from '../utils/pdf';

function Admin() {
  // ========== PARTIE PRODUITS ==========
  const [produits, setProduits] = useState([]);
  const [stats, setStats] = useState(null);
  const [form, setForm] = useState({
    code: '',
    nom: '',
    categorie: '',
    prixAchat: 0,
    prixVente: 0,
    stock: 0,
  });
  const [editId, setEditId] = useState(null);
  const [err, setErr] = useState('');

  const [search, setSearch] = useState('');
  const [filtre, setFiltre] = useState('all'); // all | low | out

  // ========== PARTIE ADMIN (édition rapide) ==========
  const [msg, setMsg] = useState('');

  // ========== CHARGEMENT ==========
  const load = async () => {
    const [pRes, sRes] = await Promise.all([
      api.get('/produits'),
      api.get('/rapports/stock'),
    ]);
    setProduits(pRes.data);
    setStats(sRes.data.stats);
  };

  useEffect(() => {
    load();
  }, []);

  // ========== FORMULAIRE PRODUIT ==========
  const submit = async e => {
    e.preventDefault();
    setErr('');
    try {
      if (editId) await api.put(`/produits/${editId}`, form);
      else await api.post('/produits', form);
      setForm({ code: '', nom: '', categorie: '', prixAchat: 0, prixVente: 0, stock: 0 });
      setEditId(null);
      load();
    } catch (e) {
      setErr(e.response?.data?.error || 'Erreur');
    }
  };

  const edit = p => {
    setForm({
      code: p.code || '',
      nom: p.nom,
      categorie: p.categorie,
      prixAchat: p.prixAchat,
      prixVente: p.prixVente,
      stock: p.stock,
    });
    setEditId(p._id);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const remove = async id => {
    if (!confirm('Supprimer ce produit ?')) return;
    await api.delete(`/produits/${id}`);
    load();
  };

  // ========== ÉDITION RAPIDE (Admin) ==========
  const updateInline = async (id, field, val) => {
    const p = produits.find(x => x._id === id);
    const payload = { ...p, [field]: +val || val };
    const { data } = await api.put(`/produits/${id}`, payload);
    setProduits(produits.map(x => (x._id === id ? data : x)));
    setMsg(`✅ "${p.nom}" mis à jour`);
    setTimeout(() => setMsg(''), 2000);
    // Recharge les stats
    const sRes = await api.get('/rapports/stock');
    setStats(sRes.data.stats);
  };

  // ========== FILTRAGE ==========
  const filtered = produits.filter(p => {
    const matchSearch =
      p.nom.toLowerCase().includes(search.toLowerCase()) ||
      (p.code || '').toLowerCase().includes(search.toLowerCase());
    const matchFiltre =
      filtre === 'all' ||
      (filtre === 'low' && p.stock > 0 && p.stock <= 5) ||
      (filtre === 'out' && p.stock <= 0);
    return matchSearch && matchFiltre;
  });

  return (
    <>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">🛠 Admin — Produits & Stock</h1>
        {stats && (
          <button
            onClick={() => exportStockPDF(produits, stats)}
            className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded font-semibold"
          >
            📄 Export PDF
          </button>
        )}
      </div>

      {/* ========== STATS STOCK ========== */}
      {stats && (
        <>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
            <div className="bg-white rounded-xl shadow p-4 border-l-4 border-blue-500">
              <p className="text-xs text-slate-500">Produits</p>
              <p className="text-2xl font-bold">{stats.totalProduits}</p>
            </div>
            <div className="bg-white rounded-xl shadow p-4 border-l-4 border-green-500">
              <p className="text-xs text-slate-500">Articles en stock</p>
              <p className="text-2xl font-bold">{stats.totalArticles}</p>
            </div>
            <div className="bg-white rounded-xl shadow p-4 border-l-4 border-orange-500">
              <p className="text-xs text-slate-500">Stock faible (≤5)</p>
              <p className="text-2xl font-bold text-orange-600">{stats.faibles}</p>
            </div>
            <div className="bg-white rounded-xl shadow p-4 border-l-4 border-red-500">
              <p className="text-xs text-slate-500">Ruptures</p>
              <p className="text-2xl font-bold text-red-600">{stats.ruptures}</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="bg-white rounded-xl shadow p-4">
              <p className="text-xs text-slate-500">Valeur totale (prix achat)</p>
              <p className="text-xl font-bold">{stats.totalValeurAchat.toFixed(2)} DT</p>
            </div>
            <div className="bg-white rounded-xl shadow p-4">
              <p className="text-xs text-slate-500">Valeur totale (prix vente)</p>
              <p className="text-xl font-bold text-blue-600">{stats.totalValeurVente.toFixed(2)} DT</p>
            </div>
            <div className="bg-white rounded-xl shadow p-4">
              <p className="text-xs text-slate-500">Marge potentielle</p>
              <p className="text-xl font-bold text-green-600">{stats.margePotentielle.toFixed(2)} DT</p>
            </div>
          </div>
        </>
      )}

      {/* ========== FORMULAIRE + TABLEAU PRODUITS ========== */}
      <div className="grid md:grid-cols-3 gap-6 mb-8">
        <form onSubmit={submit} className="bg-white rounded-xl shadow p-5 space-y-2 h-fit">
          <h2 className="font-bold mb-3">{editId ? '✏️ Modifier' : '➕ Ajouter'}</h2>

          {err && <div className="bg-red-100 text-red-700 p-2 rounded text-sm">{err}</div>}

          <input
            required
            placeholder="Code unique (ex: STY-001)"
            className="w-full border rounded p-2 font-mono uppercase"
            value={form.code}
            onChange={e => setForm({ ...form, code: e.target.value.toUpperCase() })}
          />
          <input
            required
            placeholder="Nom (ex: Stylo Bic)"
            className="w-full border rounded p-2"
            value={form.nom}
            onChange={e => setForm({ ...form, nom: e.target.value })}
          />
          <input
            placeholder="Catégorie"
            className="w-full border rounded p-2"
            value={form.categorie}
            onChange={e => setForm({ ...form, categorie: e.target.value })}
          />
          <input
            type="number"
            step="0.01"
            placeholder="Prix achat"
            className="w-full border rounded p-2"
            value={form.prixAchat}
            onChange={e => setForm({ ...form, prixAchat: +e.target.value })}
          />
          <input
            type="number"
            step="0.01"
            placeholder="Prix vente"
            className="w-full border rounded p-2"
            value={form.prixVente}
            onChange={e => setForm({ ...form, prixVente: +e.target.value })}
          />
          <input
            type="number"
            placeholder="Stock initial"
            className="w-full border rounded p-2"
            value={form.stock}
            onChange={e => setForm({ ...form, stock: +e.target.value })}
          />

          <button className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 rounded">
            {editId ? 'Mettre à jour' : 'Ajouter'}
          </button>

          {editId && (
            <button
              type="button"
              onClick={() => {
                setEditId(null);
                setForm({ code: '', nom: '', categorie: '', prixAchat: 0, prixVente: 0, stock: 0 });
              }}
              className="w-full bg-slate-400 text-white py-2 rounded"
            >
              Annuler
            </button>
          )}
        </form>

        <div className="md:col-span-2 bg-white rounded-xl shadow p-5">
          <div className="flex gap-2 mb-3 flex-wrap">
            <input
              placeholder="🔍 Rechercher code ou nom..."
              className="border rounded p-2 flex-1 min-w-[200px]"
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
            <select
              className="border rounded p-2"
              value={filtre}
              onChange={e => setFiltre(e.target.value)}
            >
              <option value="all">Tous</option>
              <option value="low">Stock faible (≤5)</option>
              <option value="out">Ruptures</option>
            </select>
          </div>

          <div className="overflow-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-100">
                <tr>
                  <th className="p-2 text-left">Code</th>
                  <th className="p-2 text-left">Nom</th>
                  <th className="p-2">Catégorie</th>
                  <th className="p-2">Prix achat</th>
                  <th className="p-2">Prix vente</th>
                  <th className="p-2">Stock</th>
                  <th className="p-2">Valeur stock</th>
                  <th className="p-2">État</th>
                  <th className="p-2 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(p => {
                  const etat =
                    p.stock <= 0
                      ? { label: 'RUPTURE', cls: 'bg-red-100 text-red-700' }
                      : p.stock <= 5
                      ? { label: 'FAIBLE', cls: 'bg-orange-100 text-orange-700' }
                      : { label: 'OK', cls: 'bg-green-100 text-green-700' };

                  return (
                    <tr key={p._id} className="border-b hover:bg-slate-50">
                      <td className="p-2 font-mono text-xs bg-slate-50">{p.code}</td>
                      <td className="p-2 font-medium">{p.nom}</td>
                      <td className="p-2 text-center">{p.categorie}</td>
                      <td className="p-2 text-center">{p.prixAchat.toFixed(2)}</td>
                      <td className="p-2 text-center">{p.prixVente.toFixed(2)}</td>
                      <td className="p-2 text-center font-bold">{p.stock}</td>
                      <td className="p-2 text-center">{(p.stock * p.prixAchat).toFixed(2)} DT</td>
                      <td className="p-2 text-center">
                        <span className={`px-2 py-1 rounded text-xs font-bold ${etat.cls}`}>
                          {etat.label}
                        </span>
                      </td>
                      <td className="p-2 text-right whitespace-nowrap">
                        <button
                          onClick={() => edit(p)}
                          className="bg-blue-100 hover:bg-blue-200 text-blue-700 px-3 py-1 rounded text-xs font-semibold mr-1"
                        >
                          ✏️ Modifier
                        </button>
                        <button
                          onClick={() => remove(p._id)}
                          className="bg-red-100 hover:bg-red-200 text-red-700 px-3 py-1 rounded text-xs font-semibold"
                        >
                          🗑️ Supprimer
                        </button>
                      </td>
                    </tr>
                  );
                })}
                {filtered.length === 0 && (
                  <tr>
                    <td colSpan="9" className="p-4 text-center text-slate-500">
                      Aucun produit
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* ========== SECTION ÉDITION RAPIDE (ADMIN) ========== */}
      <div className="mt-10">
        <h2 className="text-xl font-bold mb-3">⚡ Édition rapide (Admin)</h2>
        <p className="text-sm text-slate-500 mb-3">
          Modifie directement les valeurs et clique en dehors du champ pour sauvegarder.
        </p>

        {msg && <div className="bg-green-100 text-green-800 p-3 rounded mb-4">{msg}</div>}

        <div className="bg-white rounded-xl shadow overflow-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-100">
              <tr>
                <th className="p-2 text-left">Code</th>
                <th className="p-2 text-left">Nom</th>
                <th className="p-2">Prix achat</th>
                <th className="p-2">Prix vente</th>
                <th className="p-2">Stock</th>
              </tr>
            </thead>
            <tbody>
              {produits.map(p => (
                <tr key={`admin-${p._id}`} className="border-b hover:bg-slate-50">
                  <td className="p-2 font-mono text-xs">{p.code}</td>
                  <td className="p-2 font-medium">{p.nom}</td>
                  <td className="p-2">
                    <input
                      type="number"
                      step="0.01"
                      defaultValue={p.prixAchat}
                      onBlur={e => updateInline(p._id, 'prixAchat', e.target.value)}
                      className="border rounded p-1 w-24"
                    />
                  </td>
                  <td className="p-2">
                    <input
                      type="number"
                      step="0.01"
                      defaultValue={p.prixVente}
                      onBlur={e => updateInline(p._id, 'prixVente', e.target.value)}
                      className="border rounded p-1 w-24"
                    />
                  </td>
                  <td className="p-2">
                    <input
                      type="number"
                      defaultValue={p.stock}
                      onBlur={e => updateInline(p._id, 'stock', e.target.value)}
                      className="border rounded p-1 w-20"
                    />
                  </td>
                </tr>
              ))}
              {produits.length === 0 && (
                <tr>
                  <td colSpan="5" className="p-4 text-center text-slate-500">
                    Aucun produit
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

export default Admin;
export { Admin };