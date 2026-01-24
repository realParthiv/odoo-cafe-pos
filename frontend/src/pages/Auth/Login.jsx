import React, { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Mail, Lock, AlertCircle } from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { theme } from "../../theme/theme";
import Loader from "../../components/Loader";

const Login = () => {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [credentials, setCredentials] = useState({
    email: "",
    password: "",
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // Clear any old/invalid tokens when login page loads
  useEffect(() => {
    localStorage.removeItem("accessToken");
    localStorage.removeItem("refreshToken");
  }, []);

  const handleChange = (e) => {
    setCredentials({ ...credentials, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const result = await login(credentials);
      if (result.success) {
        // The RootNavigation will handle the route switch based on the new role.
        // We navigate to root to ensure the default route for the new role is triggered.
        navigate("/");
      } else {
        setError(result.error);
      }
    } catch (err) {
      setError("An unexpected error occurred");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex font-sans">
      {/* Left Side - Image/Branding */}
      <div
        className="hidden lg:flex lg:w-1/2 flex-col justify-center items-center text-white p-12 relative overflow-hidden"
        style={{ backgroundColor: theme.colors.primary }}
      >
        <div className="absolute inset-0 opacity-20 bg-[url('https://images.unsplash.com/photo-1554118811-1e0d58224f24?ixlib=rb-1.2.1&auto=format&fit=crop&w=1350&q=80')] bg-cover bg-center" />
        <div className="relative z-10 text-center">
          <h1 className="text-5xl font-bold mb-6">Odoo Cafe POS</h1>
          <p className="text-xl max-w-md mx-auto leading-relaxed">
            Manage your restaurant with elegance and efficiency. The ultimate
            point of sale solution.
          </p>
        </div>
      </div>

      {/* Right Side - Login Form */}
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
              Welcome Back
            </h2>
            <p style={{ color: theme.colors.text.secondary }}>
              Please sign in to your account
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
                className="block text-sm font-semibold mb-2"
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
                  className="w-full pl-10 pr-4 py-3 rounded-lg border focus:outline-none focus:ring-2 transition-all"
                  style={{
                    borderColor: theme.colors.border,
                    "--tw-ring-color": theme.colors.secondary,
                  }}
                  placeholder="you@example.com"
                  onChange={handleChange}
                />
              </div>
            </div>

            <div>
              <label
                className="block text-sm font-semibold mb-2"
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
                  className="w-full pl-10 pr-4 py-3 rounded-lg border focus:outline-none focus:ring-2 transition-all"
                  style={{
                    borderColor: theme.colors.border,
                    "--tw-ring-color": theme.colors.secondary,
                  }}
                  placeholder="••••••••"
                  onChange={handleChange}
                />
              </div>
            </div>

            <div className="flex items-center justify-between text-sm">
              <label className="flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  className="mr-2 rounded text-teal-600 focus:ring-teal-500"
                />
                <span style={{ color: theme.colors.text.secondary }}>
                  Remember me
                </span>
              </label>
              <a
                href="#"
                className="font-medium hover:underline"
                style={{ color: theme.colors.secondary }}
              >
                Forgot password?
              </a>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 px-4 rounded-lg font-bold text-white shadow-lg transform transition-transform hover:scale-[1.02] active:scale-95 flex justify-center items-center"
              style={{
                background: `linear-gradient(to right, ${theme.colors.primary}, ${theme.colors.secondary})`,
              }}
            >
              {loading ? <Loader size="small" /> : "Sign In"}
            </button>
          </form>

          <div className="mt-8 text-center text-sm">
            <span style={{ color: theme.colors.text.secondary }}>
              New to Odoo Cafe?{" "}
            </span>
            <Link
              to="/register"
              className="font-bold hover:underline"
              style={{ color: theme.colors.secondary }}
            >
              Create an account
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
