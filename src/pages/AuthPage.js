import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { toast } from "react-toastify";
import { Mail, Smartphone } from "lucide-react";

function AuthPage() {
  const [emailOrMobile, setEmailOrMobile] = useState("");
  const navigate = useNavigate();

  const baseURL = process.env.REACT_APP_API_BASE_URL;
  console.log("✅ REACT_APP_API_BASE_URL:", process.env.REACT_APP_API_BASE_URL);  //onsole Log to Debug
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    console.log("📧 Email before sending OTP:", email);

    if (!emailOrMobile.trim()) {
      toast.error("❌ Please enter your Email or Mobile number.");
      return;
    }
    
    console.log("✅ baseURL in env:", baseURL);        //Debug log   

    try {
      await axios.post(`${baseURL}/api/auth/send-otp`, {
        email: emailOrMobile.trim(),
      });

    
      localStorage.setItem("emailOrMobile", emailOrMobile);
      toast.success("📤 OTP sent successfully!");
      navigate("/otp");
    } catch (err) {
      console.error("🔴 OTP error:", err.response?.data || err.message); // For debugging
      toast.error("❌ Error sending OTP. Try again.");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-100 to-indigo-200 px-4">
      <div className="bg-white p-8 rounded-2xl shadow-xl w-full max-w-md border border-gray-200">
        <div className="text-center mb-6">
          <div className="flex justify-center mb-2 text-indigo-600">
            <Smartphone className="h-10 w-10" />
          </div>
          <h1 className="text-2xl font-extrabold text-gray-800">Get Started</h1>
          <p className="text-gray-500 text-sm">Enter your email or mobile to receive an OTP</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="relative">
            <input
              type="text"
              value={emailOrMobile}
              onChange={(e) => setEmailOrMobile(e.target.value)}
              placeholder="Email or Mobile"
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
