import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000/api/v1';

export default function Dashboard() {
  const navigate = useNavigate();
  const { logout, user } = useAuth();
  const [summary, setSummary] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    const token = localStorage.getItem('creatoros_access_token');
    if (!token) {
      logout();
      navigate('/login');
      return;
    }

    const loadDashboard = async () => {
      try {
        const response = await fetch(`${API_URL}/dashboard`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await response.json();

        if (!response.ok) {
          if (response.status === 401 || response.status === 403) {
            logout();
            navigate('/login');
            return;
          }
          setError(data.message || 'Unable to load dashboard');
          return;
        }

        setSummary(data.data);
      } catch {
        setError('Network error');
      }
    };

    loadDashboard();
  }, [logout, navigate]);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="page">
      <div className="card">
        <div className="dashboard-header">
          <div>
            <h1>Dashboard</h1>
            {user && <p className="secondary-text">Signed in as {user.email}</p>}
          </div>
          <button onClick={handleLogout}>Logout</button>
        </div>
        {error && <div className="error">{error}</div>}
        {summary ? (
          <pre>{JSON.stringify(summary, null, 2)}</pre>
        ) : (
          !error && <div>Loading summary...</div>
        )}
      </div>
    </div>
  );
}
