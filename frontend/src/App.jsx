import { Routes, Route, Link, useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import axios from 'axios';
import Home from './pages/Home';
import Login from './pages/Login';
import Signup from './pages/Signup';
import Profile from './pages/Profile';
import Admin from './pages/Admin';
import About from './pages/About';
import Contact from './pages/Contact';
import Report from './pages/Report';
import AdminLogin from './pages/AdminLogin';

axios.defaults.withCredentials = true; // Enables session support across localhost

function App() {
  const [user, setUser] = useState(null);
  const navigate = useNavigate();

  // On mount, we will try to fetch the profile to see if the user has a session configured.
  // In the real system, you might want a verify/session endpoint. We can mock checking localStorage for now.
  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('user');
    setUser(null);
    navigate('/');
  };

  return (
    <>
      <header className="header">
        <h1>Drainage Block Alert</h1>
        <ul className="nav-links">
          <li><Link to="/">Home</Link></li>
          <li><Link to="/about">About</Link></li>
          <li><Link to="/contact">Contact</Link></li>
          <li><Link to="/report">Report</Link></li>
          {!user ? (
            <>
              <li><Link to="/login">Login</Link></li>
              <li><Link to="/signup">Signup</Link></li>
              <li><Link to="/adminlogin">Admin</Link></li>
            </>
          ) : (
            <>
              <li><Link to="/profile">Profile</Link></li>
              <li><a href="#" onClick={handleLogout}>Logout</a></li>
            </>
          )}
        </ul>
        {user && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
             <img 
               src={`http://localhost:3000${user.profile_picture || '/images/user.png'}`} 
               alt="profile" 
               style={{ width: '40px', height: '40px', borderRadius: '50%', objectFit: 'cover' }} 
             />
          </div>
        )}
      </header>

      <main className="main-content">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/about" element={<About />} />
          <Route path="/contact" element={<Contact />} />
          <Route path="/report" element={<Report />} />
          <Route path="/login" element={<Login setUser={setUser} />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/profile" element={<Profile user={user} setUser={setUser} />} />
          <Route path="/adminlogin" element={<AdminLogin />} />
          <Route path="/admin" element={<Admin />} />
        </Routes>
      </main>
    </>
  );
}

export default App;
