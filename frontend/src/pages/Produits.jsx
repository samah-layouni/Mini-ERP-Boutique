import { useEffect, useState } from 'react';
import api from '../api/axios';

function Produits() {
  const [produits, setProduits] = useState([]);
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

  const load = () => api.get('/produits').then(r => setProduits(r.data));
  useEffect(() => {
    load();
  }, []);

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

  return (
    <>
      <h1 className="text-2xl font-bold mb-6">📦 Produits de base</h1>

      <div className="grid md:grid-cols-3 gap-6">
        <form onSubmit={submit} className="bg-white rounded-xl shadow p-5 space-y-2">
          <h2 className="font-bold mb-3">{editId ? '✏️ Modifier' : '➕ Ajouter'}</h2>

          {err && <div className="bg-red-100 text-red-700 p-2 rounded text-sm">{err}</div>}

          <input
            required
            placeholder="Code unique (ex: STY-001)"
            className="w-full border rounded p-2 font-mono"
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

        <div className="md:col-span-2 bg-white rounded-xl shadow overflow-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-100">
              <tr>
                <th className="p-2 text-left">Code</th>
                <th className="p-2 text-left">Nom</th>
                <th className="p-2">Catégorie</th>
                <th className="p-2">Prix achat</th>
                <th className="p-2">Prix vente</th>
                <th className="p-2">Stock</th>
                <th className="p-2 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {produits.map(p => (
                <tr key={p._id} className="border-b hover:bg-slate-50">
                  <td className="p-2 font-mono text-xs bg-slate-50">{p.code}</td>
                  <td className="p-2 font-medium">{p.nom}</td>
                  <td className="p-2 text-center">{p.categorie}</td>
                  <td className="p-2 text-center">{p.prixAchat.toFixed(2)}</td>
                  <td className="p-2 text-center">{p.prixVente.toFixed(2)}</td>
                  <td className="p-2 text-center">
                    <span
                      className={
                        p.stock <= 0
                          ? 'text-red-600 font-bold'
                          : p.stock <= 5
                          ? 'text-orange-600 font-bold'
                          : ''
                      }
                    >
                      {p.stock}
                    </span>
                  </td>
                  <td className="p-2 text-right">
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
              ))}
              {produits.length === 0 && (
                <tr>
                  <td colSpan="7" className="p-4 text-center text-slate-500">
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

export default Produits;
export { Produits };