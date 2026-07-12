import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000/api/v1';

export default function Register() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('CREATOR');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await fetch(`${API_URL}/api/v1/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password, role }),
      });
      const result = await response.json();
      setLoading(false);

      if (!response.ok) {
        setError(result.message || 'Registration failed');
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
        <div className="auth-subtitle">Establish your production workspace</div>

        {error && <div className="error-message">{error}</div>}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Full Name</label>
            <input 
              className="form-input"
              placeholder="Alex Creator"
              value={name} 
              onChange={(e) => setName(e.target.value)} 
              type="text" 
              required
            />
          </div>

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
              placeholder="Min. 8 characters"
              value={password} 
              onChange={(e) => setPassword(e.target.value)} 
              type="password" 
              required
              minLength={8}
            />
          </div>

          <div className="form-group">
            <label className="form-label">Primary Role</label>
            <select 
              className="form-input"
              value={role} 
              onChange={(e) => setRole(e.target.value)}
              style={{ backgroundColor: 'white' }}
            >
              <option value="CREATOR">Content Creator / Brand Owner</option>
              <option value="MANAGER">Manager / Representative</option>
              <option value="VIDEO_EDITOR">Video Editor</option>
              <option value="THUMBNAIL_DESIGNER">Thumbnail Designer</option>
              <option value="SCRIPT_WRITER">Script Writer</option>
              <option value="FINANCE_MANAGER">Finance Manager</option>
            </select>
          </div>

          <button className="btn-primary" type="submit" disabled={loading}>
            {loading ? 'Creating Account...' : 'Create Account'}
          </button>
        </form>

        <p className="auth-footer">
          Already have an account? <Link to="/login">Sign In</Link>
        </p>
      </div>
    </div>
  );
}
