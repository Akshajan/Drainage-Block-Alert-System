import { useState, useEffect } from 'react';
import axios from 'axios';

export default function Admin() {
  const [reports, setReports] = useState([]);
  const [isAdmin, setIsAdmin] = useState(true); // Assuming true for local dev React wrapper. Secure in production.

  useEffect(() => {
    fetchReports();
  }, []);

  const fetchReports = () => {
    axios.get('http://localhost:3000/api/admin/reports')
      .then(res => setReports(res.data.reports))
      .catch(console.error);
  };

  const toggleStatus = (id, currentStatus) => {
    const newStatus = currentStatus === 'resolved' ? 'pending' : 'resolved';
    axios.put(`http://localhost:3000/reports/${id}/status`, { status: newStatus })
      .then(() => fetchReports())
      .catch(err => alert("Failed to change status. Ensure you are logged in to the backend console."));
  };

  if (!isAdmin) return <div className="card">Please login as Admin.</div>;

  return (
    <div>
      <h2 style={{marginTop: 0}}>Admin Dashboard</h2>
      <div className="card">
        <h3>Reported Drainage Blocks</h3>
        <table>
          <thead>
            <tr>
              <th>ID</th>
              <th>Reporter</th>
              <th>Location</th>
              <th>Details</th>
              <th>Status (Click to toggle)</th>
              <th>Reported At</th>
            </tr>
          </thead>
          <tbody>
            {reports.map(r => (
              <tr key={r.id}>
                <td>{r.id}</td>
                <td>{r.name}<br/>{r.email}</td>
                <td>{r.bl || r.block_location}</td>
                <td>{r.block_details}</td>
                <td style={{cursor: 'pointer'}} onClick={() => toggleStatus(r.id, r.status)}>
                  <span className={`badge ${r.status === 'resolved' ? 'green' : 'red'}`}>
                    {r.status.toUpperCase()}
                  </span>
                </td>
                <td>{new Date(r.reported_at).toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
