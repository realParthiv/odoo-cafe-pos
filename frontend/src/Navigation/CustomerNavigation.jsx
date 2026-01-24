import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import Customer from "../pages/Customer/Customer";

const CustomerNavigation = () => {
  return (
    <Routes>
      <Route path="/customer" element={<Customer />} />
      <Route path="*" element={<Navigate to="/customer" replace />} />
    </Routes>
  );
};

export default CustomerNavigation;
