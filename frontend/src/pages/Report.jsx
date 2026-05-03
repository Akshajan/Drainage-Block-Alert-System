import { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

export default function Report() {
  const [formData, setFormData] = useState({ name: '', mobile: '', email: '', bl: '', 'block-details': '' });
  const [photo, setPhoto] = useState(null);
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleFileChange = (e) => {
    setPhoto(e.target.files[0]);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    const data = new FormData();
    data.append('name', formData.name);
    data.append('mobile', formData.mobile);
    data.append('email', formData.email);
    data.append('bl', formData.bl);
    data.append('block-details', formData['block-details']);
    if (photo) {
      data.append('photo', photo);
    }

    try {
      await axios.post('http://localhost:3000/report', data, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      alert('Report submitted successfully');
      navigate('/');
    } catch (err) {
      console.error(err);
      alert('Failed to submit report');
    }
  };

  return (
    <div>
      <h2 style={{marginTop: 0}}>Drainage Block Reporting Form</h2>
      <div className="card">
        <form onSubmit={handleSubmit} style={{display: 'flex', flexDirection: 'column', gap: '15px'}}>
          <div style={{display: 'flex', flexDirection: 'column'}}>
            <label htmlFor="name">Name</label>
            <input type="text" id="name" name="name" value={formData.name} onChange={handleChange} required />
          </div>
          <div style={{display: 'flex', flexDirection: 'column'}}>
            <label htmlFor="mobile">Mobile Number</label>
            <input type="text" id="mobile" name="mobile" value={formData.mobile} onChange={handleChange} required />
          </div>
          <div style={{display: 'flex', flexDirection: 'column'}}>
            <label htmlFor="email">Email</label>
            <input type="email" id="email" name="email" value={formData.email} onChange={handleChange} required />
          </div>
          <div style={{display: 'flex', flexDirection: 'column'}}>
            <label htmlFor="bl">Block Location (Google Map Link)</label>
            <input type="url" id="bl" name="bl" value={formData.bl} onChange={handleChange} required />
          </div>
          <div style={{display: 'flex', flexDirection: 'column'}}>
            <label htmlFor="block-details">Block Details</label>
            <textarea id="block-details" name="block-details" rows="3" value={formData['block-details']} onChange={handleChange} required style={{fontFamily: 'inherit', padding: '8px', border: '1px solid var(--line)'}}></textarea>
          </div>
          <div style={{display: 'flex', flexDirection: 'column'}}>
            <label htmlFor="photo">Photo (optional)</label>
            <input type="file" id="photo" name="photo" accept="image/*" onChange={handleFileChange} />
          </div>
          <button type="submit">Submit Report</button>
        </form>
      </div>
    </div>
  );
}
