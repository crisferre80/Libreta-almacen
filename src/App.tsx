import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { useAuth } from './contexts/AuthContext';
import Auth from './components/Auth';
import ClientesList from './components/ClientesList';
import ClientePortal from './components/ClientePortal';

function App() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-gray-600">Cargando...</div>
      </div>
    );
  }

  return (
    <Router>
      <Routes>
        <Route path="/cliente/:code?" element={<ClientePortal />} />
        <Route path="/" element={
          !user ? <Auth /> : <ClientesList />
        } />
      </Routes>
    </Router>
  );
}

export default App;
