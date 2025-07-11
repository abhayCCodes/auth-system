import React from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";

function HomePage() {
  const navigate = useNavigate();
  const userName = localStorage.getItem("userName") || "User";

  const handleLogout = () => {
    localStorage.clear();
    toast.success("Logged out successfully.");
    navigate("/");
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-100 to-green-300 px-4">
      <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full text-center">
        <h1 className="text-4xl font-bold text-green-700 mb-4">
          Welcome, {userName}! 🎉
        </h1>
        <p className="text-gray-600 mb-6">
          You are successfully logged in to your secure account.
        </p>
        <button
          onClick={handleLogout}
          className="bg-red-500 hover:bg-red-600 text-white px-6 py-2 rounded-full font-medium shadow-lg transition duration-300"
        >
          Logout
        </button>
      </div>
    </div>
  );
}

export default HomePage;
