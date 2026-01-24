import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import Kitchen from "../pages/Kitchen/Kitchen";

const KitchenNavigation = () => {
  return (
    <Routes>
      <Route path="/kitchen" element={<Kitchen />} />
      <Route path="*" element={<Navigate to="/kitchen" replace />} />
    </Routes>
  );
};

export default KitchenNavigation;
