import React, { useState, useEffect } from 'react';
import { sessionService } from '../../services/apiService';

const SessionSelection = ({ onSessionOpen }) => {
  const [startingCash, setStartingCash] = useState('1000');
  const [showOpenForm, setShowOpenForm] = useState(false);
  const [lastSession, setLastSession] = useState(null);

  useEffect(() => {
    const fetchLastSession = async () => {
      try {
        const data = await sessionService.getLastSession();
        setLastSession(data.data);
      } catch (error) {
        console.log("No previous session found");
      }
    };
    fetchLastSession();
  }, []);

  const handleOpenSession = async () => {
    if (!startingCash || parseFloat(startingCash) < 0) {
      alert('Please enter a valid starting cash amount');
      return;
    }

    try {
      const response = await sessionService.openSession({
        starting_cash: parseFloat(startingCash)
      });
      onSessionOpen(response.data);
    } catch (error) {
      console.error("Failed to open session:", error);
      alert("Failed to open session: " + (error.message || "Unknown error"));
    }
  };

  return (
    <div className="session-selection-container">
      <div className="session-selection-content">
        <h1 className="session-title">Point of Sale</h1>
        
        <div className="session-card">
          <div className="session-card-header">
            <h2>{lastSession?.restaurant_name || 'Odoo Cafe'}</h2>
          </div>
          <div className="session-card-body">
            <div className="session-info-row">
              <span className="info-label">Last open:</span>
              <span className="info-value">
                {lastSession?.start_time ? new Date(lastSession.start_time).toLocaleDateString() : 'N/A'}
              </span>
            </div>
            <div className="session-info-row">
              <span className="info-label">Closing balance:</span>
              <span className="info-value">
                {lastSession?.closing_cash ? `$${lastSession.closing_cash}` : 'N/A'}
              </span>
            </div>
          </div>
          <div className="session-card-footer">
            {!showOpenForm ? (
              <button 
                className="btn-open-session"
                onClick={() => setShowOpenForm(true)}
              >
                Open Session
              </button>
            ) : (
              <div className="open-session-form">
                <div className="form-group">
                  <label>Starting Cash Amount:</label>
                  <input
                    type="number"
                    className="cash-input"
                    value={startingCash}
                    onChange={(e) => setStartingCash(e.target.value)}
                    placeholder="Enter starting cash"
                    min="0"
                    step="0.01"
                  />
                </div>
                <div className="form-actions">
                  <button 
                    className="btn-cancel-session"
                    onClick={() => setShowOpenForm(false)}
                  >
                    Cancel
                  </button>
                  <button 
                    className="btn-confirm-session"
                    onClick={handleOpenSession}
                  >
                    Confirm & Open
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SessionSelection;
