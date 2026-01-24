import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import Admin from "../pages/Admin/Admin";

const AdminNavigation = () => {
  return (
    <Routes>
      <Route path="/admin" element={<Admin />} />
      <Route path="*" element={<Navigate to="/admin" replace />} />
    </Routes>
  );
};

export default AdminNavigation;
