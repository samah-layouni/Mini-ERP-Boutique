import { useEffect, useState } from 'react';
import api from '../api/axios';

function Stock() {
  const [data, setData] = useState(null);
  const [search, setSearch] = useState('');
  const [filtre, setFiltre] = useState('all');

  useEffect(() => {
    api.get('/rapports/stock').then(r => setData(r.data));
  }, []);

  if (!data) return <p>Chargement...</p>;

  const { produits, stats } = data;

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
      <h1 className="text-2xl font-bold mb-6">📊 État du stock</h1>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
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
          <p className="text-xl font-bold text-green-600">
            {stats.margePotentielle.toFixed(2)} DT
          </p>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow p-4 mb-3 flex gap-3 flex-wrap items-center">
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

      <div className="bg-white rounded-xl shadow overflow-auto">
        <table className="w-full text-sm">
          <thead className="bg-slate-100">
            <tr>
              <th className="p-2 text-left">Code</th>
              <th className="p-2 text-left">Produit</th>
              <th className="p-2">Catégorie</th>
              <th className="p-2">Stock</th>
              <th className="p-2">Prix achat</th>
              <th className="p-2">Prix vente</th>
              <th className="p-2">Valeur stock</th>
              <th className="p-2">État</th>
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
                  <td className="p-2 text-center font-bold">{p.stock}</td>
                  <td className="p-2 text-center">{p.prixAchat.toFixed(2)}</td>
                  <td className="p-2 text-center">{p.prixVente.toFixed(2)}</td>
                  <td className="p-2 text-center">{(p.stock * p.prixAchat).toFixed(2)} DT</td>
                  <td className="p-2 text-center">
                    <span className={`px-2 py-1 rounded text-xs font-bold ${etat.cls}`}>
                      {etat.label}
                    </span>
                  </td>
                </tr>
              );
            })}
            {filtered.length === 0 && (
              <tr>
                <td colSpan="8" className="p-4 text-center text-slate-500">
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

export default Stock;
export { Stock };