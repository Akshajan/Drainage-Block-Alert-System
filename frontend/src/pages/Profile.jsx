import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

export default function Profile({ user, setUser }) {
  const navigate = useNavigate();
  const [reports, setReports] = useState([]);

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }
    axios.get(`http://localhost:3000/api/profile/${user.email}`)
      .then(res => setReports(res.data.reports))
      .catch(console.error);
  }, [user, navigate]);

  if (!user) return null;

  return (
    <div>
      <div className="card" style={{ display: 'flex', gap: '30px', alignItems: 'center' }}>
        <div>
          <img src={`http://localhost:3000${user.profile_picture || '/images/user.png'}`} style={{width: '120px', height: '120px', borderRadius: '50%', objectFit: 'cover'}} />
        </div>
        <div>
          <h2 style={{margin: '0 0 10px 0'}}>{user.name}</h2>
          <p style={{margin: '0px', color: 'var(--muted)'}}>{user.email}</p>
          <p style={{margin: '4px 0'}}><strong>Phone:</strong> {user.phone}</p>
          <p style={{margin: '4px 0'}}><strong>Address:</strong> {user.address}</p>
          <p style={{margin: '4px 0'}}><strong>State:</strong> {user.state} &nbsp; <strong>Pin:</strong> {user.pincode}</p>
        </div>
      </div>

      <h2>Your Reported Blocks</h2>
      {reports.length === 0 ? <p>No blocks reported yet.</p> : reports.map(r => (
        <div key={r.id} className="card">
          <p><strong>Location:</strong> {r.bl || r.block_location}</p>
          <p><strong>Details:</strong> {r.block_details}</p>
          <p><strong>Status:</strong> <span className={`badge ${r.status === 'resolved' ? 'green' : 'red'}`}>{r.status.toUpperCase()}</span></p>
          <p style={{color: 'var(--muted)'}}>Reported on {new Date(r.reported_at).toLocaleString()}</p>
        </div>
      ))}
    </div>
  );
}
