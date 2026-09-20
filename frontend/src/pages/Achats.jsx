import { useEffect, useState } from 'react';
import api from '../api/axios';

function Achats() {
  const [factures, setFactures] = useState([]);
  const [achatsDirects, setAchatsDirects] = useState([]);
  const [vue, setVue] = useState('factures'); // 'factures' | 'directs'

  const today = new Date().toISOString().slice(0, 10);

  useEffect(() => {
    api.get(`/factures?from=${today}&to=${today}T23:59:59`).then(r => setFactures(r.data));
    api.get(`/achats-directs?from=${today}&to=${today}T23:59:59`).then(r => setAchatsDirects(r.data));
  }, []);

  const totalFactures = factures.reduce((s, f) => s + f.totalTTC, 0);
  const totalDirects = achatsDirects.reduce((s, a) => s + a.total, 0);
  const totalGlobal = totalFactures + totalDirects;

  return (
    <>
      <h1 className="text-2xl font-bold mb-6">
        🧾 Achats du jour — {new Date().toLocaleDateString('fr-FR')}
      </h1>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-white rounded-xl shadow p-5 border-l-4 border-red-500">
          <p className="text-sm text-slate-500">Achats avec facture</p>
          <p className="text-2xl font-bold text-red-600">{totalFactures.toFixed(2)} DT</p>
          <p className="text-xs text-slate-400">{factures.length} facture(s)</p>
        </div>
        <div className="bg-white rounded-xl shadow p-5 border-l-4 border-orange-500">
          <p className="text-sm text-slate-500">Achats hors facture</p>
          <p className="text-2xl font-bold text-orange-600">{totalDirects.toFixed(2)} DT</p>
          <p className="text-xs text-slate-400">{achatsDirects.length} achat(s)</p>
        </div>
        <div className="bg-white rounded-xl shadow p-5 border-l-4 border-slate-700">
          <p className="text-sm text-slate-500">Total achats du jour</p>
          <p className="text-2xl font-bold">{totalGlobal.toFixed(2)} DT</p>
        </div>
      </div>

      <div className="flex gap-2 mb-4">
        <button
          onClick={() => setVue('factures')}
          className={`px-4 py-2 rounded font-semibold ${
            vue === 'factures' ? 'bg-red-600 text-white' : 'bg-white text-slate-700'
          }`}
        >
          📄 Factures ({factures.length})
        </button>
        <button
          onClick={() => setVue('directs')}
          className={`px-4 py-2 rounded font-semibold ${
            vue === 'directs' ? 'bg-orange-600 text-white' : 'bg-white text-slate-700'
          }`}
        >
          🛍️ Hors facture ({achatsDirects.length})
        </button>
      </div>

      {vue === 'factures' && (
        <div className="bg-white rounded-xl shadow overflow-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-100">
              <tr>
                <th className="p-2 text-left">N° Facture</th>
                <th className="p-2 text-left">Fournisseur</th>
                <th className="p-2 text-left">Date</th>
                <th className="p-2 text-right">TTC</th>
              </tr>
            </thead>
            <tbody>
              {factures.map(f => (
                <tr key={f._id} className="border-b hover:bg-slate-50">
                  <td className="p-2 font-mono">{f.numFacture}</td>
                  <td className="p-2">{f.fournisseur || '—'}</td>
                  <td className="p-2">{new Date(f.dateFacture).toLocaleDateString('fr-FR')}</td>
                  <td className="p-2 text-right font-bold text-red-600">
                    {f.totalTTC.toFixed(2)} DT
                  </td>
                </tr>
              ))}
              {factures.length === 0 && (
                <tr>
                  <td colSpan="4" className="p-4 text-center text-slate-500">
                    Aucune facture aujourd'hui
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {vue === 'directs' && (
        <div className="bg-white rounded-xl shadow overflow-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-100">
              <tr>
                <th className="p-2 text-left">Code</th>
                <th className="p-2 text-left">Produit</th>
                <th className="p-2">Qté</th>
                <th className="p-2">P.U</th>
                <th className="p-2 text-right">Total</th>
              </tr>
            </thead>
            <tbody>
              {achatsDirects.map(a => (
                <tr key={a._id} className="border-b hover:bg-slate-50">
                  <td className="p-2 font-mono text-xs bg-slate-50">
                    {a.produit?.code || '—'}
                  </td>
                  <td className="p-2">{a.produit?.nom || '—'}</td>
                  <td className="p-2 text-center">{a.quantite}</td>
                  <td className="p-2 text-center">{a.prixUnitaire.toFixed(2)}</td>
                  <td className="p-2 text-right font-bold text-orange-600">
                    {a.total.toFixed(2)} DT
                  </td>
                </tr>
              ))}
              {achatsDirects.length === 0 && (
                <tr>
                  <td colSpan="5" className="p-4 text-center text-slate-500">
                    Aucun achat hors facture aujourd'hui
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}

export default Achats;
export { Achats };