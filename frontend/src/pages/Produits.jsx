import { useEffect, useState } from 'react';
import api from '../api/axios';

function Produits() {
  const [produits, setProduits] = useState([]);
  const [form, setForm] = useState({
    nom: '',
    categorie: '',
    prixAchat: 0,
    prixVente: 0,
    stock: 0,
  });
  const [editId, setEditId] = useState(null);

  const load = () => api.get('/produits').then(r => setProduits(r.data));

  useEffect(() => {
    load();
  }, []);

  const submit = async e => {
    e.preventDefault();
    if (editId) await api.put(`/produits/${editId}`, form);
    else await api.post('/produits', form);
    setForm({ nom: '', categorie: '', prixAchat: 0, prixVente: 0, stock: 0 });
    setEditId(null);
    load();
  };

  const edit = p => {
    setForm({
      nom: p.nom,
      categorie: p.categorie,
      prixAchat: p.prixAchat,
      prixVente: p.prixVente,
      stock: p.stock,
    });
    setEditId(p._id);
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

          <input
            required
            placeholder="Nom (ex: Stylo)"
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
            placeholder="Stock"
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
                setForm({ nom: '', categorie: '', prixAchat: 0, prixVente: 0, stock: 0 });
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
                <th className="p-2 text-left">Nom</th>
                <th className="p-2">Catégorie</th>
                <th className="p-2">Prix achat</th>
                <th className="p-2">Prix vente</th>
                <th className="p-2">Stock</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {produits.map(p => (
                <tr key={p._id} className="border-b hover:bg-slate-50">
                  <td className="p-2 font-medium">{p.nom}</td>
                  <td className="p-2 text-center">{p.categorie}</td>
                  <td className="p-2 text-center">{p.prixAchat.toFixed(2)}</td>
                  <td className="p-2 text-center">{p.prixVente.toFixed(2)}</td>
                  <td className="p-2 text-center">
                    <span
                      className={
                        p.stock <= 5
                          ? 'text-red-600 font-bold'
                          : p.stock <= 20
                          ? 'text-orange-600 font-bold'
                          : ''
                      }
                    >
                      {p.stock}
                    </span>
                  </td>
                  <td className="p-2 text-right space-x-2">
                    <button
                      onClick={() => edit(p)}
                      className="text-blue-600 hover:text-blue-800"
                    >
                      <i className="fa fa-pen"></i>
                    </button>
                    <button
                      onClick={() => remove(p._id)}
                      className="text-red-600 hover:text-red-800"
                    >
                      <i className="fa fa-trash"></i>
                    </button>
                  </td>
                </tr>
              ))}
              {produits.length === 0 && (
                <tr>
                  <td colSpan="6" className="p-4 text-center text-slate-500">
                    Aucun produit — ajoute ton premier (Stylo, Casque…)
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