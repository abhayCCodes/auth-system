import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { toast } from "react-toastify";

function OTPPage() {
  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const email = localStorage.getItem("email");

  const handleVerify = async (e) => {
    e.preventDefault();

    if (!otp.trim()) {
      toast.error("❌ Please enter the OTP.");
      return;
    }

    setLoading(true);
    try {
      const res = await axios.post(`${process.env.REACT_APP_API_BASE_URL}/api/auth/verify-otp`, {
        email,
        otp,
      });

      toast.success("✅ OTP verified successfully!");

      if (res.data.userExists) {
        navigate("/login");
      } else {
        navigate("/signup");
      }
    } catch (err) {
      toast.error("❌ Invalid or expired OTP. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="bg-white p-8 rounded-xl shadow-md w-full max-w-md">
        <h2 className="text-2xl font-bold mb-6 text-center text-gray-800">
          Verify OTP
        </h2>
        <form onSubmit={handleVerify}>
          <input
            type="text"
            value={otp}
            onChange={(e) => setOtp(e.target.value)}
            placeholder="Enter OTP"
            className="border border-gray-300 rounded-md p-3 w-full mb-4 text-lg focus:outline-none focus:ring-2 focus:ring-green-400"
            required
          />
          <button
            type="submit"
            disabled={loading}
            className={`${
              loading ? "bg-green-300 cursor-not-allowed" : "bg-green-500 hover:bg-green-600"
            } text-white font-semibold py-3 px-4 rounded-md w-full transition duration-200`}
          >
            {loading ? "Verifying..." : "Verify OTP"}
          </button>
        </form>
      </div>
    </div>
  );
}

export default OTPPage;
