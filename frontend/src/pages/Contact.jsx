import { useState } from 'react';

export default function Contact() {
  const [formData, setFormData] = useState({ name: '', email: '', phone: '', query: '' });

  const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleSubmit = (e) => {
    e.preventDefault();
    // In a real scenario, this would post to a backend API
    alert("Query submitted successfully!");
    setFormData({ name: '', email: '', phone: '', query: '' });
  };

  return (
    <div>
      <h2 style={{marginTop: 0}}>Contact Us</h2>
      <div className="card">
        <p>Have a question or need assistance? Reach out to us!</p>
        <form onSubmit={handleSubmit} style={{display: 'flex', flexDirection: 'column', gap: '15px'}}>
          <div style={{display: 'flex', flexDirection: 'column'}}>
            <label htmlFor="name">Name:</label>
            <input type="text" id="name" name="name" value={formData.name} onChange={handleChange} required />
          </div>
          <div style={{display: 'flex', flexDirection: 'column'}}>
            <label htmlFor="email">Email:</label>
            <input type="email" id="email" name="email" value={formData.email} onChange={handleChange} required />
          </div>
          <div style={{display: 'flex', flexDirection: 'column'}}>
            <label htmlFor="phone">Phone Number:</label>
            <input type="tel" id="phone" name="phone" value={formData.phone} onChange={handleChange} required />
          </div>
          <div style={{display: 'flex', flexDirection: 'column'}}>
            <label htmlFor="query">Your Query:</label>
            <textarea id="query" name="query" rows="5" value={formData.query} onChange={handleChange} required style={{fontFamily: 'inherit', padding: '8px', border: '1px solid var(--line)'}}></textarea>
          </div>
          <button type="submit">Submit</button>
        </form>
      </div>
    </div>
  );
}
