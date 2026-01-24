import React, { useState, useEffect } from "react";
import {
  Plus,
  Mail,
  User,
  Phone,
  Trash2,
  RefreshCw,
  CheckCircle,
  XCircle,
} from "lucide-react";
import { authService } from "../../services/apiService";
import { theme } from "../../theme/theme";
import Loader from "../../components/Loader";

const StaffManagement = ({ role }) => {
  const [activeTab, setActiveTab] = useState("staff"); // 'staff' or 'invitations'
  const [users, setUsers] = useState([]);
  const [invitations, setInvitations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [inviteLoading, setInviteLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [inviteData, setInviteData] = useState({
    first_name: "",
    last_name: "",
    email: "",
    phone: "",
    role: role || "cashier", // Default role
    upi_id: "",
  });

  useEffect(() => {
    // Update inviteData role when prop changes
    setInviteData((prev) => ({ ...prev, role: role || "cashier" }));
    setSuccess("");
    setError("");
    fetchData();
  }, [activeTab, role]);

  const fetchData = async () => {
    setLoading(true);
    setError("");
    try {
      if (activeTab === "staff") {
        const data = await authService.getUsers(role);
        // Handle nested response structure: { data: { users: [] } }
        setUsers(data.data?.users || []);
      } else {
        const data = await authService.getInvitations(null, role);
        // Handle nested response structure if applicable, or fallback
        setInvitations(data.data?.invitations || data.data || []);
      }
    } catch (err) {
      console.error(err);
      // Don't show error on initial fetch if it's just empty
    } finally {
      setLoading(false);
    }
  };

  const handleInviteChange = (e) => {
    setInviteData({ ...inviteData, [e.target.name]: e.target.value });
  };

  const handleInviteSubmit = async (e) => {
    e.preventDefault();
    setInviteLoading(true);
    setError("");
    setSuccess("");

    try {
      // Clean up payload: remove empty strings for optional fields
      const payload = { ...inviteData };

      if (payload.role === "cashier" && !payload.upi_id) {
        setError("UPI ID is required for Cashiers");
        setInviteLoading(false);
        return;
      }

      if (!payload.upi_id) delete payload.upi_id;

      const response = await authService.inviteStaff(payload);
      if (response.success) {
        setSuccess(
          `Invitation sent to ${inviteData.email} as ${inviteData.role}`,
        );
        setInviteData({
          first_name: "",
          last_name: "",
          email: "",
          phone: "",
          role: role || "cashier",
          upi_id: "",
        });
        if (activeTab === "invitations") fetchData();
      }
    } catch (err) {
      console.error("Invite Error:", err);
      // Display specific validation errors if available
      if (err.errors) {
        const errorMsg = Object.entries(err.errors)
          .map(([key, val]) => `${val}`) // Just show the message, key might be redundant if message is clear
          .join(", ");
        setError(errorMsg || "Failed to send invitation");
      } else {
        setError(err.message || "Failed to send invitation");
      }
    } finally {
      setInviteLoading(false);
    }
  };

  const handleResend = async (id) => {
    try {
      await authService.resendInvitation(id);
      alert("Invitation resent successfully");
    } catch (err) {
      console.error("Resend Error:", err);
      const errorMsg = err.message || "Failed to resend invitation";
      alert(errorMsg);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this invitation?"))
      return;
    try {
      await authService.deleteInvitation(id);
      fetchData();
    } catch (err) {
      alert("Failed to delete invitation");
    }
  };

  const handleDeactivateUser = async (id) => {
    if (!window.confirm("Are you sure you want to deactivate this user?"))
      return;
    try {
      await authService.deactivateUser(id);
      fetchData();
    } catch (err) {
      alert("Failed to deactivate user");
    }
  };

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h2
            className="text-2xl font-bold capitalize"
            style={{ color: theme.colors.text.primary }}
          >
            {role ? `${role} Management` : "Staff Management"}
          </h2>
          <p style={{ color: theme.colors.text.secondary }}>
            Manage your {role || "team"} members and invitations
          </p>
        </div>
        <div
          className="flex space-x-2 bg-white p-1 rounded-lg border"
          style={{ borderColor: theme.colors.border }}
        >
          <button
            onClick={() => setActiveTab("staff")}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              activeTab === "staff"
                ? "bg-gray-100 text-gray-900"
                : "text-gray-500 hover:text-gray-900"
            }`}
          >
            Active Staff
          </button>
          <button
            onClick={() => setActiveTab("invitations")}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              activeTab === "invitations"
                ? "bg-gray-100 text-gray-900"
                : "text-gray-500 hover:text-gray-900"
            }`}
          >
            Invitations
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Invite Form */}
        <div className="lg:col-span-1">
          <div
            className="bg-white p-6 rounded-xl shadow-sm border"
            style={{ borderColor: theme.colors.border }}
          >
            <h3 className="text-lg font-bold mb-4 flex items-center">
              <Plus className="w-5 h-5 mr-2" /> Invite New Staff
            </h3>

            {error && (
              <div className="mb-4 p-3 rounded-lg bg-red-50 text-red-600 text-sm flex items-center">
                <XCircle className="w-4 h-4 mr-2" /> {error}
              </div>
            )}

            {success && (
              <div className="mb-4 p-3 rounded-lg bg-green-50 text-green-600 text-sm flex items-center">
                <CheckCircle className="w-4 h-4 mr-2" /> {success}
              </div>
            )}

            <form onSubmit={handleInviteSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold mb-1 text-gray-600">
                    First Name
                  </label>
                  <input
                    type="text"
                    name="first_name"
                    value={inviteData.first_name}
                    onChange={handleInviteChange}
                    required
                    className="w-full px-3 py-2 rounded-lg border text-sm focus:outline-none focus:ring-2"
                    style={{
                      borderColor: theme.colors.border,
                      "--tw-ring-color": theme.colors.secondary,
                    }}
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold mb-1 text-gray-600">
                    Last Name
                  </label>
                  <input
                    type="text"
                    name="last_name"
                    value={inviteData.last_name}
                    onChange={handleInviteChange}
                    required
                    className="w-full px-3 py-2 rounded-lg border text-sm focus:outline-none focus:ring-2"
                    style={{
                      borderColor: theme.colors.border,
                      "--tw-ring-color": theme.colors.secondary,
                    }}
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold mb-1 text-gray-600">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 absolute left-3 top-2.5 text-gray-400" />
                  <input
                    type="email"
                    name="email"
                    value={inviteData.email}
                    onChange={handleInviteChange}
                    required
                    className="w-full pl-9 pr-3 py-2 rounded-lg border text-sm focus:outline-none focus:ring-2"
                    style={{
                      borderColor: theme.colors.border,
                      "--tw-ring-color": theme.colors.secondary,
                    }}
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold mb-1 text-gray-600">
                  Phone Number
                </label>
                <div className="relative">
                  <Phone className="w-4 h-4 absolute left-3 top-2.5 text-gray-400" />
                  <input
                    type="tel"
                    name="phone"
                    value={inviteData.phone}
                    onChange={handleInviteChange}
                    required
                    className="w-full pl-9 pr-3 py-2 rounded-lg border text-sm focus:outline-none focus:ring-2"
                    style={{
                      borderColor: theme.colors.border,
                      "--tw-ring-color": theme.colors.secondary,
                    }}
                  />
                </div>
              </div>

              {!role && (
                <div>
                  <label className="block text-xs font-semibold mb-1 text-gray-600">
                    Role
                  </label>
                  <select
                    name="role"
                    value={inviteData.role}
                    onChange={handleInviteChange}
                    className="w-full px-3 py-2 rounded-lg border text-sm focus:outline-none focus:ring-2"
                    style={{
                      borderColor: theme.colors.border,
                      "--tw-ring-color": theme.colors.secondary,
                    }}
                  >
                    <option value="cashier">Cashier</option>
                    <option value="kitchen">Kitchen Staff</option>
                    <option value="admin">Admin</option>
                  </select>
                </div>
              )}

              {inviteData.role !== "kitchen" && (
                <div>
                  <label className="block text-xs font-semibold mb-1 text-gray-600">
                    UPI ID {inviteData.role === "cashier" ? "" : "(Optional)"}
                  </label>
                  <input
                    type="text"
                    name="upi_id"
                    value={inviteData.upi_id}
                    onChange={handleInviteChange}
                    required={inviteData.role === "cashier"}
                    className="w-full px-3 py-2 rounded-lg border text-sm focus:outline-none focus:ring-2"
                    style={{
                      borderColor: theme.colors.border,
                      "--tw-ring-color": theme.colors.secondary,
                    }}
                  />
                </div>
              )}

              <button
                type="submit"
                disabled={inviteLoading}
                className="w-full py-2.5 rounded-lg font-bold text-white shadow-md hover:opacity-90 transition-opacity flex justify-center items-center text-sm"
                style={{ backgroundColor: theme.colors.primary }}
              >
                {inviteLoading ? <Loader size="small" /> : "Send Invitation"}
              </button>
            </form>
          </div>
        </div>

        {/* List Section */}
        <div className="lg:col-span-2">
          <div
            className="bg-white rounded-xl shadow-sm border overflow-hidden"
            style={{ borderColor: theme.colors.border }}
          >
            <div className="p-4 border-b bg-gray-50 flex justify-between items-center">
              <h3 className="font-bold text-gray-700">
                {activeTab === "staff"
                  ? "Active Staff Members"
                  : "Pending Invitations"}
              </h3>
              <button
                onClick={fetchData}
                className="p-1 hover:bg-gray-200 rounded-full transition-colors"
              >
                <RefreshCw className="w-4 h-4 text-gray-500" />
              </button>
            </div>

            {loading ? (
              <div className="p-12 flex justify-center">
                <Loader />
              </div>
            ) : (
              <div className="divide-y">
                {activeTab === "staff" ? (
                  users.length === 0 ? (
                    <div className="p-8 text-center text-gray-500">
                      No active staff found.
                    </div>
                  ) : (
                    users.map((user) => (
                      <div
                        key={user.id}
                        className="p-4 flex items-center justify-between hover:bg-gray-50"
                      >
                        <div className="flex items-center">
                          <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center text-gray-600 font-bold mr-3">
                            {user.first_name?.charAt(0)}
                          </div>
                          <div>
                            <p className="font-medium text-gray-900">
                              {user.first_name} {user.last_name}
                            </p>
                            <p className="text-xs text-gray-500">
                              {user.email} •{" "}
                              <span className="capitalize">{user.role}</span>
                            </p>
                          </div>
                        </div>
                        <button
                          onClick={() => handleDeactivateUser(user.id)}
                          className="text-red-500 hover:text-red-700 text-sm font-medium px-3 py-1 rounded hover:bg-red-50"
                        >
                          Deactivate
                        </button>
                      </div>
                    ))
                  )
                ) : invitations.length === 0 ? (
                  <div className="p-8 text-center text-gray-500">
                    No pending invitations.
                  </div>
                ) : (
                  invitations.map((invitation) => (
                    <div
                      key={invitation.id}
                      className="p-4 flex items-center justify-between hover:bg-gray-50"
                    >
                      <div className="flex items-center">
                        <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center text-blue-600 mr-3">
                          <Mail className="w-5 h-5" />
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">
                            {invitation.email}
                          </p>
                          <p className="text-xs text-gray-500">
                            Role:{" "}
                            <span className="capitalize">
                              {invitation.role}
                            </span>{" "}
                            • Expires:{" "}
                            {new Date(
                              invitation.expires_at,
                            ).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      <div className="flex space-x-2">
                        <button
                          onClick={() => handleResend(invitation.id)}
                          className="text-blue-500 hover:text-blue-700 p-2 rounded hover:bg-blue-50"
                          title="Resend Invitation"
                        >
                          <RefreshCw className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(invitation.id)}
                          className="text-red-500 hover:text-red-700 p-2 rounded hover:bg-red-50"
                          title="Delete Invitation"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default StaffManagement;
