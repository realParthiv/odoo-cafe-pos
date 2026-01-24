import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import Cashier from "../pages/Cashier/Cashier";

const CashierNavigation = () => {
  return (
    <Routes>
      <Route path="/cashier" element={<Cashier />} />
      <Route path="*" element={<Navigate to="/cashier" replace />} />
    </Routes>
  );
};

export default CashierNavigation;
