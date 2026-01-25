import React, { useState, useEffect } from "react";
import { orderService } from "../../services/apiService";
import { Search } from "lucide-react";

const OrderHistory = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedOrder, setSelectedOrder] = useState(null);

  const fetchOrders = async (search = "") => {
    try {
      setLoading(true);
      const params = {};
      if (search) {
        params.search = search;
        params.q = search;
      }
      const response = await orderService.getOrders(params);
      console.log("Orders API Response:", response);
      const data =
        response?.results || response?.data?.orders || response?.orders || [];
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
      case "paid":
      case "completed":
        return "#27ae60";
      case "kitchen":
        return "#f39c12";
      case "draft":
        return "#3498db";
      case "cancelled":
        return "#e74c3c";
      default:
        return "#7f8c8d";
    }
  };

  const formatPrice = (price) => {
    const num = parseFloat(price);
    return isNaN(num) ? "0.00" : num.toFixed(2);
  };

  // Client-side filtering fallback
  const filteredOrders = orders.filter((order) => {
    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();
    return (
      order.order_number?.toLowerCase().includes(term) ||
      order.table_number?.toString().includes(term) ||
      order.customer_name?.toLowerCase().includes(term)
    );
  });

  return (
    <div className="order-history-container">
      <div className="orders-list-panel">
        <div className="orders-header">
          <h3>Order History</h3>
          <div className="orders-filter">
            <Search className="search-icon" size={20} />
            <input
              type="text"
              placeholder="Search order"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>
        <div className="orders-list">
          {filteredOrders.map((order) => (
            <div
              key={order.id}
              className={`order-item-card ${selectedOrder?.id === order.id ? "active" : ""}`}
              onClick={() => setSelectedOrder(order)}
            >
              <div className="order-card-main">
                <div className="order-card-top">
                  <span className="order-id">{order.order_number}</span>
                  <span className="order-time">
                    {new Date(order.created_at).toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </span>
                </div>
                <div className="order-card-bottom">
                  <span className="order-table-badge">
                    {order.table_number
                      ? `Table ${order.table_number}`
                      : "Takeaway"}
                  </span>
                  <span className="order-amount">
                    ${formatPrice(order.total_amount)}
                  </span>
                </div>
              </div>
              <div
                className="order-status-line"
                style={{ backgroundColor: getStatusColor(order.status) }}
              ></div>
            </div>
          ))}
          {loading && orders.length === 0 && (
            <div className="loading-small">Loading orders...</div>
          )}
          {!loading && orders.length === 0 && (
            <div className="no-data">No orders found.</div>
          )}
        </div>
      </div>

      <div className="order-preview-panel">
        {selectedOrder ? (
          <div className="order-detail-view">
            <div className="detail-header-premium">
              <div className="detail-header-left">
                <h2>Order Details</h2>
                <span className="detail-id-badge">
                  {selectedOrder.order_number}
                </span>
              </div>
            </div>

            <div className="detail-content-scroll">
              <div className="detail-info-grid-premium">
                <div className="info-card">
                  <label>Customer</label>
                  <span>
                    {selectedOrder.customer_name || "Walk-in Customer"}
                  </span>
                </div>
                <div className="info-card">
                  <label>Table / Type</label>
                  <span>
                    {selectedOrder.table_number
                      ? `Table ${selectedOrder.table_number}`
                      : "Takeaway"}
                  </span>
                </div>
                <div className="info-card">
                  <label>Date & Time</label>
                  <span>
                    {new Date(selectedOrder.created_at).toLocaleString()}
                  </span>
                </div>
              </div>

              <div className="detail-lines-premium">
                <h4>Order Items ({selectedOrder.lines?.length || 0})</h4>
                <div className="lines-list">
                  {selectedOrder.lines?.map((line, idx) => (
                    <div key={idx} className="detail-line-item-premium">
                      <div className="line-item-info">
                        <span className="line-qty">{line.quantity}x</span>
                        <span className="line-name">{line.product_name}</span>
                        {line.variant && (
                          <span className="line-variant">({line.variant})</span>
                        )}
                      </div>
                      <div className="line-item-price">
                        <span className="unit-price">
                          ${formatPrice(line.unit_price)}
                        </span>
                        <span className="total-price">
                          $
                          {formatPrice(line.total_price || line.price_subtotal)}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="detail-summary-premium">
                  <div className="summary-row">
                    <span>Subtotal</span>
                    <span>${formatPrice(selectedOrder.subtotal)}</span>
                  </div>
                  <div className="summary-row">
                    <span>Tax</span>
                    <span>${formatPrice(selectedOrder.tax_amount)}</span>
                  </div>
                  <div className="summary-row total">
                    <span>Total Amount</span>
                    <span>${formatPrice(selectedOrder.total_amount)}</span>
                  </div>
                </div>
              </div>
            </div>
            {/* No action buttons here as requested */}
          </div>
        ) : (
          <div className="no-selection-placeholder-premium">
            <div className="placeholder-icon">🧾</div>
            <h3>Select an Order</h3>
            <p>Choose an order from the list to view full details.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default OrderHistory;
