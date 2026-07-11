import { Route, Routes, Navigate } from 'react-router-dom';
import Landing from './pages/Landing';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import { useAuth } from './context/AuthContext';

function App() {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div style={{ 
        backgroundColor: 'var(--bg-main)', 
        minHeight: '100vh', 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center',
        fontFamily: 'var(--font-title)',
        fontSize: '1.5rem',
        fontWeight: '800'
      }}>
        Loading Workspace...
      </div>
    );
  }

  return (
    <Routes>
      <Route path="/" element={<Landing />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route
        path="/dashboard"
        element={user ? <Dashboard /> : <Navigate to="/login" replace />}
      />
      <Route path="/*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default App;
