import React, { useState } from 'react';
import { FLOOR_PLANS } from '../../constants/mockData';

const TableView = ({ onTableSelect }) => {
  const [selectedFloor, setSelectedFloor] = useState(FLOOR_PLANS[0]);
  const [selectedTable, setSelectedTable] = useState(null);

  const handleTableClick = (table) => {
    setSelectedTable(table);
    if (onTableSelect) {
      onTableSelect(table);
    }
  };

  return (
    <div className="table-view-container">
      <div className="table-view-header">
        <h2>Floor View</h2>
        <select
          className="floor-select-terminal"
          value={selectedFloor.id}
          onChange={(e) => {
            const floor = FLOOR_PLANS.find(f => f.id === parseInt(e.target.value));
            setSelectedFloor(floor);
            setSelectedTable(null);
          }}
        >
          {FLOOR_PLANS.map(floor => (
            <option key={floor.id} value={floor.id}>{floor.name}</option>
          ))}
        </select>
      </div>

      <div className="table-cards-grid">
        {selectedFloor.tables.map(table => (
          <div
            key={table.id}
            className={`table-card-terminal ${selectedTable?.id === table.id ? 'selected' : ''} ${table.status}`}
            onClick={() => handleTableClick(table)}
          >
            <div className="table-card-number">{table.table_number}</div>
            <div className="table-card-seats">
              <span className="seats-icon">👥</span>
              <span>{table.seats} seats</span>
            </div>
            {table.status === 'occupied' && (
              <div className="table-card-badge occupied">Occupied</div>
            )}
            {table.status === 'reserved' && (
              <div className="table-card-badge reserved">Reserved</div>
            )}
          </div>
        ))}
      </div>

      {selectedTable && (
        <div className="selected-table-info">
          <p>Selected: Table {selectedTable.table_number}</p>
          <button className="btn-open-table" onClick={() => onTableSelect(selectedTable)}>
            Open Table
          </button>
        </div>
      )}
    </div>
  );
};

export default TableView;
