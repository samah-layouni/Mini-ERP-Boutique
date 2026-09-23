import { useEffect, useState } from 'react';
import {
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from 'recharts';
import api from '../api/axios';

function Rapports() {
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [data, setData] = useState(null);
  const [evolution, setEvolution] = useState(null);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState('');

  const setCeMois = () => {
    const d = new Date();
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const lastDay = new Date(y, d.getMonth() + 1, 0).getDate();
    setFrom(`${y}-${m}-01`);
    setTo(`${y}-${m}-${String(lastDay).padStart(2, '0')}`);
  };

  const setAnneeCourante = () => {
    const y = new Date().getFullYear();
    setFrom(`${y}-01-01`);
    setTo(`${y}-12-31`);
  };

  useEffect(() => {
    api.get('/rapports/evolution').then(r => setEvolution(r.data));
  }, []);

  const load = async () => {
    if (!from || !to) {
      setErr('Choisis une date de début et de fin');
      return;
    }
    setErr('');
    setLoading(true);
    try {
      const { data } = await api.get(`/rapports/periode?from=${from}&to=${to}`);
      setData(data);
    } catch (e) {
      setErr('Erreur lors du chargement');
    }
    setLoading(false);
  };

  const COLORS = ['#10b981', '#ef4444', '#f59e0b', '#6b7280', '#3b82f6'];

  return (
    <>
      <h1 className="text-2xl font-bold mb-6">📈 Rapports & Analyses</h1>

      {/* FILTRE */}
      <div className="bg-white rounded-xl shadow p-5 mb-6">
        <div className="flex gap-3 items-end mb-3 flex-wrap">
          <div>
            <label className="text-xs text-slate-500">Du</label>
            <input type="date" className="border rounded p-2 block" value={from} onChange={e => setFrom(e.target.value)} />
          </div>
          <div>
            <label className="text-xs text-slate-500">Au</label>
            <input type="date" className="border rounded p-2 block" value={to} onChange={e => setTo(e.target.value)} />
          </div>
          <button onClick={load} className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded font-semibold">
            {loading ? 'Chargement...' : '🔍 Analyser'}
          </button>
        </div>
        <div className="flex gap-2 flex-wrap">
          <span className="text-xs text-slate-500 self-center">Raccourcis :</span>
          <button onClick={setCeMois} className="bg-slate-100 hover:bg-slate-200 text-slate-700 px-3 py-1 rounded text-xs font-semibold">📅 Ce mois</button>
          <button onClick={setAnneeCourante} className="bg-slate-100 hover:bg-slate-200 text-slate-700 px-3 py-1 rounded text-xs font-semibold">📅 Année en cours</button>
        </div>
      </div>

      {err && <div className="bg-red-100 text-red-700 p-3 rounded mb-4">{err}</div>}

      {data && (
        <>
          {/* 5 CARTES */}
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-8">
            <div className="bg-white rounded-xl shadow p-5 border-l-4 border-green-500">
              <p className="text-sm text-slate-500">💰 Ventes</p>
              <p className="text-2xl font-bold text-green-600">{data.totalVentes.toFixed(2)} DT</p>
              <p className="text-xs text-slate-400">{data.nbVentes} vente(s)</p>
            </div>
            <div className="bg-white rounded-xl shadow p-5 border-l-4 border-red-500">
              <p className="text-sm text-slate-500">📄 Factures</p>
              <p className="text-2xl font-bold text-red-600">{data.totalFactures.toFixed(2)} DT</p>
              <p className="text-xs text-slate-400">{data.nbFactures} facture(s)</p>
            </div>
            <div className="bg-white rounded-xl shadow p-5 border-l-4 border-orange-500">
              <p className="text-sm text-slate-500">🛍️ Hors facture</p>
              <p className="text-2xl font-bold text-orange-600">{data.totalAchatsDirects.toFixed(2)} DT</p>
              <p className="text-xs text-slate-400">{data.nbAchatsDirects} achat(s)</p>
            </div>
            <div className="bg-white rounded-xl shadow p-5 border-l-4 border-slate-500">
              <p className="text-sm text-slate-500">💸 Dépenses</p>
              <p className="text-2xl font-bold text-slate-700">{data.totalDepenses.toFixed(2)} DT</p>
              <p className="text-xs text-slate-400">{data.nbDepenses} dépense(s)</p>
            </div>
            <div className={`bg-white rounded-xl shadow p-5 border-l-4 ${data.benefice >= 0 ? 'border-blue-500' : 'border-red-500'}`}>
              <p className="text-sm text-slate-500">📊 Bénéfice</p>
              <p className={`text-2xl font-bold ${data.benefice >= 0 ? 'text-blue-600' : 'text-red-600'}`}>
                {data.benefice.toFixed(2)} DT
              </p>
            </div>
          </div>

          {/* SYNTHÈSE */}
          <div className="bg-white rounded-xl shadow p-5 mb-8">
            <h3 className="font-bold mb-3">📋 Synthèse de la période</h3>
            <div className="grid md:grid-cols-2 gap-6 text-sm">
              <div className="space-y-2">
                <div className="flex justify-between border-b pb-1">
                  <span className="text-slate-600">Ventes</span>
                  <b className="text-green-700">+ {data.totalVentes.toFixed(2)} DT</b>
                </div>
                <div className="flex justify-between border-b pb-1">
                  <span className="text-slate-600">— Achats factures</span>
                  <b className="text-red-600">- {data.totalFactures.toFixed(2)} DT</b>
                </div>
                <div className="flex justify-between border-b pb-1">
                  <span className="text-slate-600">— Achats hors facture</span>
                  <b className="text-orange-600">- {data.totalAchatsDirects.toFixed(2)} DT</b>
                </div>
                <div className="flex justify-between border-b pb-1">
                  <span className="text-slate-600">— Dépenses</span>
                  <b className="text-slate-700">- {data.totalDepenses.toFixed(2)} DT</b>
                </div>
                <div className="flex justify-between pt-2 border-t-2 border-slate-300">
                  <span className="font-bold text-slate-800">BÉNÉFICE NET</span>
                  <b className={`text-lg ${data.benefice >= 0 ? 'text-blue-600' : 'text-red-600'}`}>
                    {data.benefice.toFixed(2)} DT
                  </b>
                </div>
              </div>
              <div className="bg-slate-50 rounded p-3 space-y-1 text-xs">
                <p><b>Détails factures :</b></p>
                <div className="flex justify-between"><span>Sous-total</span><b>{data.totalSousTotalFactures.toFixed(2)} DT</b></div>
                <div className="flex justify-between text-red-600"><span>Remises</span><b>-{data.totalRemiseFactures.toFixed(2)} DT</b></div>
                <div className="flex justify-between text-blue-600"><span>TVA</span><b>{data.totalTvaFactures.toFixed(2)} DT</b></div>
                <hr className="my-1" />
                <p className="pt-1"><b>Total Achats (Fact. + Hors fact.)</b></p>
                <div className="flex justify-between font-bold"><span>Total achats</span><b>{data.totalAchats.toFixed(2)} DT</b></div>
              </div>
            </div>
          </div>

          {/* GRAPHIQUES */}
          <div className="grid md:grid-cols-2 gap-6 mb-8">
            <div className="bg-white rounded-xl shadow p-5">
              <h3 className="font-bold mb-3">🥧 Répartition</h3>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={[
                      { name: 'Ventes', value: data.totalVentes },
                      { name: 'Achats Factures', value: data.totalFactures },
                      { name: 'Achats Hors facture', value: data.totalAchatsDirects },
                      { name: 'Dépenses', value: data.totalDepenses },
                    ].filter(d => d.value > 0)}
                    cx="50%"
                    cy="50%"
                    outerRadius={100}
                    fill="#8884d8"
                    dataKey="value"
                    label={({ name, value }) => `${name}: ${value.toFixed(2)}`}
                  >
                    {[0, 1, 2, 3].map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>

            <div className="bg-white rounded-xl shadow p-5">
              <h3 className="font-bold mb-3">📊 Comparaison</h3>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={[
                  { name: 'Ventes', montant: data.totalVentes },
                  { name: 'Factures', montant: data.totalFactures },
                  { name: 'Hors fact.', montant: data.totalAchatsDirects },
                  { name: 'Dépenses', montant: data.totalDepenses },
                ]}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="montant" radius={[4, 4, 0, 0]} fill="#3b82f6" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* VENTES PAR PRODUIT */}
          {data.ventesParProduit && data.ventesParProduit.length > 0 && (
            <>
              <h3 className="text-lg font-bold mb-3">💰 Ventes par produit</h3>
              <div className="bg-white rounded-xl shadow overflow-auto mb-8">
                <table className="w-full text-sm">
                  <thead className="bg-slate-100">
                    <tr>
                      <th className="p-2 text-left">Code</th>
                      <th className="p-2 text-left">Produit</th>
                      <th className="p-2 text-center">Nb ventes</th>
                      <th className="p-2 text-center">Quantité</th>
                      <th className="p-2 text-right">Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.ventesParProduit.map(v => (
                      <tr key={v.code} className="border-b hover:bg-slate-50">
                        <td className="p-2 font-mono text-xs">{v.code}</td>
                        <td className="p-2">{v.nom}</td>
                        <td className="p-2 text-center">{v.nb}</td>
                        <td className="p-2 text-center font-semibold">{v.quantite}</td>
                        <td className="p-2 text-right font-bold text-green-700">{v.total.toFixed(2)} DT</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}

          {/* ACHATS PAR PRODUIT */}
          {data.achatsParProduit && data.achatsParProduit.length > 0 && (
            <>
              <h3 className="text-lg font-bold mb-3">🛍️ Achats par produit</h3>
              <div className="bg-white rounded-xl shadow overflow-auto mb-8">
                <table className="w-full text-sm">
                  <thead className="bg-slate-100">
                    <tr>
                      <th className="p-2 text-left">Code</th>
                      <th className="p-2 text-left">Produit</th>
                      <th className="p-2 text-center">Qté Facture</th>
                      <th className="p-2 text-right">Total Facture</th>
                      <th className="p-2 text-center">Qté Hors fact.</th>
                      <th className="p-2 text-right">Total Hors fact.</th>
                      <th className="p-2 text-right">Total Produit</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.achatsParProduit.map(a => (
                      <tr key={a.code} className="border-b hover:bg-slate-50">
                        <td className="p-2 font-mono text-xs">{a.code}</td>
                        <td className="p-2">{a.nom}</td>
                        <td className="p-2 text-center">{a.qteFacture || '—'}</td>
                        <td className="p-2 text-right text-red-600">{a.totalFacture > 0 ? a.totalFacture.toFixed(2) : '—'}</td>
                        <td className="p-2 text-center">{a.qteHorsFacture || '—'}</td>
                        <td className="p-2 text-right text-orange-600">{a.totalHorsFacture > 0 ? a.totalHorsFacture.toFixed(2) : '—'}</td>
                        <td className="p-2 text-right font-bold text-slate-800">{a.total.toFixed(2)} DT</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}

          {/* DÉPENSES PAR CATÉGORIE */}
          {data.depensesParCategorie && data.depensesParCategorie.length > 0 && (
            <>
              <h3 className="text-lg font-bold mb-3">💸 Dépenses par catégorie</h3>
              <div className="bg-white rounded-xl shadow overflow-auto mb-8">
                <table className="w-full text-sm">
                  <thead className="bg-slate-100">
                    <tr>
                      <th className="p-2 text-left">Catégorie</th>
                      <th className="p-2 text-center">Nb dépenses</th>
                      <th className="p-2 text-right">Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.depensesParCategorie.map(d => (
                      <tr key={d.categorie} className="border-b hover:bg-slate-50">
                        <td className="p-2 font-medium">{d.categorie}</td>
                        <td className="p-2 text-center">{d.nb}</td>
                        <td className="p-2 text-right font-bold text-slate-700">{d.total.toFixed(2)} DT</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </>
      )}

      {/* ÉVOLUTION INVENTAIRES */}
      <h2 className="text-xl font-bold mb-3 mt-8">📊 Évolution des écarts d'inventaire</h2>

      {evolution && evolution.evolution.length > 0 ? (
        <>
          <div className="bg-white rounded-xl shadow p-5 mb-6">
            <h3 className="font-bold mb-3">Écart total par inventaire</h3>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={evolution.evolution}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="reference" tick={{ fontSize: 11 }} />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="totalEcart" stroke="#3b82f6" strokeWidth={2} name="Écart total" />
                <Line type="monotone" dataKey="totalManquant" stroke="#dc2626" strokeWidth={2} name="Manquants" />
                <Line type="monotone" dataKey="totalExcedent" stroke="#16a34a" strokeWidth={2} name="Excédents" />
              </LineChart>
            </ResponsiveContainer>
          </div>

          <div className="grid md:grid-cols-2 gap-6 mb-8">
            <div className="bg-white rounded-xl shadow p-5">
              <h3 className="font-bold mb-3">🔝 Top 10 produits problématiques</h3>
              {evolution.topProblemes.length > 0 ? (
                <ResponsiveContainer width="100%" height={350}>
                  <BarChart data={evolution.topProblemes} layout="vertical" margin={{ left: 80 }}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis type="number" />
                    <YAxis dataKey="code" type="category" tick={{ fontSize: 11 }} width={80} />
                    <Tooltip />
                    <Bar dataKey="totalEcart" fill="#ef4444" name="Écart cumulé" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <p className="text-slate-500 text-sm">Aucun écart enregistré</p>
              )}
            </div>

            <div className="bg-white rounded-xl shadow p-5">
              <h3 className="font-bold mb-3">Nombre de produits avec écart</h3>
              <ResponsiveContainer width="100%" height={350}>
                <BarChart data={evolution.evolution}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="reference" tick={{ fontSize: 11 }} />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="nbAvecEcart" fill="#f59e0b" name="Avec écart" />
                  <Bar dataKey="nbProduits" fill="#cbd5e1" name="Total produits" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </>
      ) : (
        <div className="bg-white rounded-xl shadow p-6 text-center text-slate-500 mb-6">
          Aucun inventaire validé pour afficher l'évolution.
          <br />
          <span className="text-xs">Valide un inventaire dans la page Inventaire pour voir les statistiques.</span>
        </div>
      )}
    </>
  );
}

export default Rapports;
export { Rapports };