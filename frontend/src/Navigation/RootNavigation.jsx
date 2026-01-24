import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import Login from "../pages/Auth/Login";
import Register from "../pages/Auth/Register";
import SetPassword from "../pages/Auth/SetPassword";
import Admin from "../pages/Admin/Admin";
import Cashier from "../pages/Cashier/Cashier";
import Kitchen from "../pages/Kitchen/Kitchen";
import Customer from "../pages/Customer/Customer";

const RootNavigation = () => {
  const { role } = useAuth();

  const renderNavigation = () => {
    switch (role) {
      case "admin":
        return (
          <Routes>
            <Route path="/admin/*" element={<Admin />} />
            <Route path="*" element={<Navigate to="/admin" replace />} />
          </Routes>
        );
      case "cashier":
        return (
          <Routes>
            <Route path="/cashier" element={<Cashier />} />
            <Route path="*" element={<Navigate to="/cashier" replace />} />
          </Routes>
        );
      case "kitchen":
        return (
          <Routes>
            <Route path="/kitchen" element={<Kitchen />} />
            <Route path="*" element={<Navigate to="/kitchen" replace />} />
          </Routes>
        );
      case "customer":
        return (
          <Routes>
            <Route path="/customer" element={<Customer />} />
            <Route path="*" element={<Navigate to="/customer" replace />} />
          </Routes>
        );
      default:
        return (
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/auth/set-password" element={<SetPassword />} />
            <Route path="*" element={<Navigate to="/login" replace />} />
          </Routes>
        );
    }
  };

  return <div>{renderNavigation()}</div>;
};

export default RootNavigation;
