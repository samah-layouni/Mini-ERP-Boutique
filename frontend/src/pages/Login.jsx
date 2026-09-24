import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/axios';
import backgroundImage from '../assets/Copilot_20260924_144622.png';

function Login() {
  const [form, setForm] = useState({ username: '', password: '' });
  const [err, setErr] = useState('');
  const [msg, setMsg] = useState('');
  const [vue, setVue] = useState('login'); // 'login' | 'change'
  const nav = useNavigate();

  // Formulaire de changement de mot de passe
  const [formChange, setFormChange] = useState({
    username: '',
    oldPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [errChange, setErrChange] = useState('');
  const [msgChange, setMsgChange] = useState('');

  const submit = async e => {
    e.preventDefault();
    setErr('');
    setMsg('');
    try {
      const { data } = await api.post('/auth/login', form);
      localStorage.setItem('token', data.token);
      nav('/');
    } catch (e) {
      setErr(e.response?.data?.error || 'Erreur');
    }
  };

  const submitChange = async e => {
    e.preventDefault();
    setErrChange('');
    setMsgChange('');

    if (formChange.newPassword !== formChange.confirmPassword) {
      setErrChange('Les deux mots de passe ne correspondent pas');
      return;
    }
    if (formChange.newPassword.length < 4) {
      setErrChange('Le nouveau mot de passe doit avoir au moins 4 caractères');
      return;
    }

    try {
      const { data } = await api.post('/auth/change-password', {
        username: formChange.username,
        oldPassword: formChange.oldPassword,
        newPassword: formChange.newPassword,
      });
      setMsgChange(data.msg || '✅ Mot de passe changé');
      setFormChange({ username: '', oldPassword: '', newPassword: '', confirmPassword: '' });
      setTimeout(() => {
        setVue('login');
        setMsgChange('');
      }, 2000);
    } catch (e) {
      setErrChange(e.response?.data?.error || 'Erreur');
    }
  };

  const inputClass = "w-full border border-slate-300 rounded-lg pl-10 pr-3 py-2.5 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition";

  return (
    <div
      className="min-h-screen flex items-center justify-center relative bg-cover bg-center bg-no-repeat p-4"
      style={{ backgroundImage: `url(${backgroundImage})` }}
    >
      {/* Overlay sombre */}
      <div className="absolute inset-0 bg-gradient-to-br from-slate-900/75 via-slate-900/55 to-blue-900/65"></div>

      {/* ========== FORMULAIRE LOGIN ========== */}
      {vue === 'login' && (
        <form
          onSubmit={submit}
          className="relative z-10 bg-white/95 backdrop-blur-md p-8 rounded-2xl shadow-2xl w-full max-w-md space-y-4 border border-white/30"
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
                className={inputClass}
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
                className={inputClass}
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

          {/* Lien vers changement de mot de passe */}
          <div className="text-center pt-2 border-t border-slate-200">
            <button
              type="button"
              onClick={() => {
                setVue('change');
                setErr('');
                setMsg('');
                setErrChange('');
                setMsgChange('');
              }}
              className="text-sm text-blue-600 hover:text-blue-800 hover:underline font-medium"
            >
              <i className="fa-solid fa-key mr-1"></i> Changer le mot de passe
            </button>
          </div>
        </form>
      )}

      {/* ========== FORMULAIRE CHANGEMENT MOT DE PASSE ========== */}
      {vue === 'change' && (
        <form
          onSubmit={submitChange}
          className="relative z-10 bg-white/95 backdrop-blur-md p-8 rounded-2xl shadow-2xl w-full max-w-md space-y-4 border border-white/30"
        >
          <div className="text-center mb-2">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-orange-500 to-red-600 rounded-2xl shadow-lg mb-3">
              <i className="fa-solid fa-key text-white text-2xl"></i>
            </div>
            <h1 className="text-2xl font-bold text-slate-800">Changer le mot de passe</h1>
            <p className="text-sm text-slate-500">Modifier votre mot de passe</p>
          </div>

          {errChange && (
            <div className="bg-red-100 text-red-700 p-3 rounded-lg text-sm border border-red-200">
              <i className="fa-solid fa-circle-exclamation mr-1"></i> {errChange}
            </div>
          )}
          {msgChange && (
            <div className="bg-green-100 text-green-700 p-3 rounded-lg text-sm border border-green-200">
              <i className="fa-solid fa-circle-check mr-1"></i> {msgChange}
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">
              Utilisateur
            </label>
            <div className="relative">
              <i className="fa-solid fa-user absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"></i>
              <input
                className={inputClass}
                placeholder="admin"
                value={formChange.username}
                onChange={e => setFormChange({ ...formChange, username: e.target.value })}
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">
              Ancien mot de passe
            </label>
            <div className="relative">
              <i className="fa-solid fa-lock absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"></i>
              <input
                type="password"
                className={inputClass}
                placeholder="••••••••"
                value={formChange.oldPassword}
                onChange={e => setFormChange({ ...formChange, oldPassword: e.target.value })}
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">
              Nouveau mot de passe
            </label>
            <div className="relative">
              <i className="fa-solid fa-key absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"></i>
              <input
                type="password"
                className={inputClass}
                placeholder="Minimum 4 caractères"
                value={formChange.newPassword}
                onChange={e => setFormChange({ ...formChange, newPassword: e.target.value })}
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">
              Confirmer le nouveau mot de passe
            </label>
            <div className="relative">
              <i className="fa-solid fa-check absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"></i>
              <input
                type="password"
                className={inputClass}
                placeholder="Retape le mot de passe"
                value={formChange.confirmPassword}
                onChange={e => setFormChange({ ...formChange, confirmPassword: e.target.value })}
                required
              />
            </div>
          </div>

          <button
            type="submit"
            className="w-full bg-gradient-to-r from-orange-500 to-red-600 hover:from-orange-600 hover:to-red-700 text-white py-2.5 rounded-lg font-semibold shadow-lg hover:shadow-xl transition-all duration-200"
          >
            <i className="fa-solid fa-save mr-1"></i> Enregistrer le nouveau mot de passe
          </button>

          <div className="text-center pt-2 border-t border-slate-200">
            <button
              type="button"
              onClick={() => {
                setVue('login');
                setErrChange('');
                setMsgChange('');
              }}
              className="text-sm text-blue-600 hover:text-blue-800 hover:underline font-medium"
            >
              <i className="fa-solid fa-arrow-left mr-1"></i> Retour à la connexion
            </button>
          </div>
        </form>
      )}

      {/* Pied de page */}
      <div className="absolute bottom-4 left-0 right-0 text-center text-xs text-white/70 z-10">
        © {new Date().getFullYear()} Mini ERP — Gestion Boutique
      </div>
    </div>
  );
}

export default Login;
export { Login };