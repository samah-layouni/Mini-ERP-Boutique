import { useEffect, useState } from 'react';
import api from '../api/axios';

function Depenses() {
  const [depenses, setDepenses] = useState([]);
  const [form, setForm] = useState({ libelle: '', montant: 0, categorie: '', note: '' });
  const [editId, setEditId] = useState(null);
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');

  const load = () => {
    let url = '/depenses';
    if (from && to) url += `?from=${from}&to=${to}`;
    api.get(url).then(r => setDepenses(r.data));
  };
  useEffect(load, []);

  const submit = async e => {
    e.preventDefault();
    if (editId) {
      await api.put(`/depenses/${editId}`, form);
      setEditId(null);
    } else {
      await api.post('/depenses', form);
    }
    setForm({ libelle: '', montant: 0, categorie: '', note: '' });
    load();
  };

  const edit = d => {
    setForm({
      libelle: d.libelle,
      montant: d.montant,
      categorie: d.categorie || '',
      note: d.note || '',
    });
    setEditId(d._id);
  };

  const remove = async id => {
    if (!confirm('Supprimer cette dépense ?')) return;
    await api.delete(`/depenses/${id}`);
    load();
  };

  const total = depenses.reduce((s, d) => s + d.montant, 0);

  return (
    <>
      <h1 className="text-2xl font-bold mb-6">💸 Dépenses</h1>

      <div className="grid md:grid-cols-3 gap-6">
        <form onSubmit={submit} className="bg-white rounded-xl shadow p-5 space-y-2">
          <h2 className="font-bold mb-3">
            {editId ? '✏️ Modifier la dépense' : '➕ Nouvelle dépense'}
          </h2>

          <input
            required
            placeholder="Libellé (ex: Électricité)"
            className="w-full border rounded p-2"
            value={form.libelle}
            onChange={e => setForm({ ...form, libelle: e.target.value })}
          />
          <input
            type="number"
            step="0.01"
            placeholder="Montant"
            className="w-full border rounded p-2"
            value={form.montant}
            onChange={e => setForm({ ...form, montant: +e.target.value })}
          />
          <input
            placeholder="Catégorie (ex: Charges)"
            className="w-full border rounded p-2"
            value={form.categorie}
            onChange={e => setForm({ ...form, categorie: e.target.value })}
          />
          <input
            placeholder="Note"
            className="w-full border rounded p-2"
            value={form.note}
            onChange={e => setForm({ ...form, note: e.target.value })}
          />

          <button className="w-full bg-orange-600 hover:bg-orange-700 text-white py-2 rounded">
            {editId ? 'Mettre à jour' : 'Ajouter'}
          </button>

          {editId && (
            <button
              type="button"
              onClick={() => {
                setEditId(null);
                setForm({ libelle: '', montant: 0, categorie: '', note: '' });
              }}
              className="w-full bg-slate-400 text-white py-2 rounded"
            >
              Annuler
            </button>
          )}
        </form>

        <div className="md:col-span-2 bg-white rounded-xl shadow p-5">
          <div className="flex justify-between items-center mb-3">
            <h2 className="font-bold">📋 Historique</h2>
            <span className="bg-orange-100 text-orange-800 px-3 py-1 rounded-full font-bold">
              Total : {total.toFixed(2)} DT
            </span>
          </div>

          <div className="flex gap-2 mb-3 flex-wrap">
            <input
              type="date"
              className="border rounded p-2"
              value={from}
              onChange={e => setFrom(e.target.value)}
            />
            <input
              type="date"
              className="border rounded p-2"
              value={to}
              onChange={e => setTo(e.target.value)}
            />
            <button
              onClick={load}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 rounded"
            >
              Filtrer
            </button>
          </div>

          <table className="w-full text-sm">
            <thead className="bg-slate-100">
              <tr>
                <th className="p-2 text-left">Libellé</th>
                <th className="p-2">Catégorie</th>
                <th className="p-2">Date</th>
                <th className="p-2">Montant</th>
                <th className="p-2 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {depenses.map(d => (
                <tr key={d._id} className="border-b hover:bg-slate-50">
                  <td className="p-2">{d.libelle}</td>
                  <td className="p-2 text-center">{d.categorie}</td>
                  <td className="p-2 text-center">
                    {new Date(d.date).toLocaleDateString('fr-FR')}
                  </td>
                  <td className="p-2 text-right font-bold text-orange-700">
                    {d.montant.toFixed(2)}
                  </td>
                  <td className="p-2 text-right space-x-2">
                    <button
                      onClick={() => edit(d)}
                      className="text-blue-600 hover:text-blue-800"
                      title="Modifier"
                    >
                      <i className="fa fa-pen"></i>
                    </button>
                    <button
                      onClick={() => remove(d._id)}
                      className="text-red-600 hover:text-red-800"
                      title="Supprimer"
                    >
                      <i className="fa fa-trash"></i>
                    </button>
                  </td>
                </tr>
              ))}
              {depenses.length === 0 && (
                <tr>
                  <td colSpan="5" className="p-4 text-center text-slate-500">
                    Aucune dépense
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}

export default Depenses;
export { Depenses };