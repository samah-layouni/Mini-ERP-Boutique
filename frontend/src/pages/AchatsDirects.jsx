import { useEffect, useState } from 'react';
import api from '../api/axios';

function AchatsDirects() {
  const [produits, setProduits] = useState([]);
  const [achats, setAchats] = useState([]);
  const [form, setForm] = useState({
    code: '',
    nom: '',
    quantite: 1,
    prixAchat: 0,
    prixVente: 0,
    fournisseur: '',
    note: '',
  });
  const [editId, setEditId] = useState(null);
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [info, setInfo] = useState('');
  const [err, setErr] = useState('');

  const load = () => {
    let url = '/achats-directs';
    if (from && to) url += `?from=${from}&to=${to}`;
    api.get(url).then(r => setAchats(r.data));
    api.get('/produits').then(r => setProduits(r.data));
  };

  useEffect(() => {
    load();
  }, []);

  // Détection du produit existant par code
  const onCodeChange = val => {
    const code = val.toUpperCase();
    const existing = produits.find(p => p.code === code);

    if (existing) {
      setInfo(`✅ Produit existant : ${existing.nom} (stock actuel : ${existing.stock})`);
      setForm({
        ...form,
        code,
        nom: existing.nom,
        prixAchat: existing.prixAchat,
        prixVente: existing.prixVente,
      });
    } else {
      setInfo(
        code ? `⚠️ Code "${code}" inconnu — il sera créé automatiquement` : ''
      );
      setForm({ ...form, code });
    }
  };

  const submit = async e => {
    e.preventDefault();
    setErr('');
    if (!form.code) {
      setErr('Le code produit est obligatoire');
      return;
    }

    try {
      // 1) Trouver ou créer le produit
      const { data } = await api.post('/produits/find-or-create', {
        code: form.code,
        nom: form.nom || `Produit ${form.code}`,
        prixAchat: form.prixAchat,
        prixVente: form.prixVente,
      });

      const produitId = data.produit._id;

      // 2) Créer l'achat (ou modifier)
      const payload = {
        produit: produitId,
        quantite: form.quantite,
        prixUnitaire: form.prixAchat,
        fournisseur: form.fournisseur,
        note: form.note,
      };

      if (editId) {
        await api.put(`/achats-directs/${editId}`, payload);
        setEditId(null);
      } else {
        await api.post('/achats-directs', payload);
      }

      setForm({
        code: '',
        nom: '',
        quantite: 1,
        prixAchat: 0,
        prixVente: 0,
        fournisseur: '',
        note: '',
      });
      setInfo('');
      load();
    } catch (e) {
      setErr(e.response?.data?.error || 'Erreur');
    }
  };

  const edit = a => {
    setForm({
      code: a.produit?.code || '',
      nom: a.produit?.nom || '',
      quantite: a.quantite,
      prixAchat: a.prixUnitaire,
      prixVente: a.produit?.prixVente || 0,
      fournisseur: a.fournisseur || '',
      note: a.note || '',
    });
    setEditId(a._id);
    setInfo('');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const remove = async id => {
    if (!confirm('Supprimer cet achat ? (le stock sera décrémenté)')) return;
    await api.delete(`/achats-directs/${id}`);
    load();
  };

  const total = achats.reduce((s, a) => s + a.total, 0);

  return (
    <>
      <h1 className="text-2xl font-bold mb-6">🛍️ Achats hors facture</h1>
      <p className="text-sm text-slate-500 mb-4">
        Tape le <b>code produit</b>. S'il existe déjà, le stock sera mis à jour.
        Sinon, un nouveau produit sera créé automatiquement.
      </p>

      <div className="grid md:grid-cols-3 gap-6">
        <form onSubmit={submit} className="bg-white rounded-xl shadow p-5 space-y-3">
          <h2 className="font-bold">
            {editId ? "✏️ Modifier l'achat" : '➕ Nouvel achat'}
          </h2>

          {err && <div className="bg-red-100 text-red-700 p-2 rounded text-sm">{err}</div>}

          <div>
            <label className="text-xs text-slate-500 block mb-1">
              Code produit * <span className="text-slate-400">(ex: STY-001)</span>
            </label>
            <input
              required
              className="w-full border rounded p-2 font-mono uppercase"
              placeholder="STY-001"
              value={form.code}
              onChange={e => onCodeChange(e.target.value)}
              list="codes-list"
            />
            <datalist id="codes-list">
              {produits.map(p => (
                <option key={p._id} value={p.code}>
                  {p.nom} (stock: {p.stock})
                </option>
              ))}
            </datalist>
          </div>

          {info && (
            <div
              className={`p-2 rounded text-xs ${
                info.startsWith('✅')
                  ? 'bg-green-50 text-green-700 border border-green-200'
                  : 'bg-yellow-50 text-yellow-700 border border-yellow-200'
              }`}
            >
              {info}
            </div>
          )}

          <div>
            <label className="text-xs text-slate-500 block mb-1">
              Nom du produit
            </label>
            <input
              className="w-full border rounded p-2"
              placeholder="Ex: Stylo Bic bleu"
              value={form.nom}
              onChange={e => setForm({ ...form, nom: e.target.value })}
            />
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-xs text-slate-500 block mb-1">Prix achat (DT)</label>
              <input
                type="number"
                step="0.01"
                className="w-full border rounded p-2"
                value={form.prixAchat}
                onChange={e => setForm({ ...form, prixAchat: +e.target.value })}
              />
            </div>
            <div>
              <label className="text-xs text-slate-500 block mb-1">Prix vente (DT)</label>
              <input
                type="number"
                step="0.01"
                className="w-full border rounded p-2"
                value={form.prixVente}
                onChange={e => setForm({ ...form, prixVente: +e.target.value })}
              />
            </div>
          </div>

          {form.prixAchat > 0 && form.prixVente > 0 && (
            <div className="text-xs text-slate-500 bg-slate-50 p-2 rounded">
              Marge unitaire : <b className="text-green-600">{(form.prixVente - form.prixAchat).toFixed(2)} DT</b>
              {' '}({(((form.prixVente - form.prixAchat) / form.prixAchat) * 100).toFixed(1)}%)
            </div>
          )}

          <div>
            <label className="text-xs text-slate-500 block mb-1">Quantité</label>
            <input
              type="number"
              min="1"
              className="w-full border rounded p-2"
              value={form.quantite}
              onChange={e => setForm({ ...form, quantite: +e.target.value })}
            />
          </div>

          <div>
            <label className="text-xs text-slate-500 block mb-1">Fournisseur (optionnel)</label>
            <input
              className="w-full border rounded p-2"
              placeholder="Ex: Épicier du coin"
              value={form.fournisseur}
              onChange={e => setForm({ ...form, fournisseur: e.target.value })}
            />
          </div>

          <div>
            <label className="text-xs text-slate-500 block mb-1">Note</label>
            <input
              className="w-full border rounded p-2"
              placeholder="Ex: achat urgent"
              value={form.note}
              onChange={e => setForm({ ...form, note: e.target.value })}
            />
          </div>

          <div className="bg-orange-50 p-3 rounded text-sm border border-orange-200">
            <span className="text-slate-600">Total achat :</span>{' '}
            <b className="text-orange-700 text-base">
              {(form.quantite * form.prixAchat).toFixed(2)} DT
            </b>
          </div>

          <button className="w-full bg-orange-600 hover:bg-orange-700 text-white py-2 rounded font-semibold">
            {editId ? '💾 Mettre à jour' : "💾 Enregistrer l'achat"}
          </button>

          {editId && (
            <button
              type="button"
              onClick={() => {
                setEditId(null);
                setInfo('');
                setForm({
                  code: '',
                  nom: '',
                  quantite: 1,
                  prixAchat: 0,
                  prixVente: 0,
                  fournisseur: '',
                  note: '',
                });
              }}
              className="w-full bg-slate-400 hover:bg-slate-500 text-white py-2 rounded"
            >
              ❌ Annuler
            </button>
          )}
        </form>

        <div className="md:col-span-2 bg-white rounded-xl shadow p-5">
          <div className="flex justify-between items-center mb-3">
            <h2 className="font-bold">📋 Historique achats</h2>
            <span className="bg-orange-100 text-orange-800 px-3 py-1 rounded-full font-bold">
              Total : {total.toFixed(2)} DT
            </span>
          </div>

          <div className="flex gap-2 mb-3 flex-wrap items-end">
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
              🔍 Filtrer
            </button>
            <button
              onClick={() => {
                setFrom('');
                setTo('');
                load();
              }}
              className="bg-slate-400 hover:bg-slate-500 text-white px-4 py-2 rounded"
            >
              🔄 Reset
            </button>
          </div>

          <div className="overflow-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-100">
                <tr>
                  <th className="p-2 text-left">Code</th>
                  <th className="p-2 text-left">Produit</th>
                  <th className="p-2">Qté</th>
                  <th className="p-2">P.U</th>
                  <th className="p-2">Total</th>
                  <th className="p-2">Date</th>
                  <th className="p-2 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {achats.map(a => (
                  <tr key={a._id} className="border-b hover:bg-slate-50">
                    <td className="p-2 font-mono text-xs bg-slate-50">
                      {a.produit?.code || '—'}
                    </td>
                    <td className="p-2 font-medium">{a.produit?.nom || '—'}</td>
                    <td className="p-2 text-center">{a.quantite}</td>
                    <td className="p-2 text-center">{a.prixUnitaire.toFixed(2)}</td>
                    <td className="p-2 text-center font-bold text-orange-700">
                      {a.total.toFixed(2)}
                    </td>
                    <td className="p-2 text-center text-xs">
                      {new Date(a.date).toLocaleDateString('fr-FR')}
                    </td>
                    <td className="p-2 text-right whitespace-nowrap">
                      <button
                        onClick={() => edit(a)}
                        className="bg-blue-100 hover:bg-blue-200 text-blue-700 px-3 py-1 rounded text-xs font-semibold mr-1"
                      >
                        ✏️ Modifier
                      </button>
                      <button
                        onClick={() => remove(a._id)}
                        className="bg-red-100 hover:bg-red-200 text-red-700 px-3 py-1 rounded text-xs font-semibold"
                      >
                        🗑️ Supprimer
                      </button>
                    </td>
                  </tr>
                ))}
                {achats.length === 0 && (
                  <tr>
                    <td colSpan="7" className="p-4 text-center text-slate-500">
                      Aucun achat direct enregistré
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </>
  );
}

export default AchatsDirects;
export { AchatsDirects };