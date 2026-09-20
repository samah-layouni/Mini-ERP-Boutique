import { useEffect, useState } from 'react';
import api from '../api/axios';

function Dashboard() {
  const [data, setData] = useState(null);
  const [produits, setProduits] = useState([]);

  useEffect(() => {
    api.get('/rapports/dashboard').then(r => setData(r.data));
    api.get('/produits').then(r => setProduits(r.data));
  }, []);

  if (!data) return <p>Chargement...</p>;

  const Card = ({ color, label, value }) => (
    <div className={`bg-white rounded-xl shadow p-5 border-l-4 ${color}`}>
      <p className="text-sm text-slate-500">{label}</p>
      <p className="text-2xl font-bold">{value.toFixed(2)} DT</p>
    </div>
  );

  return (
    <>
      <h1 className="text-2xl font-bold mb-6">
        📊 Tableau de bord — {new Date().toLocaleDateString('fr-FR')}
      </h1>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <Card color="border-green-500" label="Ventes du jour" value={data.totalVentes} />
        <Card color="border-red-500" label="Achats du jour" value={data.totalAchats} />
        <Card color="border-orange-500" label="Dépenses du jour" value={data.totalDepenses} />
        <Card
          color={data.benefice >= 0 ? 'border-blue-500' : 'border-red-500'}
          label="Bénéfice estimé"
          value={data.benefice}
        />
      </div>

      <h2 className="text-lg font-bold mb-3">🛒 Produits ({produits.length})</h2>
      <div className="bg-white rounded-xl shadow overflow-auto">
        <table className="w-full text-sm">
          <thead className="bg-slate-100">
            <tr>
              <th className="p-2 text-left">Nom</th>
              <th className="p-2">Catégorie</th>
              <th className="p-2">Stock</th>
              <th className="p-2">Prix vente</th>
            </tr>
          </thead>
          <tbody>
            {produits.map(p => (
              <tr key={p._id} className="border-b">
                <td className="p-2">{p.nom}</td>
                <td className="p-2 text-center">{p.categorie}</td>
                <td className="p-2 text-center">{p.stock}</td>
                <td className="p-2 text-center">{p.prixVente.toFixed(2)} DT</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}

export default Dashboard;
export { Dashboard };