import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate, Link } from 'react-router-dom';
import './AdminSignup.css'; // Reuse admin signup styles
const API = process.env.REACT_APP_API_BASE_URL;

const Login = () => {
  const [credentials, setCredentials] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleChange = (e) => {
    setCredentials({ ...credentials, [e.target.name]: e.target.value });
    if (error) setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await axios.post(`${API}/api/login`, credentials);
      const { user, token } = res.data;

      localStorage.setItem('token', token);
      localStorage.setItem("userName", res.data.userName);

      if (user.role === 'admin' || user.role === 'Admin') {
        navigate('/admin-dashboard');
      } else if (user.role === 'department_manager') {
        alert('Department Manager logged in');
        navigate('/dm-dashboard');
      } else if ((user.role === 'project_manager' || user.role === 'Project Manager') || user.pa_role === 'Project Manager') {
        alert('Project Manager logged in');
        navigate('/pm-dashboard');
      } else if (user.role === 'employee') {
        alert('Employee logged in');
      } else if (user.role === 'financial_analyst') {
        alert('Financial Analyst logged in');
      } else {
        alert('Unknown role');
      }
    } catch (err) {
      setError('Invalid email or password');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="signup-container">
      <form className="signup-form" onSubmit={handleSubmit}>
        <h2>Login</h2>
        <p className="signup-subtitle">Enter your credentials to access your account</p>

        {error && <p className="error">{error}</p>}

        <div className="form-group">
          <input
            type="email"
            name="email"
            placeholder="Email"
            value={credentials.email}
            onChange={handleChange}
            required
            disabled={loading}
          />
        </div>

        <div className="form-group">
          <input
            type="password"
            name="password"
            placeholder="Password"
            value={credentials.password}
            onChange={handleChange}
            required
            disabled={loading}
          />
        </div>

        <button type="submit" disabled={loading}>
          {loading ? 'Logging in...' : 'Login'}
        </button>

        <div className="form-footer">
          <p>
            Don't have an account? <Link to="/admin-signup" className="login-link">Sign up here</Link>
          </p>
        </div>
      </form>
    </div>
  );
};

export default Login;
