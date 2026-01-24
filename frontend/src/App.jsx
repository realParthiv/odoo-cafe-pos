import React from "react";
import { BrowserRouter } from "react-router-dom";
import AuthNavigation from "./Navigation/AuthNavigation";

function App() {
  return (
    <BrowserRouter>
      <AuthNavigation />

    </BrowserRouter>
  );
}

export default App;
