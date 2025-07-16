import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import axios from "axios";
import { toast } from "react-toastify";

function LoginPage() {
  const navigate = useNavigate();
  const [password, setPassword] = useState("");
  const email = localStorage.getItem("email"); // ✅ now using clean 'email' key

  const handleLogin = async (e) => {
    e.preventDefault();

    if (!email) {
      toast.error("❌ Email not found. Please go back and request OTP again.");
      navigate("/");
      return;
    }

    try {
      const res = await axios.post(`${process.env.REACT_APP_API_BASE_URL}/api/auth/login`, {
        email,
        password,
      });

      toast.success(res.data.message);
      localStorage.setItem("userName", res.data.user.name);
      navigate("/home");
    } catch (err) {
      toast.error("❌ Incorrect password. Please try again.");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="bg-white p-8 rounded-lg shadow-md w-full max-w-md">
        <h2 className="text-2xl font-bold text-center mb-6 text-gray-800">
          Welcome back 👋
        </h2>
        <form onSubmit={handleLogin}>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Enter your password"
            className="w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-400 mb-4"
            required
          />
          <button
            type="submit"
            className="w-full bg-blue-500 text-white font-semibold py-2 rounded-md hover:bg-blue-600 transition duration-300"
          >
            Login
          </button>
        </form>
        <div className="text-right mt-4">
          <Link to="/forgot-password" className="text-blue-600 hover:underline text-sm">
            Forgot password?
          </Link>
        </div>
      </div>
    </div>
  );
}

export default LoginPage;
