import React, { useState } from "react";
import axios from "axios";
import { toast } from "react-toastify";
import { useLocation, useNavigate } from "react-router-dom";

const SignupPage = () => {
  const location = useLocation();
  const navigate = useNavigate();

  const verifiedEmail = location.state?.verifiedEmail || "";
  const [userData, setUserData] = useState({
    name: "",
    email: verifiedEmail,
    password: "",
  });

  const [loading, setLoading] = useState(false);

  const isStrongPassword = (password) => {
    const strongRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[\W_]).{6,}$/;
    return strongRegex.test(password);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setUserData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const { name, email, password } = userData;

    if (!name || !email || !password) {
      toast.error("Please fill all fields");
      return;
    }

    if (!isStrongPassword(password)) {
      toast.error(
        "Password must be at least 6 characters and include uppercase, lowercase, number, and special character."
      );
      return;
    }

    try {
      setLoading(true);
      const response = await axios.post(
        `${process.env.REACT_APP_API_BASE_URL}/api/auth/signup`,
        userData
      );

      toast.success("Signup successful!");
      setUserData({ name: "", email: "", password: "" });
      navigate("/login");
    } catch (error) {
      console.error(error);
      toast.error(
        error.response?.data?.message || "Signup failed. Try again."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 px-4">
      <div className="max-w-md w-full bg-white p-8 rounded-2xl shadow-lg">
        <h2 className="text-2xl font-bold mb-6 text-center text-gray-800">
          Sign Up
        </h2>
        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Name
            </label>
            <input
              type="text"
              name="name"
              value={userData.name}
              onChange={handleChange}
              placeholder="Your Name"
              className="w-full mt-1 p-2 border border-gray-300 rounded-md focus:outline-none focus:ring focus:border-blue-400"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">
              Verified Email
            </label>
            <input
              type="email"
              name="email"
              value={verifiedEmail}
              readOnly
              className="w-full mt-1 p-2 bg-gray-100 border border-gray-300 rounded-md text-gray-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">
              Password
            </label>
            <input
              type="password"
              name="password"
              value={userData.password}
              onChange={handleChange}
              placeholder="Create Password"
              className="w-full mt-1 p-2 border border-gray-300 rounded-md focus:outline-none focus:ring focus:border-blue-400"
            />
            <p className="text-xs text-gray-500 mt-1">
              At least 6 characters, including uppercase, lowercase, number, and symbol.
            </p>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 text-white py-2 rounded-md hover:bg-blue-700 transition duration-200"
          >
            {loading ? "Creating Account..." : "Sign Up"}
          </button>
        </form>
      </div>
    </div>
  );
};

export default SignupPage;
