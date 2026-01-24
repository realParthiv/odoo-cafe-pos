import React, { useState } from 'react';
import { FLOOR_PLANS, TABLE_STATUSES } from '../../constants/mockData';

const FloorPlan = () => {
  const [selectedFloor, setSelectedFloor] = useState(FLOOR_PLANS[0]);
  const [selectedTables, setSelectedTables] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    table_number: '',
    seats: 4,
    active: true,
  });

  const handleTableSelect = (tableId) => {
    setSelectedTables(prev =>
      prev.includes(tableId)
        ? prev.filter(id => id !== tableId)
        : [...prev, tableId]
    );
  };

  const handleSelectAll = () => {
    if (selectedTables.length === selectedFloor.tables.length) {
      setSelectedTables([]);
    } else {
      setSelectedTables(selectedFloor.tables.map(t => t.id));
    }
  };

  const getStatusColor = (status) => {
    const statusObj = TABLE_STATUSES.find(s => s.value === status);
    return statusObj ? statusObj.color : '#999';
  };

  const handleAddTable = (e) => {
    e.preventDefault();
    console.log('Adding table:', formData);
    setShowForm(false);
    setFormData({ table_number: '', seats: 4, active: true });
  };

  return (
    <div className="floor-plan-container">
      <div className="floor-plan-header">
        <div className="header-left">
          <h2>Floor Plan</h2>
          <select
            className="floor-select"
            value={selectedFloor.id}
            onChange={(e) => {
              const floor = FLOOR_PLANS.find(f => f.id === parseInt(e.target.value));
              setSelectedFloor(floor);
              setSelectedTables([]);
            }}
          >
            {FLOOR_PLANS.map(floor => (
              <option key={floor.id} value={floor.id}>{floor.name}</option>
            ))}
          </select>
        </div>
        <div className="header-actions">
          {selectedTables.length > 0 && (
            <div className="selection-info">
              <span className="selection-badge">✕ {selectedTables.length} Selected</span>
              <button className="action-btn">
                ★ Action
              </button>
            </div>
          )}
          <button className="btn-new" onClick={() => setShowForm(true)}>
            + New
          </button>
        </div>
      </div>

      {showForm && (
        <div className="table-form-overlay">
          <div className="table-form">
            <div className="form-header">
              <h3>Add New Table</h3>
              <button className="close-btn" onClick={() => setShowForm(false)}>✕</button>
            </div>
            <form onSubmit={handleAddTable}>
              <div className="form-group">
                <label>Floor Name</label>
                <input type="text" value={selectedFloor.name} disabled />
              </div>
              <div className="form-group">
                <label>Point of Sale</label>
                <select>
                  <option>Odoo Cafe</option>
                </select>
              </div>
              <div className="form-group">
                <label>Table Number *</label>
                <input
                  type="text"
                  value={formData.table_number}
                  onChange={(e) => setFormData({ ...formData, table_number: e.target.value })}
                  required
                  placeholder="e.g., 101"
                />
              </div>
              <div className="form-group">
                <label>Seats</label>
                <input
                  type="number"
                  value={formData.seats}
                  onChange={(e) => setFormData({ ...formData, seats: parseInt(e.target.value) })}
                  min="1"
                />
              </div>
              <div className="form-group checkbox-group">
                <label>
                  <input
                    type="checkbox"
                    checked={formData.active}
                    onChange={(e) => setFormData({ ...formData, active: e.target.checked })}
                  />
                  Active
                </label>
              </div>
              <div className="form-actions">
                <button type="button" className="btn-cancel" onClick={() => setShowForm(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn-save">
                  Save
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="floor-plan-content">
        <div className="tables-toolbar">
          <label className="select-all">
            <input
              type="checkbox"
              checked={selectedTables.length === selectedFloor.tables.length}
              onChange={handleSelectAll}
            />
            Select All
          </label>
          <div className="status-legend">
            {TABLE_STATUSES.map(status => (
              <div key={status.value} className="legend-item">
                <span
                  className="status-dot"
                  style={{ backgroundColor: status.color }}
                ></span>
                <span>{status.label}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="tables-grid">
          {selectedFloor.tables.map(table => (
            <div
              key={table.id}
              className={`table-card ${selectedTables.includes(table.id) ? 'selected' : ''}`}
              style={{ borderColor: getStatusColor(table.status) }}
            >
              <div className="table-checkbox">
                <input
                  type="checkbox"
                  checked={selectedTables.includes(table.id)}
                  onChange={() => handleTableSelect(table.id)}
                />
              </div>
              <div className="table-info">
                <div className="table-number">Table {table.table_number}</div>
                <div className="table-seats">👥 {table.seats} seats</div>
                <div
                  className="table-status"
                  style={{ backgroundColor: getStatusColor(table.status) }}
                >
                  {table.status}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default FloorPlan;
