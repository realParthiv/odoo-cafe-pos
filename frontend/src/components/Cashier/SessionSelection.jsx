import React, { useState } from 'react';

const SessionSelection = ({ onSessionOpen }) => {
  const [startingCash, setStartingCash] = useState('1000');
  const [showOpenForm, setShowOpenForm] = useState(false);

  // Mock session data
  const sessionInfo = {
    name: 'Odoo Cafe',
    lastOpen: '01/01/2025',
    lastSale: '$5000',
  };

  const handleOpenSession = () => {
    if (!startingCash || parseFloat(startingCash) < 0) {
      alert('Please enter a valid starting cash amount');
      return;
    }

    const session = {
      id: Date.now(),
      cashier_id: 1,
      cashier_name: 'John Doe',
      start_time: new Date().toISOString(),
      starting_cash: parseFloat(startingCash),
      status: 'open',
    };

    onSessionOpen(session);
  };

  return (
    <div className="session-selection-container">
      <div className="session-selection-content">
        <h1 className="session-title">Point of Sale</h1>
        
        <div className="session-card">
          <div className="session-card-header">
            <h2>{sessionInfo.name}</h2>
          </div>
          <div className="session-card-body">
            <div className="session-info-row">
              <span className="info-label">Last open:</span>
              <span className="info-value">{sessionInfo.lastOpen}</span>
            </div>
            <div className="session-info-row">
              <span className="info-label">Last sale:</span>
              <span className="info-value">{sessionInfo.lastSale}</span>
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
