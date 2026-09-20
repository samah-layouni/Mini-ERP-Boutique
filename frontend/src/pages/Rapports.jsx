import { useState } from 'react';
import api from '../api/axios';

function Rapports() {
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState('');

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

  return (
    <>
      <h1 className="text-2xl font-bold mb-6">📈 Rapport par période</h1>

      <div className="bg-white rounded-xl shadow p-5 flex gap-3 items-end mb-6 flex-wrap">
        <div>
          <label className="text-xs">Du</label>
          <input
            type="date"
            className="border rounded p-2 block"
            value={from}
            onChange={e => setFrom(e.target.value)}
          />
        </div>
        <div>
          <label className="text-xs">Au</label>
          <input
            type="date"
            className="border rounded p-2 block"
            value={to}
            onChange={e => setTo(e.target.value)}
          />
        </div>
        <button
          onClick={load}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded"
        >
          {loading ? 'Chargement...' : 'Analyser'}
        </button>
      </div>

      {err && <div className="bg-red-100 text-red-700 p-3 rounded mb-4">{err}</div>}

      {data && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white rounded-xl shadow p-5 border-l-4 border-green-500">
            <p className="text-sm text-slate-500">Total Ventes</p>
            <p className="text-2xl font-bold text-green-600">
              {data.totalVentes.toFixed(2)} DT
            </p>
            <p className="text-xs text-slate-400">{data.nbVentes} opérations</p>
          </div>

          <div className="bg-white rounded-xl shadow p-5 border-l-4 border-red-500">
            <p className="text-sm text-slate-500">Total Achats</p>
            <p className="text-2xl font-bold text-red-600">
              {data.totalAchats.toFixed(2)} DT
            </p>
            <p className="text-xs text-slate-400">{data.nbFactures} factures</p>
          </div>

          <div className="bg-white rounded-xl shadow p-5 border-l-4 border-orange-500">
            <p className="text-sm text-slate-500">Total Dépenses</p>
            <p className="text-2xl font-bold text-orange-600">
              {data.totalDepenses.toFixed(2)} DT
            </p>
            <p className="text-xs text-slate-400">{data.nbDepenses} dépenses</p>
          </div>

          <div
            className={`bg-white rounded-xl shadow p-5 border-l-4 ${
              data.benefice >= 0 ? 'border-blue-500' : 'border-red-500'
            }`}
          >
            <p className="text-sm text-slate-500">Bénéfice</p>
            <p
              className={`text-2xl font-bold ${
                data.benefice >= 0 ? 'text-blue-600' : 'text-red-600'
              }`}
            >
              {data.benefice.toFixed(2)} DT
            </p>
            <p className="text-xs text-slate-400">
              Du {new Date(data.from).toLocaleDateString('fr-FR')} au{' '}
              {new Date(data.to).toLocaleDateString('fr-FR')}
            </p>
          </div>
        </div>
      )}
    </>
  );
}

export default Rapports;
export { Rapports };