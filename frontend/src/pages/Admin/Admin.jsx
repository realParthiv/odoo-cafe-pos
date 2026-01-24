import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import Sidebar from "../../components/Sidebar";
import Header from "../../components/Header";
import StaffManagement from "./StaffManagement";
import FloorManagement from "./FloorManagement";
import { theme } from "../../theme/theme";

// Placeholder components for sub-pages
const Overview = () => (
  <div className="p-6">
    <h3 className="text-lg font-bold mb-4">Dashboard Overview</h3>
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
        <p className="text-gray-500 text-sm">Total Sales</p>
        <p className="text-2xl font-bold mt-2">$0</p>
      </div>
      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
        <p className="text-gray-500 text-sm">Active Orders</p>
        <p className="text-2xl font-bold mt-2">0</p>
      </div>
      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
        <p className="text-gray-500 text-sm">Staff Online</p>
        <p className="text-2xl font-bold mt-2">0</p>
      </div>
    </div>
  </div>
);

const Profile = () => (
  <div className="p-6">
    <h3 className="text-lg font-bold mb-4">Profile Settings</h3>
    <p>Profile update form will go here.</p>
  </div>
);

const Admin = () => {
  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header title="Admin Dashboard" />
        <main
          className="flex-1 overflow-x-hidden overflow-y-auto"
          style={{ backgroundColor: theme.colors.background }}
        >
          <Routes>
            <Route path="/" element={<Overview />} />
            <Route path="floors" element={<FloorManagement />} />
            <Route
              path="cashier"
              element={<StaffManagement role="cashier" />}
            />
            <Route
              path="kitchen"
              element={<StaffManagement role="kitchen" />}
            />
            <Route path="profile" element={<Profile />} />
            <Route path="*" element={<Navigate to="/admin" replace />} />
          </Routes>
        </main>
      </div>
    </div>
  );
};

export default Admin;
