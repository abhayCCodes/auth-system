import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { toast } from "react-toastify";

function OTPPage() {
  const [otp, setOtp] = useState("");
  const navigate = useNavigate();
  const emailOrMobile = localStorage.getItem("emailOrMobile");

  const handleVerify = async (e) => {
    e.preventDefault();
    try {
      const res = await axios.post("http://localhost:5000/api/auth/verify-otp", {
        emailOrMobile,
        otp,
      });

      toast.success("✅ OTP Verified!");

      if (res.data.userExists) {
        navigate("/login");
      } else {
        navigate("/signup");
      }
    } catch (err) {
      toast.error("❌ Invalid or expired OTP");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 px-4">
      <div className="bg-white p-8 rounded-2xl shadow-md w-full max-w-md">
        <h2 className="text-2xl font-bold mb-6 text-center text-gray-800">
          Enter OTP
        </h2>
        <form onSubmit={handleVerify}>
          <input
            type="text"
            value={otp}
            onChange={(e) => setOtp(e.target.value)}
            placeholder="Enter 6-digit OTP"
            className="border border-gray-300 rounded-md p-3 w-full mb-4 text-lg focus:outline-none focus:ring-2 focus:ring-green-400"
            required
          />
          <button
            type="submit"
            className="bg-green-500 hover:bg-green-600 text-white font-semibold py-3 px-4 rounded-md w-full transition duration-200"
          >
            Verify OTP
          </button>
        </form>
      </div>
    </div>
  );
}

export default OTPPage;
