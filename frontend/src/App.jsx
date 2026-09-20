import { Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login.jsx';
import Dashboard from './pages/Dashboard.jsx';
import Ventes from './pages/Ventes.jsx';
import Achats from './pages/Achats.jsx';
import Factures from './pages/Factures.jsx';
import Produits from './pages/Produits.jsx';
import Depenses from './pages/Depenses.jsx';
import Rapports from './pages/Rapports.jsx';
import Admin from './pages/Admin.jsx';
import Layout from './components/layout.jsx';

function Private({ children }) {
  const token = localStorage.getItem('token');
  return token ? <Layout>{children}</Layout> : <Navigate to="/login" />;
}

function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/" element={<Private><Dashboard /></Private>} />
      <Route path="/ventes" element={<Private><Ventes /></Private>} />
      <Route path="/achats" element={<Private><Achats /></Private>} />
      <Route path="/factures" element={<Private><Factures /></Private>} />
      <Route path="/produits" element={<Private><Produits /></Private>} />
      <Route path="/depenses" element={<Private><Depenses /></Private>} />
      <Route path="/rapports" element={<Private><Rapports /></Private>} />
      <Route path="/admin" element={<Private><Admin /></Private>} />
    </Routes>
  );
}

export default App;
export { App, Private };