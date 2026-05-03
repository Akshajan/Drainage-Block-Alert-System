import { useState } from 'react';
import axios from 'axios';
import { useNavigate, Link } from 'react-router-dom';

export default function AdminLogin() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const navigate = useNavigate();

  const handleSubmit = (e) => {
    e.preventDefault();
    axios.post('http://localhost:3000/administrator', { email, password })
      .then(res => {
        if (res.data.message === 'Admin sign-in successful') {
           navigate(res.data.redirect || '/admin');
        } else {
           alert(res.data.message);
        }
      })
      .catch(err => {
        console.error(err);
        alert('An error occurred. Please try again.');
      });
  };

  return (
    <div style={{maxWidth: '400px', margin: '0 auto'}}>
      <h2 style={{marginTop: 0}}>Administrator Sign In</h2>
      <div className="card">
        <form onSubmit={handleSubmit} style={{display: 'flex', flexDirection: 'column', gap: '15px'}}>
          <div style={{display: 'flex', flexDirection: 'column'}}>
            <label htmlFor="email">Email ID</label>
            <input type="email" id="email" value={email} onChange={e => setEmail(e.target.value)} required />
          </div>
          <div style={{display: 'flex', flexDirection: 'column'}}>
            <label htmlFor="Password">Password</label>
            <input type="password" id="Password" value={password} onChange={e => setPassword(e.target.value)} required />
          </div>
          <button type="submit">Submit</button>
        </form>
        <div style={{marginTop: '15px', textAlign: 'center'}}>
          <Link to="/login">User Login</Link>
        </div>
      </div>
    </div>
  );
}
