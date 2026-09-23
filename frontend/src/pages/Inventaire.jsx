import { useEffect, useState } from 'react';
import api from '../api/axios';
import { exportInventairePDF } from '../utils/pdf';
import NotificationToast, { useNotifications } from '../components/NotificationToast';

const SEUIL_ECART = 5;

function Inventaire() {
  const [inventaires, setInventaires] = useState([]);
  const [current, setCurrent] = useState(null);
  const [search, setSearch] = useState('');
  const [filtre, setFiltre] = useState('all');
  const [err, setErr] = useState('');
  const { notifications, push, remove } = useNotifications();

  const load = async () => {
    const { data } = await api.get('/inventaires');
    setInventaires(data);
    const enCours = data.find(i => i.statut === 'en_cours');
    if (enCours) setCurrent(enCours);
  };

  useEffect(() => {
    load();
  }, []);

  const demarrer = async () => {
    if (!confirm('Démarrer un nouvel inventaire ?')) return;
    try {
      const { data } = await api.post('/inventaires/demarrer', {});
      setCurrent(data);
      load();
      push('success', 'Inventaire démarré', `Référence ${data.reference}`);
    } catch (e) {
      setErr(e.response?.data?.error || 'Erreur');
    }
  };

  const updateLigne = (idx, field, val) => {
    const lignes = [...current.lignes];
    const oldEcart = lignes[idx].ecart || 0;
    lignes[idx][field] = field === 'stockCompte' ? +val : val;
    lignes[idx].ecart = (lignes[idx].stockCompte || 0) - (lignes[idx].stockTheorique || 0);

    const newEcart = lignes[idx].ecart;
    const seuilDepasse = Math.abs(newEcart) >= SEUIL_ECART && Math.abs(oldEcart) < SEUIL_ECART;

    if (seuilDepasse) {
      const sens = newEcart > 0 ? 'excédent' : 'manquant';
      push(
        newEcart < 0 ? 'danger' : 'warning',
        `⚠️ Gros écart détecté`,
        `${lignes[idx].nom} : ${newEcart > 0 ? '+' : ''}${newEcart} (${sens})`,
        8000
      );
    }

    setCurrent({ ...current, lignes });
  };

  const sauvegarder = async () => {
    try {
      const { data } = await api.put(`/inventaires/${current._id}`, {
        lignes: current.lignes,
        note: current.note,
      });
      setCurrent(data);
      push('success', 'Sauvegardé', 'Le comptage a été enregistré', 2500);
    } catch (e) {
      setErr(e.response?.data?.error || 'Erreur');
    }
  };

  const valider = async () => {
    const grosEcarts = current.lignes.filter(l => Math.abs(l.ecart) >= SEUIL_ECART);

    if (grosEcarts.length > 0) {
      if (!confirm(`⚠️ ${grosEcarts.length} produit(s) avec écart ≥ ${SEUIL_ECART}. Continuer ?`)) return;
    } else {
      if (!confirm('Valider ? Le stock sera corrigé définitivement.')) return;
    }

    try {
      await api.put(`/inventaires/${current._id}`, {
        lignes: current.lignes,
        note: current.note,
      });
      await api.post(`/inventaires/${current._id}/valider`);
      push('success', 'Inventaire validé', 'Les stocks ont été corrigés', 4000);
      setCurrent(null);
      load();
    } catch (e) {
      setErr(e.response?.data?.error || 'Erreur');
    }
  };

  const ouvrir = async id => {
    const { data } = await api.get(`/inventaires/${id}`);
    setCurrent(data);
  };

  const supprimer = async id => {
    if (!confirm('Supprimer cet inventaire ?')) return;
    await api.delete(`/inventaires/${id}`);
    if (current?._id === id) setCurrent(null);
    load();
    push('info', 'Inventaire supprimé', '', 2500);
  };

  const exporterPDF = inv => {
    exportInventairePDF(inv);
    push('success', 'PDF généré', `inventaire_${inv.reference}.pdf`, 2500);
  };

  const stats = current
    ? {
        total: current.lignes.length,
        avecEcart: current.lignes.filter(l => l.ecart !== 0).length,
        manquants: current.lignes.filter(l => l.ecart < 0).length,
        excedents: current.lignes.filter(l => l.ecart > 0).length,
        grosEcarts: current.lignes.filter(l => Math.abs(l.ecart) >= SEUIL_ECART).length,
      }
    : null;

  const filtered = current
    ? current.lignes.filter(l => {
        const matchSearch =
          (l.nom || '').toLowerCase().includes(search.toLowerCase()) ||
          (l.code || '').toLowerCase().includes(search.toLowerCase());
        const matchFiltre =
          filtre === 'all' ||
          (filtre === 'ecart' && l.ecart !== 0) ||
          (filtre === 'ok' && l.ecart === 0) ||
          (filtre === 'gros' && Math.abs(l.ecart) >= SEUIL_ECART);
        return matchSearch && matchFiltre;
      })
    : [];

  return (
    <>
      <NotificationToast notifications={notifications} onClose={remove} />

      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">📦 Inventaire</h1>
        <button
          onClick={demarrer}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded font-semibold"
        >
          ➕ Démarrer un nouvel inventaire
        </button>
      </div>

      {err && <div className="bg-red-100 text-red-800 p-3 rounded mb-4">{err}</div>}

      {current && current.statut === 'en_cours' && (
        <div className="bg-white rounded-xl shadow p-5 mb-6">
          <div className="flex justify-between items-center mb-4 flex-wrap gap-2">
            <div>
              <h2 className="font-bold text-lg">
                📋 Inventaire en cours : <span className="font-mono">{current.reference}</span>
              </h2>
              <p className="text-xs text-slate-500">
                Démarré le {new Date(current.dateDebut).toLocaleString('fr-FR')}
              </p>
            </div>
            <div className="flex gap-2 flex-wrap">
              <button
                onClick={() => exporterPDF(current)}
                className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded text-sm font-semibold"
              >
                📄 Export PDF
              </button>
              <button
                onClick={sauvegarder}
                className="bg-slate-500 hover:bg-slate-600 text-white px-4 py-2 rounded text-sm font-semibold"
              >
                💾 Sauvegarder
              </button>
              <button
                onClick={valider}
                className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded text-sm font-semibold"
              >
                ✅ Valider et corriger
              </button>
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-4">
            <div className="bg-slate-50 rounded p-3 border-l-4 border-blue-500">
              <p className="text-xs text-slate-500">Produits</p>
              <p className="text-xl font-bold">{stats.total}</p>
            </div>
            <div className="bg-slate-50 rounded p-3 border-l-4 border-orange-500">
              <p className="text-xs text-slate-500">Avec écart</p>
              <p className="text-xl font-bold text-orange-600">{stats.avecEcart}</p>
            </div>
            <div className="bg-slate-50 rounded p-3 border-l-4 border-red-500">
              <p className="text-xs text-slate-500">Manquants</p>
              <p className="text-xl font-bold text-red-600">{stats.manquants}</p>
            </div>
            <div className="bg-slate-50 rounded p-3 border-l-4 border-green-500">
              <p className="text-xs text-slate-500">Excédents</p>
              <p className="text-xl font-bold text-green-600">{stats.excedents}</p>
            </div>
            <div className="bg-red-50 rounded p-3 border-l-4 border-red-700">
              <p className="text-xs text-red-700">🔔 Gros écarts (≥{SEUIL_ECART})</p>
              <p className="text-xl font-bold text-red-700">{stats.grosEcarts}</p>
            </div>
          </div>

          <div className="flex gap-2 mb-3 flex-wrap">
            <input
              placeholder="🔍 Rechercher code ou nom..."
              className="border rounded p-2 flex-1 min-w-[200px]"
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
            <select className="border rounded p-2" value={filtre} onChange={e => setFiltre(e.target.value)}>
              <option value="all">Tous</option>
              <option value="ecart">Avec écart</option>
              <option value="gros">Gros écarts (≥{SEUIL_ECART})</option>
              <option value="ok">Sans écart</option>
            </select>
          </div>

          <div className="overflow-auto max-h-[600px]">
            <table className="w-full text-sm">
              <thead className="bg-slate-100 sticky top-0">
                <tr>
                  <th className="p-2 text-left">Code</th>
                  <th className="p-2 text-left">Produit</th>
                  <th className="p-2 text-center">Théorique</th>
                  <th className="p-2 text-center w-32">Compté</th>
                  <th className="p-2 text-center">Écart</th>
                  <th className="p-2 text-left">Note</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(l => {
                  const idx = current.lignes.findIndex(x => x._id === l._id);
                  const gros = Math.abs(l.ecart) >= SEUIL_ECART;
                  return (
                    <tr
                      key={l._id}
                      className={`border-b ${
                        gros ? 'bg-red-50 border-l-4 border-red-500' : l.ecart !== 0 ? 'bg-yellow-50' : 'hover:bg-slate-50'
                      }`}
                    >
                      <td className="p-2 font-mono text-xs">
                        {gros && '🔔 '}
                        {l.code}
                      </td>
                      <td className="p-2 font-medium">{l.nom}</td>
                      <td className="p-2 text-center font-semibold">{l.stockTheorique}</td>
                      <td className="p-2">
                        <input
                          type="number"
                          className="border rounded p-1 w-full text-center font-bold"
                          value={l.stockCompte}
                          onChange={e => updateLigne(idx, 'stockCompte', e.target.value)}
                        />
                      </td>
                      <td className="p-2 text-center">
                        <span
                          className={`px-2 py-1 rounded text-xs font-bold ${
                            l.ecart === 0
                              ? 'bg-green-100 text-green-700'
                              : l.ecart > 0
                              ? 'bg-blue-100 text-blue-700'
                              : 'bg-red-100 text-red-700'
                          }`}
                        >
                          {l.ecart > 0 ? '+' : ''}
                          {l.ecart}
                        </span>
                      </td>
                      <td className="p-2">
                        <input
                          className="border rounded p-1 w-full text-xs"
                          placeholder="Note..."
                          value={l.note || ''}
                          onChange={e => updateLigne(idx, 'note', e.target.value)}
                        />
                      </td>
                    </tr>
                  );
                })}
                {filtered.length === 0 && (
                  <tr><td colSpan="6" className="p-4 text-center text-slate-500">Aucun produit</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <h2 className="text-lg font-bold mb-3">📚 Historique des inventaires</h2>
      <div className="bg-white rounded-xl shadow overflow-auto">
        <table className="w-full text-sm">
          <thead className="bg-slate-100">
            <tr>
              <th className="p-2 text-left">Référence</th>
              <th className="p-2 text-left">Date début</th>
              <th className="p-2 text-left">Date fin</th>
              <th className="p-2 text-center">Produits</th>
              <th className="p-2 text-center">Écarts</th>
              <th className="p-2 text-center">Statut</th>
              <th className="p-2 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {inventaires.map(inv => {
              const ecarts = inv.lignes.filter(l => l.ecart !== 0).length;
              return (
                <tr key={inv._id} className="border-b hover:bg-slate-50">
                  <td className="p-2 font-mono">{inv.reference}</td>
                  <td className="p-2">{new Date(inv.dateDebut).toLocaleDateString('fr-FR')}</td>
                  <td className="p-2">{inv.dateFin ? new Date(inv.dateFin).toLocaleDateString('fr-FR') : '—'}</td>
                  <td className="p-2 text-center">{inv.lignes.length}</td>
                  <td className="p-2 text-center">
                    {ecarts > 0 ? (
                      <span className="bg-orange-100 text-orange-700 px-2 py-1 rounded text-xs font-bold">{ecarts}</span>
                    ) : (
                      <span className="text-green-600 text-xs font-bold">0</span>
                    )}
                  </td>
                  <td className="p-2 text-center">
                    <span
                      className={`px-2 py-1 rounded text-xs font-bold ${
                        inv.statut === 'valide' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'
                      }`}
                    >
                      {inv.statut === 'valide' ? '✅ Validé' : '⏳ En cours'}
                    </span>
                  </td>
                  <td className="p-2 text-right whitespace-nowrap">
                    <button
                      onClick={() => ouvrir(inv._id)}
                      className="bg-slate-100 hover:bg-slate-200 text-slate-700 px-3 py-1 rounded text-xs font-semibold mr-1"
                    >
                      👁️ Voir
                    </button>
                    <button
                      onClick={() => exporterPDF(inv)}
                      className="bg-purple-100 hover:bg-purple-200 text-purple-700 px-3 py-1 rounded text-xs font-semibold mr-1"
                    >
                      📄 PDF
                    </button>
                    <button
                      onClick={() => supprimer(inv._id)}
                      className="bg-red-100 hover:bg-red-200 text-red-700 px-3 py-1 rounded text-xs font-semibold"
                    >
                      🗑️ Supprimer
                    </button>
                  </td>
                </tr>
              );
            })}
            {inventaires.length === 0 && (
              <tr><td colSpan="7" className="p-4 text-center text-slate-500">Aucun inventaire</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </>
  );
}

export default Inventaire;
export { Inventaire };