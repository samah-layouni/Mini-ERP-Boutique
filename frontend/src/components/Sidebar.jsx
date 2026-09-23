import { NavLink } from 'react-router-dom';

const links = [
  { to: '/',           label: 'Tableau de bord',   icon: 'fa-gauge' },
    { to: '/admin',      label: 'Admin (Produits & Stock)', icon: 'fa-user-shield' },
  { to: '/ventes',     label: 'Ventes',            icon: 'fa-cash-register' },
  { to: '/achats',     label: 'Achats & Dépenses', icon: 'fa-cart-shopping' },
  { to: '/inventaire', label: 'Inventaire',        icon: 'fa-clipboard-check' },
  { to: '/rapports',   label: 'Rapports',          icon: 'fa-chart-line' },
];

function Sidebar() {
  return (
    <aside className="w-64 bg-slate-900 text-white flex flex-col">
      <div className="p-5 border-b border-slate-700">
        <h1 className="text-xl font-bold">
          <i className="fa-solid fa-store mr-2"></i>Mini ERP
        </h1>
        <p className="text-xs text-slate-400">Gestion Boutique</p>
      </div>

      <nav className="flex-1 p-3 space-y-1 overflow-auto">
        {links.map(l => (
          <NavLink
            key={l.to}
            to={l.to}
            end={l.to === '/'}
            className={({ isActive }) =>
              `block px-4 py-2 rounded text-sm ${isActive ? 'bg-blue-600' : 'hover:bg-slate-700'}`
            }
          >
            <i className={`fa-solid ${l.icon} w-5`}></i> {l.label}
          </NavLink>
        ))}
      </nav>

      <button
        onClick={() => {
          localStorage.removeItem('token');
          window.location.href = '/login';
        }}
        className="m-4 py-2 bg-red-600 hover:bg-red-700 rounded text-sm"
      >
        <i className="fa-solid fa-right-from-bracket"></i> Déconnexion
      </button>
    </aside>
  );
}

export default Sidebar;
export { Sidebar, links };