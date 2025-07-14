import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import axios from "axios";

function LoginPage() {
  const navigate = useNavigate();
  const [password, setPassword] = useState("");
  const emailOrMobile = localStorage.getItem("emailOrMobile");

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      const res = await axios.post("http://localhost:5000/api/auth/login", {
        emailOrMobile,
        password,
      });
      alert(res.data.message);
      localStorage.setItem("userName", res.data.user.name);
      navigate("/home");
    } catch (err) {
      alert("Incorrect password.");
    }
  };

  return (
    <div className="p-4 max-w-md mx-auto">
      <h2 className="text-2xl font-bold mb-4">Enter Password</h2>
      <form onSubmit={handleLogin}>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Password"
          className="border p-2 w-full mb-4"
          required
        />
        <button className="bg-blue-500 text-white px-4 py-2">Login</button>
      </form>
      <p className="mt-4 text-sm">
        <Link to="/forgot-password" className="text-blue-600 underline">
          Forgot Password?
        </Link>
      </p>
    </div>
  );
}

export default LoginPage;
