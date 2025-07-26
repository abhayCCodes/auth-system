import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { toast } from "react-toastify";
import { Mail } from "lucide-react";

function AuthPage() {
  const [email, setEmail] = useState("");
  const navigate = useNavigate();

  const baseURL = process.env.REACT_APP_API_BASE_URL;
  console.log("✅ REACT_APP_API_BASE_URL:", baseURL);

  const handleSubmit = async (e) => {
    e.preventDefault();

    console.log("📧 Email before sending OTP:", email);

    if (!email.trim() || !email.includes("@")) {
      toast.error("❌ Please enter a valid email address.");
      return;
    }

    try {
      await axios.post(`${baseURL}/api/otp/send-otp`, {
        email: email.trim(),
      });

      localStorage.setItem("email", email);
      toast.success("📤 OTP sent successfully!");
      navigate("/otp");
    } catch (err) {
      console.error("🔴 OTP error:", err.response?.data || err.message);
      toast.error("❌ Error sending OTP. Try again.");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-100 to-indigo-200 px-4">
      <div className="bg-white p-8 rounded-2xl shadow-xl w-full max-w-md border border-gray-200">
        <div className="text-center mb-6">
          <div className="flex justify-center mb-2 text-indigo-600">
            <Mail className="h-10 w-10" />
          </div>
          <h1 className="text-2xl font-extrabold text-gray-800">Get Started</h1>
          <p className="text-gray-500 text-sm">Enter your email to receive an OTP</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="relative">
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter your email"
              className="border border-gray-300 rounded-md p-3 w-full text-base focus:outline-none focus:ring-2 focus:ring-blue-400"
              required
            />
            <Mail className="absolute right-3 top-3.5 text-gray-400 w-5 h-5" />
          </div>

          <button
            type="submit"
            className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-3 px-4 rounded-md w-full transition duration-200 shadow"
          >
            Send OTP
          </button>
        </form>
      </div>
    </div>
  );
}

export default AuthPage;
