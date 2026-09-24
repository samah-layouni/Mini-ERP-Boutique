import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/axios';
import backgroundImage from '../assets/Copilot_20260924_144622.png';

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
    <div
      className="min-h-screen flex items-center justify-center relative bg-cover bg-center bg-no-repeat"
      style={{
        backgroundImage: `url(${backgroundImage})`,
      }}
    >
      {/* Overlay sombre pour la lisibilité */}
      <div className="absolute inset-0 bg-gradient-to-br from-slate-900/75 via-slate-900/55 to-blue-900/65"></div>

      {/* Formulaire */}
      <form
        onSubmit={submit}
        className="relative z-10 bg-white/95 backdrop-blur-md p-8 rounded-2xl shadow-2xl w-96 space-y-4 border border-white/30"
      >
        <div className="text-center mb-2">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-blue-500 to-blue-700 rounded-2xl shadow-lg mb-3">
            <i className="fa-solid fa-store text-white text-2xl"></i>
          </div>
          <h1 className="text-2xl font-bold text-slate-800">Mini ERP</h1>
          <p className="text-sm text-slate-500">Gestion Boutique</p>
        </div>

        {err && (
          <div className="bg-red-100 text-red-700 p-3 rounded-lg text-sm border border-red-200">
            <i className="fa-solid fa-circle-exclamation mr-1"></i> {err}
          </div>
        )}

        <div>
          <label className="block text-xs font-semibold text-slate-600 mb-1">
            Utilisateur
          </label>
          <div className="relative">
            <i className="fa-solid fa-user absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"></i>
            <input
              className="w-full border border-slate-300 rounded-lg pl-10 pr-3 py-2.5 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition"
              placeholder="admin"
              value={form.username}
              onChange={e => setForm({ ...form, username: e.target.value })}
              autoComplete="username"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-600 mb-1">
            Mot de passe
          </label>
          <div className="relative">
            <i className="fa-solid fa-lock absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"></i>
            <input
              type="password"
              className="w-full border border-slate-300 rounded-lg pl-10 pr-3 py-2.5 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition"
              placeholder="••••••••"
              value={form.password}
              onChange={e => setForm({ ...form, password: e.target.value })}
              autoComplete="current-password"
            />
          </div>
        </div>

        <button
          type="submit"
          className="w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white py-2.5 rounded-lg font-semibold shadow-lg hover:shadow-xl transition-all duration-200"
        >
          <i className="fa-solid fa-right-to-bracket mr-1"></i> Se connecter
        </button>

        <p className="text-xs text-center text-slate-400 pt-2">
          Par défaut : <b>admin</b> / <b>admin123</b>
        </p>
      </form>

      {/* Pied de page */}
      <div className="absolute bottom-4 left-0 right-0 text-center text-xs text-white/70 z-10">
        © {new Date().getFullYear()} Mini ERP — Gestion Boutique
      </div>
    </div>
  );
}

export default Login;
export { Login };