import React from 'react';

const CashierLayout = ({ children, activeView, onViewChange, session, onCloseSession }) => {
  return (
    <div className="cashier-layout">
      {/* Header */}
      <header className="cashier-header">
        <div className="header-left">
          <h1 className="logo">Odoo Cafe POS</h1>
          <nav className="main-nav">
            <button
              className={`nav-btn ${activeView === 'floor-plan' ? 'active' : ''}`}
              onClick={() => onViewChange('floor-plan')}
            >
              Floor Plan
            </button>
            <button
              className={`nav-btn ${activeView === 'pos' ? 'active' : ''}`}
              onClick={() => onViewChange('pos')}
            >
              POS
            </button>
            <button
              className={`nav-btn ${activeView === 'products' ? 'active' : ''}`}
              onClick={() => onViewChange('products')}
            >
              Products
            </button>
            <button
              className={`nav-btn ${activeView === 'orders' ? 'active' : ''}`}
              onClick={() => onViewChange('orders')}
            >
              Orders
            </button>
          </nav>
        </div>
        <div className="header-right">
          {session && (
            <>
              <div className="session-info">
                <span className="session-label">Session:</span>
                <span className="session-status">{session.status}</span>
              </div>
              <div className="cashier-info">
                <span className="cashier-icon">👤</span>
                <span className="cashier-name">{session.cashier_name}</span>
              </div>
              <button className="btn-close-session" onClick={onCloseSession}>
                Close Session
              </button>
            </>
          )}
        </div>
      </header>

      {/* Main Content */}
      <main className="cashier-main">
        {children}
      </main>
    </div>
  );
};

export default CashierLayout;
