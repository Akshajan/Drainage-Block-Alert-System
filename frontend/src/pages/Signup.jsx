import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

export default function Signup() {
  const navigate = useNavigate();

  const handleSignup = (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    
    axios.post('http://localhost:3000/signup', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    })
      .then(res => {
        alert(res.data.message);
        navigate('/login');
      })
      .catch(err => {
        alert(err.response?.data?.message || 'Signup failed');
      });
  };

  return (
    <div style={{ maxWidth: '400px', margin: '40px auto' }} className="card">
      <h2 style={{marginTop: 0}}>Sign Up</h2>
      <form onSubmit={handleSignup}>
        <div className="form-group">
          <label>Profile Picture</label>
          <input type="file" name="profile_picture" accept="image/*" required />
        </div>
        <div className="form-group">
          <label>Full Name</label>
          <input type="text" name="name" required />
        </div>
        <div className="form-group">
          <label>Address</label>
          <input type="text" name="address" required />
        </div>
        <div className="form-group">
          <label>State</label>
          <select name="state" required defaultValue="">
            <option value="" disabled>Select state</option>
            <option value="FL">Florida</option>
            <option value="CA">California</option>
            <option value="KL">Kerala</option>
          </select>
        </div>
        <div className="form-group">
          <label>Pin Code</label>
          <input type="text" name="pincode" required />
        </div>
        <div className="form-group">
          <label>Phone Number</label>
          <input type="tel" name="phone" required />
        </div>
        <div className="form-group">
          <label>Email ID</label>
          <input type="email" name="email" required />
        </div>
        <div className="form-group">
          <label>Password</label>
          <input type="password" name="pass" required />
        </div>
        <button type="submit" className="btn" style={{width: '100%'}}>Sign Up</button>
      </form>
    </div>
  );
}
