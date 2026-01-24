import React, { useState, useEffect } from 'react';
import { tableService } from '../../services/apiService';

const TableView = ({ onTableSelect }) => {
  const [floors, setFloors] = useState([]);
  const [selectedFloor, setSelectedFloor] = useState(null);
  const [selectedTable, setSelectedTable] = useState(null);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState('all');
  const [filteredTables, setFilteredTables] = useState([]);
  const [filtering, setFiltering] = useState(false);

  const fetchFloors = async () => {
    try {
      setLoading(true);
      const response = await tableService.getFloors();
      const data = response.data?.floors || [];
      setFloors(data);
      if (data.length > 0) {
        // Maintain selection if already made, else pick first
        if (selectedFloor) {
            const updated = data.find(f => f.id === selectedFloor.id);
            setSelectedFloor(updated || data[0]);
        } else {
            setSelectedFloor(data[0]);
        }
      }
    } catch (error) {
      console.error("Failed to fetch floors:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFloors();
  }, []);

  const handleRefresh = () => {
    if (filterStatus === 'all') {
      fetchFloors();
    } else {
      // Logic for refreshing filtered list is already in its useEffect
      setFilterStatus(prev => {
        const current = prev;
        setFilterStatus('all'); // Momentary toggle or just trigger fetch
        return current;
      });
    }
  };

  useEffect(() => {
    const fetchFilteredTables = async () => {
      if (filterStatus === 'all') {
        setFilteredTables([]);
        return;
      }

      try {
        setFiltering(true);
        const response = await tableService.getTables({ status: filterStatus });
        setFilteredTables(response.data.tables || []);
      } catch (error) {
        console.error("Failed to fetch filtered tables:", error);
      } finally {
        setFiltering(false);
      }
    };
    fetchFilteredTables();
  }, [filterStatus]);

  const displayTables = filterStatus === 'all' 
    ? (selectedFloor?.tables || []) 
    : filteredTables;

  const handleTableClick = (table) => {
    setSelectedTable(table);
    if (onTableSelect) {
      onTableSelect(table);
    }
  };

  if (loading) return <div className="loading-spinner">Loading Floor Plan...</div>;
  if (!selectedFloor) return <div className="no-data">No floor plan available.</div>;

  return (
    <div className="table-view-container">
      <div className="table-view-header">
        <h2>Floor View</h2>
        <div className="table-view-controls">
          <select
            className="floor-select-terminal"
            value={selectedFloor.id}
            onChange={(e) => {
              const floor = floors.find(f => f.id === parseInt(e.target.value));
              setSelectedFloor(floor);
              setSelectedTable(null);
            }}
            disabled={filterStatus !== 'all'}
          >
            {floors.map(floor => (
              <option key={floor.id} value={floor.id}>{floor.name}</option>
            ))}
          </select>
          <select 
            className="status-filter-terminal"
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
          >
            <option value="all">All Tables</option>
            <option value="available">Available</option>
            <option value="occupied">Occupied</option>
            <option value="reserved">Reserved</option>
          </select>
          <button className="btn-refresh-tables" onClick={handleRefresh} title="Sync Status">
            🔄
          </button>
        </div>
      </div>

      <div className="table-cards-grid">
        {filtering ? (
          <div className="loading-small">Filtering tables...</div>
        ) : displayTables.length > 0 ? (
          displayTables.map(table => (
            <div
              key={table.id}
              className={`table-card-terminal ${selectedTable?.id === table.id ? 'selected' : ''} ${table.status}`}
              onClick={() => handleTableClick(table)}
            >
              <div className="table-card-number">{table.table_number}</div>
              <div className="table-card-seats">
                <span className="seats-icon">👥</span>
                <span>{table.capacity} seats</span>
              </div>
              {table.status === 'available' && (
                <div className="table-card-badge available">Available</div>
              )}
              {table.status === 'occupied' && (
                <div className="table-card-badge occupied">Occupied</div>
              )}
              {table.status === 'reserved' && (
                <div className="table-card-badge reserved">Reserved</div>
              )}
            </div>
          ))
        ) : (
          <div className="no-data">No tables found for this filter.</div>
        )}
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
