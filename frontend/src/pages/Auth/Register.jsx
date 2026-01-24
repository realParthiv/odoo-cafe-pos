import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { User, Mail, Phone, Lock, AlertCircle } from "lucide-react";
import { authService } from "../../services/apiService";
import { theme } from "../../theme/theme";
import Loader from "../../components/Loader";

const Register = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    confirm_password: "",
    first_name: "",
    last_name: "",
    phone: "",
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    if (formData.password !== formData.confirm_password) {
      setError("Passwords don't match");
      setLoading(false);
      return;
    }

    try {
      const response = await authService.registerOwner(formData);
      if (response.success) {
        navigate("/login");
      }
    } catch (err) {
      setError(err.message || "Registration failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex font-sans">
      {/* Left Side - Image/Branding */}
      <div
        className="hidden lg:flex lg:w-1/2 flex-col justify-center items-center text-white p-12 relative overflow-hidden"
        style={{ backgroundColor: theme.colors.secondary }}
      >
        <div className="absolute inset-0 opacity-20 bg-[url('https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?ixlib=rb-1.2.1&auto=format&fit=crop&w=1350&q=80')] bg-cover bg-center" />
        <div className="relative z-10 text-center">
          <h1 className="text-5xl font-bold mb-6">Join the Family</h1>
          <p className="text-xl max-w-md mx-auto leading-relaxed">
            Start your journey with Odoo Cafe POS. Streamline your operations
            and delight your customers.
          </p>
        </div>
      </div>

      {/* Right Side - Register Form */}
      <div
        className="w-full lg:w-1/2 flex items-center justify-center p-8"
        style={{ backgroundColor: theme.colors.background }}
      >
        <div
          className="w-full max-w-lg p-8 rounded-2xl shadow-xl"
          style={{ backgroundColor: theme.colors.surface }}
        >
          <div className="text-center mb-8">
            <h2
              className="text-3xl font-bold mb-2"
              style={{ color: theme.colors.primary }}
            >
              Create Account
            </h2>
            <p style={{ color: theme.colors.text.secondary }}>
              Set up your restaurant owner profile
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

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label
                  className="block text-sm font-semibold mb-1"
                  style={{ color: theme.colors.text.primary }}
                >
                  First Name
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <User className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    type="text"
                    name="first_name"
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
                  Last Name
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <User className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    type="text"
                    name="last_name"
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
            </div>

            <div>
              <label
                className="block text-sm font-semibold mb-1"
                style={{ color: theme.colors.text.primary }}
              >
                Email Address
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Mail className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="email"
                  name="email"
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
                Phone Number
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Phone className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="tel"
                  name="phone"
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

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label
                  className="block text-sm font-semibold mb-1"
                  style={{ color: theme.colors.text.primary }}
                >
                  Password
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
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 px-4 mt-4 rounded-lg font-bold text-white shadow-lg transform transition-transform hover:scale-[1.02] active:scale-95 flex justify-center items-center"
              style={{
                background: `linear-gradient(to right, ${theme.colors.secondary}, ${theme.colors.accent})`,
              }}
            >
              {loading ? <Loader size="small" /> : "Register Restaurant"}
            </button>
          </form>

          <div className="mt-8 text-center text-sm">
            <span style={{ color: theme.colors.text.secondary }}>
              Already have an account?{" "}
            </span>
            <Link
              to="/login"
              className="font-bold hover:underline"
              style={{ color: theme.colors.secondary }}
            >
              Sign in
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Register;
