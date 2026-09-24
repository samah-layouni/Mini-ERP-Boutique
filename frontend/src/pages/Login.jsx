import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/axios';

function Login() {
  const [form, setForm] = useState({ username: '', password: '' });
  const [err, setErr] = useState('');
  const nav = useNavigate();

  const submit = async e => {
    e.preventDefault();
    try {
      const { data } = await api.post('/auth/login', form);
      localStorage.setItem('token', data.token);
      nav('/');
    } catch (e) {
      setErr(e.response?.data?.error || 'Erreur');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-900">
      <form onSubmit={submit} className="bg-white p-8 rounded-xl shadow-lg w-96 space-y-4">
        <h1 className="text-2xl font-bold text-center">🏪 Mini ERP</h1>
        <p className="text-center text-sm text-slate-500">Connectez-vous</p>
        {err && <div className="bg-red-100 text-red-700 p-2 rounded text-sm">{err}</div>}
        <input
          className="w-full border rounded p-2"
          placeholder="Utilisateur"
          value={form.username}
          onChange={e => setForm({ ...form, username: e.target.value })}
        />
        <input
          type="password"
          className="w-full border rounded p-2"
          placeholder="Mot de passe"
          value={form.password}
          onChange={e => setForm({ ...form, password: e.target.value })}
        />
        <button className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 rounded">
          Connexion
        </button>
      </form>
    </div>
  );
}

export default Login;
export { Login };
