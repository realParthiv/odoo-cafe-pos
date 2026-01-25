import React, { useState, useEffect } from "react";
import {
  Routes,
  Route,
  Navigate,
  useLocation,
  useNavigate,
} from "react-router-dom";
import SessionSelection from "../../components/Cashier/SessionSelection";
import TableView from "../../components/Cashier/TableView";
import POSView from "../../components/Cashier/POSView";
import OrderHistory from "../../components/Cashier/OrderHistory";
import MobileOrderSettings from "../../components/Cashier/MobileOrderSettings";
import ProductsList from "../../components/Cashier/ProductsList";
import FloorConfiguration from "../../components/Cashier/FloorConfiguration";
import CashierProfile from "../../components/Cashier/CashierProfile";
import Sidebar from "../../components/Sidebar";
import Header from "../../components/Header";
import { sessionService } from "../../services/apiService";
import { theme } from "../../theme/theme";
import "../../styles/cashier.css";

const Cashier = () => {
  const [currentSession, setCurrentSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [selectedTable, setSelectedTable] = useState(null);
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    const checkSession = async () => {
      try {
        const response = await sessionService.getCurrentSession();
        // Handle nested data structure if present
        const sessionData = response.data || response;
        setCurrentSession(sessionData);
      } catch (error) {
        console.log("No active session");
      } finally {
        setLoading(false);
      }
    };
    checkSession();
  }, []);

  const handleSessionOpen = (session) => {
    // Handle nested data structure if present (from openSession response)
    const sessionData = session.data || session;
    setCurrentSession(sessionData);
  };

  const handleCloseSession = async () => {
    if (window.confirm("Are you sure you want to close the current session?")) {
      try {
        await sessionService.closeSession(currentSession.id, {
          closing_cash: 0, // Should probably prompt for this
          notes: "Closed by user",
        });
        setCurrentSession(null);
      } catch (error) {
        console.error("Failed to close session:", error);
        alert("Failed to close session");
      }
    }
  };

  const handleTableSelect = (table) => {
    setSelectedTable(table);
    navigate("/cashier/register");
  };

  const getPageTitle = () => {
    switch (location.pathname) {
      case "/cashier":
        return "Tables";
      case "/cashier/register":
        return selectedTable
          ? `Register - Table ${selectedTable.table_number}`
          : "Register";
      case "/cashier/orders":
        return "Order History";
      case "/cashier/mobile-orders":
        return "Mobile Order Settings";
      case "/cashier/products":
        return "Product Creation";
      case "/cashier/floors":
        return "Floor Configuration";
      case "/cashier/profile":
        return "My Profile";
      default:
        return "Cashier Portal";
    }
  };

  if (loading)
    return <div className="loading-spinner">Initializing Session...</div>;

  // If no session is open, show session selection
  if (!currentSession) {
    return <SessionSelection onSessionOpen={handleSessionOpen} />;
  }

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar
        role="cashier"
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
        onCloseSession={handleCloseSession}
      />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header
          title={getPageTitle()}
          onMenuClick={() => setIsSidebarOpen(true)}
        />
        <main
          className="flex-1 overflow-x-hidden overflow-y-auto"
          style={{ backgroundColor: theme.colors.background }}
        >
          <Routes>
            <Route
              path="/"
              element={
                <TableView
                  onTableSelect={handleTableSelect}
                  floorId={currentSession?.floor}
                />
              }
            />
            <Route
              path="/register"
              element={
                selectedTable ? (
                  <POSView selectedTable={selectedTable} />
                ) : (
                  <Navigate to="/cashier" replace />
                )
              }
            />
            <Route path="/orders" element={<OrderHistory />} />
            <Route path="/mobile-orders" element={<MobileOrderSettings />} />
            <Route path="/products" element={<ProductsList />} />
            <Route path="/floors" element={<FloorConfiguration />} />
            <Route path="/profile" element={<CashierProfile />} />
            <Route path="*" element={<Navigate to="/cashier" replace />} />
          </Routes>
        </main>
      </div>
    </div>
  );
};

export default Cashier;
