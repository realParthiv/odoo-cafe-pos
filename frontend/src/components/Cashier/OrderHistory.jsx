import React, { useState } from 'react';

const OrderHistory = () => {
  const [orders] = useState([
    { id: 'ORD-001', table: 'Table 1', customer: 'Walk-in', amount: 45.50, status: 'paid', date: '2025-01-24 10:30' },
    { id: 'ORD-002', table: 'Table 3', customer: 'John Doe', amount: 120.00, status: 'kitchen', date: '2025-01-24 11:15' },
    { id: 'ORD-003', table: 'Table 5', customer: 'Jane Smith', amount: 32.75, status: 'draft', date: '2025-01-24 11:45' },
    { id: 'ORD-004', table: 'Table 2', customer: 'Walk-in', amount: 15.00, status: 'paid', date: '2025-01-24 09:20' },
    { id: 'ORD-005', table: 'Table 4', customer: 'VIP Guest', amount: 85.20, status: 'kitchen', date: '2025-01-24 12:00' },
  ]);

  const [selectedOrder, setSelectedOrder] = useState(null);

  const getStatusColor = (status) => {
    switch (status) {
      case 'paid': return '#27ae60';
      case 'kitchen': return '#f39c12';
      case 'draft': return '#3498db'; // Blue for draft/new
      case 'cancelled': return '#e74c3c';
      default: return '#7f8c8d';
    }
  };

  return (
    <div className="order-history-container">
      <div className="orders-list-panel">
        <div className="orders-header">
          <h3>Recent Orders</h3>
          <div className="orders-filter">
            <input type="text" placeholder="Search orders..." />
          </div>
        </div>
        <div className="orders-list">
          {orders.map(order => (
            <div 
              key={order.id} 
              className={`order-item-card ${selectedOrder?.id === order.id ? 'active' : ''}`}
              onClick={() => setSelectedOrder(order)}
            >
              <div className="order-card-header">
                <span className="order-id">{order.id}</span>
                <span className="order-amount">${order.amount.toFixed(2)}</span>
              </div>
              <div className="order-card-details">
                <span>{order.table}</span>
                <span>{order.time}</span>
              </div>
              <div className="order-status-badge" style={{ backgroundColor: getStatusColor(order.status) }}>
                {order.status.toUpperCase()}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="order-preview-panel">
        {selectedOrder ? (
          <div className="order-detail-view">
            <div className="detail-header">
              <h2>Order Details</h2>
              <span className="detail-id">{selectedOrder.id}</span>
            </div>
            <div className="detail-info-grid">
              <div className="info-group">
                <label>Customer</label>
                <span>{selectedOrder.customer}</span>
              </div>
              <div className="info-group">
                <label>Table</label>
                <span>{selectedOrder.table}</span>
              </div>
              <div className="info-group">
                <label>Date</label>
                <span>{selectedOrder.date}</span>
              </div>
              <div className="info-group">
                <label>Status</label>
                <span className="status-text" style={{ color: getStatusColor(selectedOrder.status) }}>
                  {selectedOrder.status.toUpperCase()}
                </span>
              </div>
            </div>
            
            <div className="detail-lines">
              <h4>Order Items</h4>
              {/* Mock items for now */}
              <div className="detail-line-item">
                <span>1 x Burger</span>
                <span>$15.00</span>
              </div>
              <div className="detail-line-item">
                <span>2 x Coffee</span>
                <span>$10.00</span>
              </div>
              <div className="detail-total">
                <span>Total</span>
                <span>${selectedOrder.amount.toFixed(2)}</span>
              </div>
            </div>

            <div className="detail-actions">
              <button className="btn-reprint">Print Receipt</button>
              {selectedOrder.status === 'draft' && (
                <button className="btn-resume">Resume Order</button>
              )}
            </div>
          </div>
        ) : (
          <div className="no-selection-placeholder">
            <p>Select an order to view details</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default OrderHistory;
