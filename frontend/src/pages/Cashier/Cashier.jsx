import React, { useState, useEffect } from "react";
import SessionSelection from "../../components/Cashier/SessionSelection";
import POSTerminal from "../../components/Cashier/POSTerminal";
import CashierSettings from "../../components/Cashier/CashierSettings";
import { sessionService } from "../../services/apiService";
import "../../styles/cashier.css";

const Cashier = () => {
  const [currentSession, setCurrentSession] = useState(null);
  const [showSettings, setShowSettings] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkSession = async () => {
      try {
        const session = await sessionService.getCurrentSession();
        setCurrentSession(session);
      } catch (error) {
        console.log('No active session');
      } finally {
        setLoading(false);
      }
    };
    checkSession();
  }, []);

  const handleSessionOpen = (session) => {
    setCurrentSession(session);
    console.log('Session opened:', session);
  };

  const handleCloseSession = async () => {
    if (window.confirm('Are you sure you want to close the current session?')) {
      try {
        await sessionService.closeSession(currentSession.id, {
          closing_cash: 0, // Should probably prompt for this
          notes: "Closed by user"
        });
        setCurrentSession(null);
        setShowSettings(false);
      } catch (error) {
        console.error("Failed to close session:", error);
        alert("Failed to close session");
      }
    }
  };

  if (loading) return <div className="loading-spinner">Initializing Session...</div>;

  // If no session is open, show session selection
  if (!currentSession) {
    return <SessionSelection onSessionOpen={handleSessionOpen} />;
  }

  // Once session is open, show the POS terminal with tabs
  return (
    <div className="cashier-container">
      <header className="cashier-header-simple">
        <div className="header-left">
          <h1 className="logo">Odoo Cafe POS</h1>
          <button 
            className={`btn-settings ${showSettings ? 'active' : ''}`}
            onClick={() => setShowSettings(!showSettings)}
          >
            {showSettings ? '🔙 Back to POS' : '⚙️ Settings'}
          </button>
        </div>
        <div className="header-right">
          <div className="session-info">
            <span className="session-label">Session:</span>
            <span className="session-status">{currentSession.status}</span>
          </div>
          <div className="cashier-info">
            <span className="cashier-icon">👤</span>
            <span className="cashier-name">{currentSession.cashier_name}</span>
          </div>
          <button className="btn-close-session" onClick={handleCloseSession}>
            Close Session
          </button>
        </div>
      </header>

      <main className="cashier-main-simple">
        {showSettings ? (
          <CashierSettings />
        ) : (
          <POSTerminal session={currentSession} />
        )}
      </main>
    </div>
  );
};

export default Cashier;
