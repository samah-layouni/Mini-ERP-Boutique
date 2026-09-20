import { useEffect, useState } from 'react';
import api from '../api/axios';

function Admin() {
  const [produits, setProduits] = useState([]);
  const [msg, setMsg] = useState('');

  useEffect(() => {
    api.get('/produits').then(r => setProduits(r.data));
  }, []);

  const update = async (id, field, val) => {
    const p = produits.find(x => x._id === id);
    const payload = { ...p, [field]: +val || val };
    const { data } = await api.put(`/produits/${id}`, payload);
    setProduits(produits.map(x => (x._id === id ? data : x)));
    setMsg(`✅ "${p.nom}" mis à jour`);
    setTimeout(() => setMsg(''), 2000);
  };

  return (
    <>
      <h1 className="text-2xl font-bold mb-6">🛠 Espace Admin</h1>

      {msg && <div className="bg-green-100 text-green-800 p-3 rounded mb-4">{msg}</div>}

      <h2 className="text-lg font-bold mb-3">📦 Correction rapide des produits</h2>
      <p className="text-sm text-slate-500 mb-3">
        Modifie directement les champs puis clique en dehors pour sauvegarder.
      </p>

      <div className="bg-white rounded-xl shadow overflow-auto">
        <table className="w-full text-sm">
          <thead className="bg-slate-100">
            <tr>
              <th className="p-2 text-left">Nom</th>
              <th className="p-2">Catégorie</th>
              <th className="p-2">Prix achat</th>
              <th className="p-2">Prix vente</th>
              <th className="p-2">Stock</th>
            </tr>
          </thead>
          <tbody>
            {produits.map(p => (
              <tr key={p._id} className="border-b">
                <td className="p-2 font-medium">{p.nom}</td>
                <td className="p-2">
                  <input
                    className="border rounded p-1 w-full"
                    defaultValue={p.categorie}
                    onBlur={e => update(p._id, 'categorie', e.target.value)}
                  />
                </td>
                <td className="p-2">
                  <input
                    type="number"
                    step="0.01"
                    defaultValue={p.prixAchat}
                    onBlur={e => update(p._id, 'prixAchat', e.target.value)}
                    className="border rounded p-1 w-24"
                  />
                </td>
                <td className="p-2">
                  <input
                    type="number"
                    step="0.01"
                    defaultValue={p.prixVente}
                    onBlur={e => update(p._id, 'prixVente', e.target.value)}
                    className="border rounded p-1 w-24"
                  />
                </td>
                <td className="p-2">
                  <input
                    type="number"
                    defaultValue={p.stock}
                    onBlur={e => update(p._id, 'stock', e.target.value)}
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
    </>
  );
}

export default Admin;
export { Admin };