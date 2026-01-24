import React, { useState } from 'react';

const FloorConfiguration = () => {
  const [floorName, setFloorName] = useState('Ground Floor');
  const [posName, setPosName] = useState('Odoo Cafe');
  const [selectedTables, setSelectedTables] = useState([]);
  
  const [tables, setTables] = useState([
    { id: 101, number: '101', seats: 5, active: true, resource: 'Table 3 (Seating 2)' },
    { id: 102, number: '102', seats: 8, active: false, resource: 'Table 3 (Seating 2)' },
    { id: 103, number: '101', seats: 5, active: true, resource: 'Table 3 (Seating 2)' },
    { id: 104, number: '102', seats: 8, active: true, resource: 'Table 3 (Seating 2)' },
  ]);

  const handleSelectTable = (id) => {
    setSelectedTables(prev => 
      prev.includes(id) ? prev.filter(tid => tid !== id) : [...prev, id]
    );
  };

  const handleSelectAll = (e) => {
    if (e.target.checked) {
      setSelectedTables(tables.map(t => t.id));
    } else {
      setSelectedTables([]);
    }
  };

  const handleDeleteSelected = () => {
    if (window.confirm(`Delete ${selectedTables.length} tables?`)) {
      setTables(tables.filter(t => !selectedTables.includes(t.id)));
      setSelectedTables([]);
    }
  };

  const handleDuplicateSelected = () => {
    const newTables = [...tables];
    selectedTables.forEach(id => {
      const original = tables.find(t => t.id === id);
      if (original) {
        newTables.push({
          ...original,
          id: Math.max(...newTables.map(t => t.id), 0) + 1,
          number: `${original.number} (Copy)`
        });
      }
    });
    setTables(newTables);
    setSelectedTables([]);
  };

  const handleAddTable = () => {
    const newId = tables.length > 0 ? Math.max(...tables.map(t => t.id)) + 1 : 101;
    setTables([...tables, { 
      id: newId, 
      number: '', 
      seats: 2, 
      active: true, 
      resource: '' 
    }]);
  };

  const handleTableChange = (id, field, value) => {
    setTables(tables.map(t => t.id === id ? { ...t, [field]: value } : t));
  };

  return (
    <div className="floor-config-container">
      <div className="config-header">
        <h2>Floor Configuration</h2>
        {selectedTables.length > 0 && (
          <div className="bulk-actions">
            <span className="selection-count">{selectedTables.length} Selected</span>
            <div className="action-buttons">
              <button className="btn-bulk-action" onClick={handleDuplicateSelected}>
                📄 Duplicate
              </button>
              <button className="btn-bulk-action delete" onClick={handleDeleteSelected}>
                🗑️ Delete
              </button>
            </div>
          </div>
        )}
      </div>

      <div className="config-form">
        <div className="form-row">
          <div className="input-group">
            <label>Floor Name</label>
            <input 
              type="text" 
              value={floorName}
              onChange={(e) => setFloorName(e.target.value)}
              className="input-underlined"
            />
          </div>
          <div className="input-group">
            <label>Point Of Sale</label>
            <div className="value-display">{posName}</div>
          </div>
        </div>

        <div className="table-list-section">
          <table className="config-table">
            <thead>
              <tr>
                <th className="checkbox-col">
                  <input 
                    type="checkbox" 
                    onChange={handleSelectAll}
                    checked={selectedTables.length === tables.length && tables.length > 0}
                  />
                </th>
                <th>Table Number</th>
                <th>Seats</th>
                <th>Active</th>
                <th>Appointment Resource</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {tables.map(table => (
                <tr key={table.id} className={selectedTables.includes(table.id) ? 'selected' : ''}>
                  <td className="checkbox-col">
                    <input 
                      type="checkbox" 
                      checked={selectedTables.includes(table.id)}
                      onChange={() => handleSelectTable(table.id)}
                    />
                  </td>
                  <td>
                    <input 
                      type="text" 
                      value={table.number}
                      onChange={(e) => handleTableChange(table.id, 'number', e.target.value)}
                      className="table-input"
                      placeholder="e.g. 105"
                    />
                  </td>
                  <td>
                    <input 
                      type="number" 
                      value={table.seats}
                      onChange={(e) => handleTableChange(table.id, 'seats', parseInt(e.target.value) || 0)}
                      className="table-input small"
                    />
                  </td>
                  <td>
                    <div 
                      className={`status-toggle ${table.active ? 'active' : ''}`}
                      onClick={() => handleTableChange(table.id, 'active', !table.active)}
                    >
                      <div className="toggle-handle"></div>
                    </div>
                  </td>
                  <td>
                    <input 
                      type="text"
                      value={table.resource}
                      onChange={(e) => handleTableChange(table.id, 'resource', e.target.value)}
                      className="table-input"
                      placeholder="Optional resource"
                    />
                  </td>
                  <td className="action-col">
                    <button className="btn-icon">⋮</button>
                  </td>
                </tr>
              ))}
              <tr className="add-row">
                <td colSpan="6">
                  <button className="btn-add-line" onClick={handleAddTable}>Add a line</button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default FloorConfiguration;
