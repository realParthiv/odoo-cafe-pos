import React, { useState, useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { Lock, AlertCircle, CheckCircle } from "lucide-react";
import { authService } from "../../services/apiService";
import { theme } from "../../theme/theme";
import Loader from "../../components/Loader";

const SetPassword = () => {
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token");
  const navigate = useNavigate();
  const { handleLoginSuccess } = useAuth();
  const [loading, setLoading] = useState(true);
  const [verifying, setVerifying] = useState(true);
  const [error, setError] = useState("");
  const [userData, setUserData] = useState(null);
  const [formData, setFormData] = useState({
    password: "",
    confirm_password: "",
  });

  useEffect(() => {
    if (token) {
      verifyToken();
    } else {
      setError("Token is missing");
      setVerifying(false);
      setLoading(false);
    }
  }, [token]);

  const verifyToken = async () => {
    try {
      const response = await authService.verifyToken(token);
      if (response.success) {
        setUserData(response.data);
      }
    } catch (err) {
      console.error("Token Verification Error:", err);
      if (err.error_code === "INVITATION_USED") {
        setError("This invitation has already been used. Please login.");
      } else {
        setError(err.message || "Invalid or expired token");
      }
    } finally {
      setVerifying(false);
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (formData.password !== formData.confirm_password) {
      setError("Passwords do not match");
      return;
    }

    setLoading(true);
    setError("");

    try {
      if (!userData) {
        throw new Error("User data not found. Please refresh the page.");
      }

      const response = await authService.setPassword({
        token,
        password: formData.password,
        confirm_password: formData.confirm_password,
        first_name: userData.first_name,
        last_name: userData.last_name,
      });

      if (response.success) {
        handleLoginSuccess(response.data);
        const role = response.data.user.role;
        if (role === "admin") navigate("/admin");
        else if (role === "cashier") navigate("/cashier");
        else if (role === "kitchen") navigate("/kitchen");
        else navigate("/");
      }
    } catch (err) {
      console.error("Set Password Error:", err);
      if (err.errors) {
        const errorMsg = Object.values(err.errors).flat().join(", ");
        setError(errorMsg);
      } else {
        setError(err.message || "Failed to set password");
      }
      setLoading(false);
    }
  };

  if (verifying) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Loader />
      </div>
    );
  }

  if (!userData && error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
        <div className="bg-white p-8 rounded-xl shadow-lg max-w-md w-full text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertCircle className="w-8 h-8 text-red-500" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Invalid Link
          </h2>
          <p className="text-gray-600 mb-6">{error}</p>
          <button
            onClick={() => navigate("/login")}
            className="w-full py-2 px-4 rounded-lg bg-gray-900 text-white font-medium hover:bg-gray-800 transition-colors"
          >
            Go to Login
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex font-sans">
      {/* Left Side - Branding */}
      <div
        className="hidden lg:flex lg:w-1/2 flex-col justify-center items-center text-white p-12 relative overflow-hidden"
        style={{ backgroundColor: theme.colors.secondary }}
      >
        <div className="absolute inset-0 opacity-20 bg-[url('https://images.unsplash.com/photo-1556742049-0cfed4f7a07d?ixlib=rb-1.2.1&auto=format&fit=crop&w=1350&q=80')] bg-cover bg-center" />
        <div className="relative z-10 text-center">
          <h1 className="text-5xl font-bold mb-6">Welcome to the Team</h1>
          <p className="text-xl max-w-md mx-auto leading-relaxed">
            {userData?.first_name || "Staff Member"}, set up your account to get
            started with Odoo Cafe POS.
          </p>
        </div>
      </div>

      {/* Right Side - Form */}
      <div
        className="w-full lg:w-1/2 flex items-center justify-center p-8"
        style={{ backgroundColor: theme.colors.background }}
      >
        <div
          className="w-full max-w-md p-8 rounded-2xl shadow-xl"
          style={{ backgroundColor: theme.colors.surface }}
        >
          <div className="text-center mb-8">
            <h2
              className="text-3xl font-bold mb-2"
              style={{ color: theme.colors.primary }}
            >
              Set Password
            </h2>
            <p style={{ color: theme.colors.text.secondary }}>
              Create a secure password for your account
            </p>
          </div>

          {error && (
            <div
              className="mb-6 p-4 rounded-lg text-white text-sm flex items-center"
              style={{ backgroundColor: theme.colors.status.danger }}
            >
              <AlertCircle className="w-5 h-5 mr-2" />
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label
                className="block text-sm font-semibold mb-1"
                style={{ color: theme.colors.text.primary }}
              >
                New Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="password"
                  name="password"
                  required
                  className="w-full pl-10 pr-4 py-2 rounded-lg border focus:outline-none focus:ring-2 transition-all"
                  style={{
                    borderColor: theme.colors.border,
                    "--tw-ring-color": theme.colors.secondary,
                  }}
                  onChange={handleChange}
                />
              </div>
            </div>

            <div>
              <label
                className="block text-sm font-semibold mb-1"
                style={{ color: theme.colors.text.primary }}
              >
                Confirm Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="password"
                  name="confirm_password"
                  required
                  className="w-full pl-10 pr-4 py-2 rounded-lg border focus:outline-none focus:ring-2 transition-all"
                  style={{
                    borderColor: theme.colors.border,
                    "--tw-ring-color": theme.colors.secondary,
                  }}
                  onChange={handleChange}
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 px-4 rounded-lg font-bold text-white shadow-lg transform transition-transform hover:scale-[1.02] active:scale-95 flex justify-center items-center"
              style={{
                background: `linear-gradient(to right, ${theme.colors.secondary}, ${theme.colors.accent})`,
              }}
            >
              {loading ? <Loader size="small" /> : "Create Account"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default SetPassword;
