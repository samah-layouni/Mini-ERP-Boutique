import { useEffect, useState } from 'react';
import api from '../api/axios';

function Dashboard() {
  const [data, setData] = useState(null);
  const [journal, setJournal] = useState(null);

  // 🔑 Période par défaut : 01/01/année → 31/12/année (année EN COURS)
  const anneeCourante = new Date().getFullYear();
  const [from, setFrom] = useState(`${anneeCourante}-01-01`);
  const [to, setTo] = useState(`${anneeCourante}-12-31`);

  useEffect(() => {
    api.get(`/rapports/dashboard?from=${from}&to=${to}`).then(r => setData(r.data));
    api.get(`/rapports/journal?from=${from}&to=${to}`).then(r => setJournal(r.data));
  }, [from, to]);

  // Raccourcis de période
  const setAnneeCourante = () => {
    const y = new Date().getFullYear();
    setFrom(`${y}-01-01`);
    setTo(`${y}-12-31`);
  };

  const setAnneePrecedente = () => {
    const y = new Date().getFullYear() - 1;
    setFrom(`${y}-01-01`);
    setTo(`${y}-12-31`);
  };

  const setCeMois = () => {
    const d = new Date();
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const lastDay = new Date(y, d.getMonth() + 1, 0).getDate();
    setFrom(`${y}-${m}-01`);
    setTo(`${y}-${m}-${String(lastDay).padStart(2, '0')}`);
  };

  const setAujourdhui = () => {
    const d = new Date();
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    const today = `${y}-${m}-${day}`;
    setFrom(today);
    setTo(today);
  };

  if (!data) return <p>Chargement...</p>;

  // 🎯 Libellé avec jour + mois + année
  const periodeLabel = `Du ${new Date(from + 'T00:00:00').toLocaleDateString('fr-FR')} au ${new Date(to + 'T00:00:00').toLocaleDateString('fr-FR')}`;

  const Card = ({ color, label, value, sub }) => (
    <div className={`bg-white rounded-xl shadow p-5 border-l-4 ${color}`}>
      <p className="text-sm text-slate-500">{label}</p>
      <p className="text-2xl font-bold">{value.toFixed(2)} DT</p>
      {sub && <p className="text-xs text-slate-400 mt-1">{sub}</p>}
    </div>
  );

  return (
    <>
      <h1 className="text-2xl font-bold mb-4">
        📊 Tableau de bord — {periodeLabel}
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
            onClick={setAnneeCourante}
            className="bg-slate-400 hover:bg-slate-500 text-white px-4 py-2 rounded"
          >
            🔄 Année en cours
          </button>
        </div>

        <div className="flex gap-2 flex-wrap">
          <span className="text-xs text-slate-500 self-center">Raccourcis :</span>
          <button
            onClick={setAujourdhui}
            className="bg-slate-100 hover:bg-slate-200 text-slate-700 px-3 py-1 rounded text-xs font-semibold"
          >
            📅 Aujourd'hui
          </button>
          <button
            onClick={setCeMois}
            className="bg-slate-100 hover:bg-slate-200 text-slate-700 px-3 py-1 rounded text-xs font-semibold"
          >
            📅 Ce mois
          </button>
          <button
            onClick={setAnneeCourante}
            className="bg-blue-100 hover:bg-blue-200 text-blue-700 px-3 py-1 rounded text-xs font-semibold"
          >
            📅 Année {anneeCourante} (défaut)
          </button>
          <button
            onClick={setAnneePrecedente}
            className="bg-slate-100 hover:bg-slate-200 text-slate-700 px-3 py-1 rounded text-xs font-semibold"
          >
            📅 Année {anneeCourante - 1}
          </button>
        </div>
      </div>

      {/* ========== CARTES ========== */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <Card color="border-green-500" label="Ventes" value={data.totalVentes} />
        <Card
          color="border-red-500"
          label="Achats"
          value={data.totalAchats}
          sub={`Factures : ${data.totalFactures.toFixed(2)} DT | Hors fact. : ${data.totalAchatsDirects.toFixed(2)} DT`}
        />
        <Card color="border-orange-500" label="Dépenses" value={data.totalDepenses} />
        <Card
          color={data.benefice >= 0 ? 'border-blue-500' : 'border-red-500'}
          label="Bénéfice estimé"
          value={data.benefice}
        />
      </div>

      {/* ========== VENTES PAR PRODUIT (toujours affiché) ========== */}
      <h2 className="text-xl font-bold mb-3">💰 Ventes par produit — {periodeLabel}</h2>
      <div className="bg-white rounded-xl shadow overflow-auto mb-8">
        <table className="w-full text-sm">
          <thead className="bg-slate-100">
            <tr>
              <th className="p-2 text-left">Code</th>
              <th className="p-2 text-left">Produit</th>
              <th className="p-2 text-center">Nb ventes</th>
              <th className="p-2 text-center">Quantité vendue</th>
              <th className="p-2 text-right">Total Ventes</th>
            </tr>
          </thead>
          <tbody>
            {data.ventesJour && data.ventesJour.map(v => (
              <tr key={v.code} className="border-b hover:bg-slate-50">
                <td className="p-2 font-mono text-xs bg-slate-50">{v.code}</td>
                <td className="p-2 font-medium">{v.nom}</td>
                <td className="p-2 text-center">
                  <span className="bg-green-100 text-green-700 px-2 py-1 rounded text-xs font-bold">
                    {v.nb}
                  </span>
                </td>
                <td className="p-2 text-center font-semibold">{v.quantite}</td>
                <td className="p-2 text-right font-bold text-green-700">
                  {v.total.toFixed(2)} DT
                </td>
              </tr>
            ))}

            {(!data.ventesJour || data.ventesJour.length === 0) && (
              <tr>
                <td colSpan="5" className="p-4 text-center text-slate-500">
                  Aucune vente sur cette période
                </td>
              </tr>
            )}

            {data.ventesJour && data.ventesJour.length > 0 && (
              <tr className="bg-slate-800 text-white font-bold border-t-2 border-slate-900">
                <td className="p-2" colSpan="3">
                  TOTAL VENTES
                </td>
                <td className="p-2 text-center">
                  {data.ventesJour.reduce((s, v) => s + v.quantite, 0)}
                </td>
                <td className="p-2 text-right text-base">
                  {data.totalVentes.toFixed(2)} DT
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* ========== JOURNAL DES ACHATS ========== */}
      <h2 className="text-xl font-bold mb-3">
        📅 Journal des Achats — {periodeLabel}
      </h2>

      <div className="bg-white rounded-xl shadow overflow-auto mb-8">
        <table className="w-full text-sm">
          <thead className="bg-slate-100 sticky top-0">
            <tr>
              <th className="p-2 text-left">📅 Date</th>
              <th className="p-2 text-center">Factures</th>
              <th className="p-2 text-right">Total Factures</th>
              <th className="p-2 text-center">Hors fact.</th>
              <th className="p-2 text-right">Total Hors fact.</th>
              <th className="p-2 text-right">Total Achats</th>
            </tr>
          </thead>
          <tbody>
            {journal?.jours?.map(j => (
              <tr key={j.date} className="border-b hover:bg-slate-50">
                <td className="p-2 font-semibold">
                  {new Date(j.date).toLocaleDateString('fr-FR', {
                    weekday: 'short',
                    day: '2-digit',
                    month: 'short',
                    year: 'numeric',
                  })}
                </td>
                <td className="p-2 text-center">
                  {j.nbFactures > 0 ? (
                    <span className="bg-red-100 text-red-700 px-2 py-1 rounded text-xs font-bold">
                      {j.nbFactures}
                    </span>
                  ) : (
                    <span className="text-slate-300">—</span>
                  )}
                </td>
                <td className="p-2 text-right text-red-600 font-medium">
                  {j.totalFactures > 0 ? j.totalFactures.toFixed(2) : '—'}
                </td>
                <td className="p-2 text-center">
                  {j.nbAchatsDirects > 0 ? (
                    <span className="bg-orange-100 text-orange-700 px-2 py-1 rounded text-xs font-bold">
                      {j.nbAchatsDirects}
                    </span>
                  ) : (
                    <span className="text-slate-300">—</span>
                  )}
                </td>
                <td className="p-2 text-right text-orange-600 font-medium">
                  {j.totalAchatsDirects > 0 ? j.totalAchatsDirects.toFixed(2) : '—'}
                </td>
                <td className="p-2 text-right font-bold text-slate-800">
                  {j.totalAchats.toFixed(2)} DT
                </td>
              </tr>
            ))}

            {(!journal?.jours || journal.jours.length === 0) && (
              <tr>
                <td colSpan="6" className="p-4 text-center text-slate-500">
                  Aucun achat sur cette période
                </td>
              </tr>
            )}

            {journal?.totaux && journal.jours.length > 0 && (
              <tr className="bg-slate-800 text-white font-bold border-t-2 border-slate-900">
                <td className="p-2">TOTAL PÉRIODE</td>
                <td className="p-2 text-center">{journal.totaux.nbFactures}</td>
                <td className="p-2 text-right text-red-300">
                  {journal.totaux.totalFactures.toFixed(2)}
                </td>
                <td className="p-2 text-center">{journal.totaux.nbAchatsDirects}</td>
                <td className="p-2 text-right text-orange-300">
                  {journal.totaux.totalAchatsDirects.toFixed(2)}
                </td>
                <td className="p-2 text-right text-base">
                  {journal.totaux.totalAchats.toFixed(2)} DT
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* ========== DÉPENSES ========== */}
      <h2 className="text-xl font-bold mb-3">💸 Dépenses — {periodeLabel}</h2>
      <div className="bg-white rounded-xl shadow overflow-auto">
        {data.depensesJour && data.depensesJour.length > 0 ? (
          <table className="w-full text-sm">
            <thead className="bg-slate-100">
              <tr>
                <th className="p-2 text-left">Catégorie</th>
                <th className="p-2 text-center">Nb dépenses</th>
                <th className="p-2 text-left">Détails</th>
                <th className="p-2 text-right">Total Catégorie</th>
              </tr>
            </thead>
            <tbody>
              {data.depensesJour.map(d => (
                <tr key={d.categorie} className="border-b hover:bg-slate-50">
                  <td className="p-2 font-semibold">{d.categorie}</td>
                  <td className="p-2 text-center">
                    <span className="bg-slate-200 text-slate-700 px-2 py-1 rounded text-xs font-bold">
                      {d.nb}
                    </span>
                  </td>
                  <td className="p-2 text-xs text-slate-600">
                    {d.details.slice(0, 5).map((det, i) => (
                      <span key={i}>
                        {det.libelle} ({det.montant.toFixed(2)})
                        {i < Math.min(d.details.length, 5) - 1 && ' · '}
                      </span>
                    ))}
                    {d.details.length > 5 && (
                      <span className="text-slate-400"> +{d.details.length - 5} autres</span>
                    )}
                  </td>
                  <td className="p-2 text-right font-bold text-orange-700">
                    {d.total.toFixed(2)} DT
                  </td>
                </tr>
              ))}
              <tr className="bg-slate-800 text-white font-bold border-t-2 border-slate-900">
                <td className="p-2" colSpan="3">
                  TOTAL DÉPENSES
                </td>
                <td className="p-2 text-right text-base">
                  {data.totalDepenses.toFixed(2)} DT
                </td>
              </tr>
            </tbody>
          </table>
        ) : (
          <p className="p-4 text-center text-slate-500">
            Aucune dépense sur cette période
          </p>
        )}
      </div>
    </>
  );
}

export default Dashboard;
export { Dashboard };