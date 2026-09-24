import { useEffect, useState } from 'react';
import {
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from 'recharts';
import api from '../api/axios';
import { exportRapportPDF } from '../utils/pdf';

function Rapports() {
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [data, setData] = useState(null);
  const [evolution, setEvolution] = useState(null);
  const [entreesSorties, setEntreesSorties] = useState(null);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState('');

  // ========== RACCOURCIS PÉRIODE ==========
  const setAujourdhui = () => {
    const t = new Date().toISOString().slice(0, 10);
    setFrom(t);
    setTo(t);
  };

  const setHier = () => {
    const d = new Date();
    d.setDate(d.getDate() - 1);
    const y = d.toISOString().slice(0, 10);
    setFrom(y);
    setTo(y);
  };

  const set7DerniersJours = () => {
    const d = new Date();
    d.setDate(d.getDate() - 7);
    setFrom(d.toISOString().slice(0, 10));
    setTo(new Date().toISOString().slice(0, 10));
  };

  const setCeMois = () => {
    const d = new Date();
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const lastDay = new Date(y, d.getMonth() + 1, 0).getDate();
    setFrom(`${y}-${m}-01`);
    setTo(`${y}-${m}-${String(lastDay).padStart(2, '0')}`);
  };

  const setMoisDernier = () => {
    const d = new Date();
    d.setMonth(d.getMonth() - 1);
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

  const setAnneeDerniere = () => {
    const y = new Date().getFullYear() - 1;
    setFrom(`${y}-01-01`);
    setTo(`${y}-12-31`);
  };

  const setToutAfficher = () => {
    setFrom('');
    setTo('');
  };

  // ========== CHARGEMENT ==========
  useEffect(() => {
    api.get('/rapports/evolution').then(r => setEvolution(r.data));
    api.get('/rapports/entrees-sorties').then(r => setEntreesSorties(r.data));
  }, []);

  const load = async () => {
    if (!from || !to) {
      setErr('Choisis une date de début et de fin');
      return;
    }
    setErr('');
    setLoading(true);
    try {
      const [dRes, eRes] = await Promise.all([
        api.get(`/rapports/periode?from=${from}&to=${to}`),
        api.get(`/rapports/entrees-sorties?from=${from}&to=${to}`),
      ]);
      setData(dRes.data);
      setEntreesSorties(eRes.data);
    } catch (e) {
      setErr('Erreur lors du chargement');
    }
    setLoading(false);
  };

  // ========== EXPORT PDF ==========
  const handleExportPDF = () => {
    if (!data) {
      alert("Clique d'abord sur '🔍 Analyser' pour charger les données");
      return;
    }
    const periodeLabel = `Du ${new Date(from + 'T00:00:00').toLocaleDateString('fr-FR')} au ${new Date(to + 'T00:00:00').toLocaleDateString('fr-FR')}`;
    exportRapportPDF(data, entreesSorties, periodeLabel);
  };

  const COLORS = ['#10b981', '#ef4444', '#f59e0b', '#6b7280', '#3b82f6'];

  return (
    <>
      <h1 className="text-2xl font-bold mb-6">📈 Rapports & Analyses</h1>

      {/* ========== FILTRE PÉRIODE + EXPORT PDF ========== */}
      <div className="bg-white rounded-xl shadow p-5 mb-6">
        <div className="flex justify-between items-center mb-3 flex-wrap gap-2">
          <h2 className="text-lg font-bold">📅 Choisir la période</h2>
          <button
            onClick={handleExportPDF}
            disabled={!data}
            className={`px-4 py-2 rounded font-semibold ${
              data
                ? 'bg-purple-600 hover:bg-purple-700 text-white'
                : 'bg-slate-300 text-slate-500 cursor-not-allowed'
            }`}
          >
            📄 Télécharger le rapport PDF
          </button>
        </div>

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
            {loading ? 'Chargement...' : '🔍 Analyser'}
          </button>
          <button
            onClick={setToutAfficher}
            className="bg-slate-400 hover:bg-slate-500 text-white px-4 py-2 rounded"
          >
            🔄 Tout afficher
          </button>
        </div>

        <div className="flex gap-2 flex-wrap">
          <span className="text-xs text-slate-500 self-center">Raccourcis :</span>
          <button onClick={setAujourdhui} className="bg-slate-100 hover:bg-slate-200 text-slate-700 px-3 py-1 rounded text-xs font-semibold">📅 Aujourd'hui</button>
          <button onClick={setHier} className="bg-slate-100 hover:bg-slate-200 text-slate-700 px-3 py-1 rounded text-xs font-semibold">📅 Hier</button>
          <button onClick={set7DerniersJours} className="bg-slate-100 hover:bg-slate-200 text-slate-700 px-3 py-1 rounded text-xs font-semibold">📅 7 derniers jours</button>
          <button onClick={setCeMois} className="bg-blue-100 hover:bg-blue-200 text-blue-700 px-3 py-1 rounded text-xs font-semibold">📅 Ce mois</button>
          <button onClick={setMoisDernier} className="bg-slate-100 hover:bg-slate-200 text-slate-700 px-3 py-1 rounded text-xs font-semibold">📅 Mois dernier</button>
          <button onClick={setAnneeCourante} className="bg-blue-100 hover:bg-blue-200 text-blue-700 px-3 py-1 rounded text-xs font-semibold">📅 Année en cours</button>
          <button onClick={setAnneeDerniere} className="bg-slate-100 hover:bg-slate-200 text-slate-700 px-3 py-1 rounded text-xs font-semibold">📅 Année {new Date().getFullYear() - 1}</button>
        </div>

        {from && to && (
          <div className="mt-3 p-2 bg-blue-50 border border-blue-200 rounded text-sm text-blue-800">
            📊 Période analysée :{' '}
            <b>
              Du {new Date(from + 'T00:00:00').toLocaleDateString('fr-FR')} au{' '}
              {new Date(to + 'T00:00:00').toLocaleDateString('fr-FR')}
            </b>
          </div>
        )}
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

          {/* ENTRÉES / SORTIES / DÉPENSES */}
          {entreesSorties && (
            <>
              <h2 className="text-xl font-bold mb-3 mt-8">
                📊 Tableau Entrées / Sorties / Dépenses — Du {new Date(entreesSorties.totaux.from + 'T00:00:00').toLocaleDateString('fr-FR')} au {new Date(entreesSorties.totaux.to + 'T00:00:00').toLocaleDateString('fr-FR')}
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-5 gap-3 mb-4">
                <div className="bg-white rounded-xl shadow p-4 border-l-4 border-red-500">
                  <p className="text-xs text-slate-500">📄 Entrées — Factures</p>
                  <p className="text-xl font-bold text-red-600">{entreesSorties.totaux.entreesFactures.toFixed(2)} DT</p>
                  <p className="text-xs text-slate-400">Marchandises</p>
                </div>
                <div className="bg-white rounded-xl shadow p-4 border-l-4 border-orange-500">
                  <p className="text-xs text-slate-500">🛍️ Entrées — Hors facture</p>
                  <p className="text-xl font-bold text-orange-600">{entreesSorties.totaux.entreesHorsFacture.toFixed(2)} DT</p>
                  <p className="text-xs text-slate-400">Marchandises</p>
                </div>
                <div className="bg-white rounded-xl shadow p-4 border-l-4 border-green-500">
                  <p className="text-xs text-slate-500">💰 Sorties — Ventes</p>
                  <p className="text-xl font-bold text-green-600">{entreesSorties.totaux.sortiesVentes.toFixed(2)} DT</p>
                  <p className="text-xs text-slate-400">Marchandises</p>
                </div>
                <div className="bg-white rounded-xl shadow p-4 border-l-4 border-slate-700">
                  <p className="text-xs text-slate-500">💸 Dépenses</p>
                  <p className="text-xl font-bold text-slate-700">{entreesSorties.totaux.depenses.toFixed(2)} DT</p>
                  <p className="text-xs text-slate-400">Loyer, électricité...</p>
                </div>
                <div className={`bg-white rounded-xl shadow p-4 border-l-4 ${entreesSorties.totaux.beneficeNet >= 0 ? 'border-blue-500' : 'border-red-500'}`}>
                  <p className="text-xs text-slate-500">📈 Bénéfice net</p>
                  <p className={`text-xl font-bold ${entreesSorties.totaux.beneficeNet >= 0 ? 'text-blue-600' : 'text-red-600'}`}>{entreesSorties.totaux.beneficeNet.toFixed(2)} DT</p>
                  <p className="text-xs text-slate-400">Ventes − Achats − Dép.</p>
                </div>
              </div>

              <div className="bg-white rounded-xl shadow overflow-auto mb-8">
                <table className="w-full text-sm">
                  <thead className="bg-slate-100 sticky top-0">
                    <tr>
                      <th className="p-2 text-left">📅 Date</th>
                      <th className="p-2 text-right text-red-700">Factures</th>
                      <th className="p-2 text-right text-orange-700">Hors facture</th>
                      <th className="p-2 text-right text-red-700">Total Entrées</th>
                      <th className="p-2 text-right text-green-700">Ventes</th>
                      <th className="p-2 text-right text-slate-700">Dépenses</th>
                      <th className="p-2 text-right">Bénéfice net</th>
                    </tr>
                  </thead>
                  <tbody>
                    {entreesSorties.jours.map(j => (
                      <tr key={j.date} className="border-b hover:bg-slate-50">
                        <td className="p-2 font-semibold">
                          {new Date(j.date).toLocaleDateString('fr-FR', {
                            weekday: 'short', day: '2-digit', month: 'short', year: 'numeric',
                          })}
                        </td>
                        <td className="p-2 text-right text-red-600">{j.entreesFactures > 0 ? j.entreesFactures.toFixed(2) : '—'}</td>
                        <td className="p-2 text-right text-orange-600">{j.entreesHorsFacture > 0 ? j.entreesHorsFacture.toFixed(2) : '—'}</td>
                        <td className="p-2 text-right font-bold text-red-700">{j.entreesTotal.toFixed(2)} DT</td>
                        <td className="p-2 text-right font-bold text-green-700">{j.sortiesVentes > 0 ? j.sortiesVentes.toFixed(2) : '—'}</td>
                        <td className="p-2 text-right text-slate-700">{j.depenses > 0 ? j.depenses.toFixed(2) : '—'}</td>
                        <td className={`p-2 text-right font-bold ${j.beneficeNet >= 0 ? 'text-blue-600' : 'text-red-600'}`}>{j.beneficeNet.toFixed(2)} DT</td>
                      </tr>
                    ))}
                    {entreesSorties.jours.length === 0 && (
                      <tr><td colSpan="7" className="p-4 text-center text-slate-500">Aucune opération sur cette période</td></tr>
                    )}
                    {entreesSorties.jours.length > 0 && (
                      <tr className="bg-slate-800 text-white font-bold border-t-2 border-slate-900">
                        <td className="p-2">TOTAL PÉRIODE</td>
                        <td className="p-2 text-right text-red-300">{entreesSorties.totaux.entreesFactures.toFixed(2)}</td>
                        <td className="p-2 text-right text-orange-300">{entreesSorties.totaux.entreesHorsFacture.toFixed(2)}</td>
                        <td className="p-2 text-right">{entreesSorties.totaux.entreesTotal.toFixed(2)} DT</td>
                        <td className="p-2 text-right text-green-300">{entreesSorties.totaux.sortiesVentes.toFixed(2)}</td>
                        <td className="p-2 text-right text-slate-300">{entreesSorties.totaux.depenses.toFixed(2)}</td>
                        <td className={`p-2 text-right ${entreesSorties.totaux.beneficeNet >= 0 ? 'text-blue-300' : 'text-red-300'}`}>{entreesSorties.totaux.beneficeNet.toFixed(2)} DT</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </>
          )}

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
                    cx="50%" cy="50%" outerRadius={100} fill="#8884d8" dataKey="value"
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

          {/* ✨ DÉPENSES DÉTAILLÉES */}
          {data.depensesDetail && data.depensesDetail.length > 0 && (
            <>
              <h3 className="text-lg font-bold mb-3">💸 Détail des dépenses</h3>
              <div className="bg-white rounded-xl shadow overflow-auto mb-8">
                <table className="w-full text-sm">
                  <thead className="bg-slate-100">
                    <tr>
                      <th className="p-2 text-left">📅 Date</th>
                      <th className="p-2 text-left">Libellé</th>
                      <th className="p-2 text-left">Catégorie</th>
                      <th className="p-2 text-left">Note</th>
                      <th className="p-2 text-right">Montant</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.depensesDetail.map((d, i) => (
                      <tr key={i} className="border-b hover:bg-slate-50">
                        <td className="p-2 text-xs">{new Date(d.date).toLocaleDateString('fr-FR')}</td>
                        <td className="p-2 font-medium">{d.libelle}</td>
                        <td className="p-2 text-center">
                          <span className="bg-slate-100 text-slate-700 px-2 py-1 rounded text-xs">{d.categorie}</span>
                        </td>
                        <td className="p-2 text-xs text-slate-500">{d.note || '—'}</td>
                        <td className="p-2 text-right font-bold text-slate-700">{d.montant.toFixed(2)} DT</td>
                      </tr>
                    ))}
                    <tr className="bg-slate-800 text-white font-bold border-t-2 border-slate-900">
                      <td className="p-2" colSpan="4">
                        TOTAL DÉPENSES ({data.depensesDetail.length} opération{data.depensesDetail.length > 1 ? 's' : ''})
                      </td>
                      <td className="p-2 text-right text-base">{data.totalDepenses.toFixed(2)} DT</td>
                    </tr>
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