import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000/api/v1';

export default function Login() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await fetch(`${API_URL}/api/v1/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const result = await response.json();
      setLoading(false);
      
      if (!response.ok) {
        setError(result.message || 'Login failed');
        return;
      }
      
      login(result.data.tokens.accessToken);
      navigate('/dashboard');
    } catch (err) {
      setLoading(false);
      setError('Network error: Is the backend server running?');
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <div className="auth-logo">CreatorOS</div>
        <div className="auth-subtitle">Your ultimate creator dashboard awaits</div>
        
        {error && <div className="error-message">{error}</div>}
        
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Email Address</label>
            <input 
              className="form-input"
              placeholder="name@creator.com"
              value={email} 
              onChange={(e) => setEmail(e.target.value)} 
              type="email" 
              required
            />
          </div>
          
          <div className="form-group">
            <label className="form-label">Password</label>
            <input 
              className="form-input"
              placeholder="Password"
              value={password} 
              onChange={(e) => setPassword(e.target.value)} 
              type="password" 
              required
            />
          </div>
          
          <button className="btn-primary" type="submit" disabled={loading}>
            {loading ? 'Signing In...' : 'Sign In'}
          </button>
        </form>
        
        <p className="auth-footer">
          Don't have an account? <Link to="/register">Register</Link>
        </p>
      </div>
    </div>
  );
}
