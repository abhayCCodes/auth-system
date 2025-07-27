import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';

const SignupPage = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');

  // ✅ Get verified email from localStorage
  useEffect(() => {
    const verifiedEmail = localStorage.getItem('verifiedEmail');
    if (verifiedEmail) {
      setEmail(verifiedEmail);
    } else {
      toast.error('No verified email found. Please verify your email first.');
      navigate('/auth'); // Redirect to email verification
    }
  }, [navigate]);

  const handleSignup = async (e) => {
    e.preventDefault();

    try {
      const res = await axios.post(
        `${process.env.REACT_APP_API_BASE_URL}/api/auth/signup`,
        { email, name, password }
      );

      toast.success('Signup successful! Please login.');
      localStorage.removeItem('verifiedEmail');
      navigate('/login');
    } catch (err) {
      console.error(err.response?.data || err.message);
      toast.error(err.response?.data?.message || 'Signup failed');
    }
  };

  return (
    <div className="flex justify-center items-center min-h-screen bg-gray-50">
      <form
        onSubmit={handleSignup}
        className="bg-white p-8 rounded-lg shadow-md w-full max-w-md"
      >
        <h2 className="text-2xl font-bold mb-6 text-center">Create Account</h2>

        <div className="mb-4">
          <label className="block text-gray-700 mb-1">Verified Email</label>
          <input
            type="email"
            value={email}
            readOnly
            className="w-full px-4 py-2 border border-gray-300 rounded bg-gray-100 cursor-not-allowed"
          />
        </div>

        <div className="mb-4">
          <label className="block text-gray-700 mb-1">Full Name</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Your Name"
            className="w-full px-4 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
        </div>

        <div className="mb-6">
          <label className="block text-gray-700 mb-1">Password</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Create a password"
            className="w-full px-4 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
        </div>

        <button
          type="submit"
          className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded"
        >
          Sign Up
        </button>
      </form>
    </div>
  );
};

export default SignupPage;
