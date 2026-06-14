import React, { useState, useEffect } from "react";
import axios from "axios";
import { toast } from "react-toastify";
import { useLocation, useNavigate } from "react-router-dom";

const SignupPage = () => {
  const location = useLocation();
  const navigate = useNavigate();

  const [userData, setUserData] = useState({
    name: "",
    email: "",
    password: "",
  });

  const [passwordScore, setPasswordScore] = useState(0);
  const [loading, setLoading] = useState(false);

  // Initialize with verified email if available
  useEffect(() => {
    if (location.state?.verifiedEmail) {
      setUserData(prev => ({
        ...prev,
        email: location.state.verifiedEmail
      }));
    }
  }, [location.state?.verifiedEmail]);

  // Enhanced password strength checker
  const checkPasswordStrength = (password) => {
    let score = 0;
    
    // Length check
    if (password.length >= 6) score += 1;
    if (password.length >= 8) score += 1;
    
    // Complexity checks
    if (/[A-Z]/.test(password)) score += 1;
    if (/[a-z]/.test(password)) score += 1;
    if (/\d/.test(password)) score += 1;
    if (/[\W_]/.test(password)) score += 1;
    
    setPasswordScore(score);
    return score >= 5; // Require at least 5/6 points
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    
    if (name === "password") {
      checkPasswordStrength(value);
    }
    
    setUserData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const { name, email, password } = userData;

    // Validation
    if (!name || !email || !password) {
      toast.error("Please fill all fields");
      return;
    }

    if (!checkPasswordStrength(password)) {
      toast.error(
        "Password too weak. Include uppercase, lowercase, numbers, and special characters."
      );
      return;
    }

    try {
      setLoading(true);
      
      // Secure request with CSRF protection if needed
      const response = await axios.post(
        `${process.env.REACT_APP_API_BASE_URL}/api/auth/signup`,
        userData,
        {
          headers: {
            'Content-Type': 'application/json',
            // Add CSRF token if using server-side sessions
          },
          withCredentials: true // For cookies if using them
        }
      );

      // Clear sensitive data after successful signup
      setUserData({ name: "", email: "", password: "" });
      
      toast.success("Account created successfully!");
      
      // Redirect with state to prevent back navigation to signup
      navigate("/login", { replace: true });
      
    } catch (error) {
      console.error("Signup error:", error);
      
      const errorMessage = error.response?.data?.message || 
                         error.response?.data?.error ||
                         "Signup failed. Please try again.";
      
      // Special handling for duplicate email
      if (error.response?.status === 409) {
        toast.error("Email already registered. Please login instead.");
        navigate("/login");
        return;
      }
      
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // Password strength visual feedback
  const getPasswordStrengthColor = () => {
    if (passwordScore <= 2) return "bg-red-500";
    if (passwordScore <= 4) return "bg-yellow-500";
    return "bg-green-500";
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 px-4">
      <div className="max-w-md w-full bg-white p-8 rounded-2xl shadow-lg">
        <h2 className="text-2xl font-bold mb-6 text-center text-gray-800">
          Create Your Account
        </h2>
        
        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Full Name
            </label>
            <input
              type="text"
              name="name"
              value={userData.name}
              onChange={handleChange}
              placeholder="Your full name"
              className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-400"
              autoComplete="name"
              required
            />
          </div>               

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Verified Email
            </label>
            <input
              type="email"
              name="email"
              value={userData.email}
              onChange={handleChange}
              readOnly={!!location.state?.verifiedEmail}
              className={`w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-400 ${
                location.state?.verifiedEmail ? "bg-gray-100 text-gray-600" : ""
              }`}
              autoComplete="email"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Password
            </label>
            <input
              type="password"
              name="password"
              value={userData.password}
              onChange={handleChange}
              placeholder="Create a strong password"
              className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-400"
              autoComplete="new-password"
              required
              minLength="6"
            />
            
            {/* Password strength meter */}
            {userData.password && (
              <div className="mt-2">
                <div className="h-1 w-full bg-gray-200 rounded-full overflow-hidden">
                  <div 
                    className={`h-full ${getPasswordStrengthColor()}`} 
                    style={{ width: `${(passwordScore / 6) * 100}%` }}
                  ></div>
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  {passwordScore <= 2 ? "Weak" : 
                   passwordScore <= 4 ? "Moderate" : "Strong"} password
                </p>
              </div>
            )}
            
            <ul className="text-xs text-gray-500 mt-2 list-disc pl-5">
              <li>At least 6 characters (8+ recommended)</li>
              <li>Uppercase and lowercase letters</li>
              <li>At least one number</li>
              <li>Special character (e.g., !@#$%)</li>
            </ul>
          </div>

          <button
            type="submit"
            disabled={loading}
            className={`w-full py-3 px-4 rounded-md font-medium text-white transition-colors ${
              loading ? "bg-blue-400 cursor-not-allowed" : "bg-blue-600 hover:bg-blue-700"
            }`}
          >
            {loading ? (
              <span className="flex items-center justify-center">
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Creating Account...
              </span>
            ) : "Sign Up"}
          </button>
        </form>
        
        <div className="mt-4 text-center text-sm text-gray-600">
          Already have an account?{" "}
          <button 
            onClick={() => navigate("/login")}
            className="text-blue-600 hover:text-blue-800 font-medium"
          >
            Log in
          </button>
        </div>
      </div>
    </div>
  );
};

export default SignupPage;