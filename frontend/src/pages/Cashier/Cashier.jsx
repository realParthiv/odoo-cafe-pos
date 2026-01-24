import React, { useState } from "react";
import SessionSelection from "../../components/Cashier/SessionSelection";
import POSTerminal from "../../components/Cashier/POSTerminal";
import CashierSettings from "../../components/Cashier/CashierSettings";
import "../../styles/cashier.css";

const Cashier = () => {
  const [currentSession, setCurrentSession] = useState(null);
  const [showSettings, setShowSettings] = useState(false);

  const handleSessionOpen = (session) => {
    setCurrentSession(session);
    console.log('Session opened:', session);
  };

  const handleCloseSession = () => {
    if (window.confirm('Are you sure you want to close the current session?')) {
      setCurrentSession(null);
      setShowSettings(false);
    }
  };

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
