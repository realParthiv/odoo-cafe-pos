import React, { useState, useEffect } from 'react';
import { orderService } from '../../services/apiService';

const OrderHistory = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedOrder, setSelectedOrder] = useState(null);

  const fetchOrders = async (search = '') => {
    try {
      setLoading(true);
      const params = {};
      if (search) params.search = search;
      const response = await orderService.getOrders(params);
      console.log("Orders API Response:", response);
      // Handle both paginated results and direct data.orders if any
      const data = response?.results || response?.data?.orders || response?.orders || [];
      setOrders(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Failed to fetch orders:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchOrders(searchTerm);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  const getStatusColor = (status) => {
    switch (status) {
      case 'paid':
      case 'completed': return '#27ae60';
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
            <input 
              type="text" 
              placeholder="Search order #..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
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
                <span className="order-id">{order.order_number}</span>
                <span className="order-amount">${parseFloat(order.total_amount).toFixed(2)}</span>
              </div>
              <div className="order-card-details">
                <span>Table: {order.table_number || 'N/A'}</span>
                <span>{new Date(order.created_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
              </div>
              <div className="order-status-badge" style={{ backgroundColor: getStatusColor(order.status) }}>
                {order.status.toUpperCase()}
              </div>
            </div>
          ))}
          {loading && orders.length === 0 && <div className="loading-small">Loading...</div>}
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
                <span>{selectedOrder.customer_name || 'Walk-in'}</span>
              </div>
              <div className="info-group">
                <label>Table</label>
                <span>{selectedOrder.table_number || 'N/A'}</span>
              </div>
              <div className="info-group">
                <label>Date</label>
                <span>{new Date(selectedOrder.created_at).toLocaleString()}</span>
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
              {selectedOrder.lines?.map((line, idx) => (
                <div key={idx} className="detail-line-item">
                  <span>{line.quantity} x {line.product_name}</span>
                  <span>${parseFloat(line.price_subtotal).toFixed(2)}</span>
                </div>
              ))}
              <div className="detail-total">
                <span>Total</span>
                <span>${parseFloat(selectedOrder.total_amount).toFixed(2)}</span>
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
