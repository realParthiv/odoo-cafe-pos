import React from "react";
import { BrowserRouter } from "react-router-dom";
import RootNavigation from "./Navigation/RootNavigation";
import { AuthProvider } from "./context/AuthContext";

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <RootNavigation />
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
