import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

export default function Login({ setUser }) {
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [pass, setPass] = useState('');
  const navigate = useNavigate();

  const handleLogin = (e) => {
    e.preventDefault();
    axios.post('http://localhost:3000/login', { phone, email, pass })
      .then(res => {
        localStorage.setItem('user', JSON.stringify(res.data.user));
        setUser(res.data.user);
        alert(res.data.message);
        navigate('/profile');
      })
      .catch(err => {
        alert(err.response?.data?.message || 'Login failed');
      });
  };

  return (
    <div style={{ maxWidth: '400px', margin: '40px auto' }} className="card">
      <h2 style={{marginTop: 0}}>Login</h2>
      <form onSubmit={handleLogin}>
        <div className="form-group">
          <label>Email ID</label>
          <input type="email" required value={email} onChange={e => setEmail(e.target.value)} />
        </div>
        <div className="form-group">
          <label>Phone Number</label>
          <input type="tel" required value={phone} onChange={e => setPhone(e.target.value)} />
        </div>
        <div className="form-group">
          <label>Password</label>
          <input type="password" required value={pass} onChange={e => setPass(e.target.value)} />
        </div>
        <button type="submit" className="btn" style={{width: '100%'}}>Log In</button>
      </form>
    </div>
  );
}
