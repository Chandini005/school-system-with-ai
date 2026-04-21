import { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { API_URL } from "../config/apiConfig";

export default function SetPassword() {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (password !== confirmPassword) {
      return setError("Passwords do not match!");
    }
    if (password.length < 6) {
      return setError("Password must be at least 6 characters.");
    }

    try {
      // Get the user's temporary token
      const token = localStorage.getItem("token"); 
      
      // Send the new password to the backend
      const response = await axios.post(
        `${API_URL}/auth/set-password`,
        { newPassword: password },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (response.data.success) {
        alert("Password saved successfully! Please log in with your new password.");
        // Clear the temporary token so they have to log in properly
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        navigate("/login"); 
      }
    } catch (err) {
      setError(err.response?.data?.message || "Failed to save password. Please try again.");
    }
  };

  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', backgroundColor: '#0d1117', color: 'white' }}>
      <div style={{ backgroundColor: '#161b22', padding: '40px', borderRadius: '10px', width: '100%', maxWidth: '400px', border: '1px solid #30363d' }}>
        <h2 style={{ textAlign: 'center', marginBottom: '10px', fontFamily: "'Syne', sans-serif" }}>Create Your Password</h2>
        <p style={{ textAlign: 'center', color: '#8b949e', fontSize: '14px', marginBottom: '20px' }}>
          Welcome! Please set a secure password for your new account.
        </p>
        
        {error && <p style={{ color: '#f85149', fontSize: '14px', textAlign: 'center' }}>{error}</p>}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
          <input 
            type="password" 
            placeholder="New Password" 
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            style={{ padding: '12px', borderRadius: '5px', border: '1px solid #30363d', backgroundColor: '#0d1117', color: 'white' }}
          />
          <input 
            type="password" 
            placeholder="Confirm Password" 
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
            style={{ padding: '12px', borderRadius: '5px', border: '1px solid #30363d', backgroundColor: '#0d1117', color: 'white' }}
          />
          <button type="submit" style={{ padding: '12px', backgroundColor: '#3fb950', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer', fontWeight: 'bold' }}>
            Save Password
          </button>
        </form>
      </div>
    </div>
  );
}