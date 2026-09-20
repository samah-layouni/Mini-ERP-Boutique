import { useEffect, useState } from 'react';
import api from '../api/axios';

function Achats() {
  const [factures, setFactures] = useState([]);
  const today = new Date().toISOString().slice(0, 10);

  useEffect(() => {
    api.get(`/factures?from=${today}&to=${today}T23:59:59`).then(r => setFactures(r.data));
  }, []);

  const total = factures.reduce((s, f) => s + f.totalTTC, 0);

  return (
    <>
      <h1 className="text-2xl font-bold mb-6">
        🧾 Achats du jour — {new Date().toLocaleDateString('fr-FR')}
      </h1>

      <div className="bg-white rounded-xl shadow p-5">
        <div className="flex justify-between items-center mb-4">
          <h2 className="font-bold">Factures du jour ({factures.length})</h2>
          <span className="bg-red-100 text-red-800 px-3 py-1 rounded-full font-bold">
            Total : {total.toFixed(2)} DT
          </span>
        </div>

        <table className="w-full text-sm">
          <thead className="bg-slate-100">
            <tr>
              <th className="p-2 text-left">N°</th>
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
    </>
  );
}

export default Achats;
export { Achats };