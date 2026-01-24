import React, { useState } from 'react';
import TableView from './TableView';
import POSView from './POSView';
import OrderHistory from './OrderHistory';

const POSTerminal = () => {
  const [activeTab, setActiveTab] = useState('table');
  const [selectedTable, setSelectedTable] = useState(null);

  const handleTableSelect = (table) => {
    setSelectedTable(table);
    // Automatically switch to Register tab when table is selected
    setActiveTab('register');
  };

  return (
    <div className="pos-terminal-container">
      <div className="pos-terminal-tabs">
        <button
          className={`terminal-tab ${activeTab === 'table' ? 'active' : ''}`}
          onClick={() => setActiveTab('table')}
        >
          Table
        </button>
        <button
          className={`terminal-tab ${activeTab === 'register' ? 'active' : ''}`}
          onClick={() => setActiveTab('register')}
        >
          Register
        </button>
        <button
          className={`terminal-tab ${activeTab === 'orders' ? 'active' : ''}`}
          onClick={() => setActiveTab('orders')}
        >
          Orders
        </button>
      </div>

      <div className="pos-terminal-content">
        {activeTab === 'table' && (
          <TableView onTableSelect={handleTableSelect} />
        )}
        
        {activeTab === 'register' && (
          <div className="register-view">
            {selectedTable && (
              <div className="selected-table-banner">
                <span>Table: {selectedTable.table_number}</span>
                <button 
                  className="btn-change-table"
                  onClick={() => setActiveTab('table')}
                >
                  Change Table
                </button>
              </div>
            )}
            <POSView selectedTable={selectedTable} />
          </div>
        )}
        
        {activeTab === 'orders' && (
          <OrderHistory />
        )}
      </div>
    </div>
  );
};

export default POSTerminal;
