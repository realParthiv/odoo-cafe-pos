import React, { useState } from 'react';
import MobileOrderSettings from './MobileOrderSettings';
import ProductsList from './ProductsList';
import FloorConfiguration from './FloorConfiguration';

const CashierSettings = () => {
  const [activeSetting, setActiveSetting] = useState('mobile');

  return (
    <div className="cashier-settings-wrapper">
      <div className="settings-sidebar">
        <h3 className="settings-title">Configuration</h3>
        <nav className="settings-nav">
          <button 
            className={`settings-nav-item ${activeSetting === 'mobile' ? 'active' : ''}`}
            onClick={() => setActiveSetting('mobile')}
          >
            📱 Mobile Order
          </button>
          <button 
            className={`settings-nav-item ${activeSetting === 'products' ? 'active' : ''}`}
            onClick={() => setActiveSetting('products')}
          >
            📦 Product Creation
          </button>
          <button 
            className={`settings-nav-item ${activeSetting === 'floor' ? 'active' : ''}`}
            onClick={() => setActiveSetting('floor')}
          >
            🪑 Floor Configuration
          </button>
        </nav>
      </div>
      
      <div className="settings-content-area">
        {activeSetting === 'mobile' && <MobileOrderSettings />}
        {activeSetting === 'products' && <ProductsList />}
        {activeSetting === 'floor' && <FloorConfiguration />}
      </div>
    </div>
  );
};

export default CashierSettings;
