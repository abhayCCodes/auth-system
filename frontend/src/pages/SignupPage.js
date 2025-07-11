import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { toast } from "react-toastify";

function SignupPage() {
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [show, setShow] = useState(false);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const emailOrMobile = localStorage.getItem("emailOrMobile");

  const isStrong =
    password.length >= 8 && /[A-Z]/.test(password) && /\d/.test(password);

  const handleSignup = async (e) => {
    e.preventDefault();

    if (!isStrong) {
      toast.error("❌ Password must be 8+ chars with 1 uppercase & 1 number.");
      return;
    }

    setLoading(true);
    try {
      const res = await axios.post("http://localhost:5000/api/auth/signup", {
        name,
        emailOrMobile,
        password,
      });

      toast.success("✅ Account created successfully!");
      localStorage.setItem("userName", name);
      navigate("/home");
    } catch (err) {
      toast.error("❌ Signup failed. Try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="bg-white p-8 rounded-xl shadow-md w-full max-w-md">
        <h2 className="text-2xl font-bold mb-6 text-center text-gray-800">
          Create Account
        </h2>
        <form onSubmit={handleSignup}>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Full Name"
            className="border border-gray-300 rounded-md p-3 w-full mb-4 text-lg focus:outline-none focus:ring-2 focus:ring-blue-400"
            required
          />
          <div className="relative mb-2">
            <input
              type={show ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Password"
              className="border border-gray-300 rounded-md p-3 w-full text-lg focus:outline-none focus:ring-2 focus:ring-blue-400"
              required
            />
            <button
              type="button"
              onClick={() => setShow(!show)}
              className="absolute top-3 right-3 text-sm text-gray-600"
            >
              {show ? "Hide" : "Show"}
            </button>
          </div>
          {!isStrong && password.length > 0 && (
            <p className="text-sm text-red-500 mb-2">
              Use 8+ chars, 1 uppercase & 1 number
            </p>
          )}
          <button
            type="submit"
            disabled={loading}
            className={`${
              loading
                ? "bg-blue-300 cursor-not-allowed"
                : "bg-blue-500 hover:bg-blue-600"
            } text-white font-semibold py-3 px-4 rounded-md w-full transition duration-200`}
          >
            {loading ? "Creating..." : "Sign Up"}
          </button>
        </form>
      </div>
    </div>
  );
}

export default SignupPage;
