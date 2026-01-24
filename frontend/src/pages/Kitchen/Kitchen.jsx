import React, { useState, useEffect } from "react";
import { theme } from "../../theme/theme";
import { ordersService } from "../../services/apiService";
import { WS_URL } from "../../services/EndPoint";

const Kitchen = () => {
  const [orders, setOrders] = useState([]);
  const [draggedOrderId, setDraggedOrderId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const response = await ordersService.getKitchenOrders();
      let rawOrders = null;
      // Robust extraction strategies
      if (response?.data?.orders && Array.isArray(response.data.orders)) {
        rawOrders = response.data.orders;
      } else if (response?.orders && Array.isArray(response.orders)) {
        rawOrders = response.orders;
      } else if (Array.isArray(response)) {
        rawOrders = response;
      } else if (response?.data && Array.isArray(response.data)) {
        rawOrders = response.data;
      }

      if (rawOrders) {
        const mappedOrders = rawOrders.map(o => ({
          id: o.order_number || `#${o.id}`,
          originalId: o.id, // Store key for API
          ticketId: o.order_number || `#${o.id}`,
          table: o.table_number ? `Table ${o.table_number}` : (o.table || "Takeaway"),
          // Map 'lines' to 'items'
          items: o.lines ? o.lines.map(l => ({
            lineId: l.id,
            name: l.product_name || "Unknown Item",
            qty: l.quantity || 1,
            completed: l.status === 'ready'
          })) : [],
          // Map 'draft' -> 'to_cook'
          status: (o.status === 'draft' || o.status === 'to_cook') ? 'to_cook'
            : o.status === 'in_progress' ? 'preparing'
              : (o.status === 'ready' || o.status === 'completed') ? 'ready' // Map backend ready/completed -> ready column
                : 'to_cook',
          time: o.created_at ? new Date(o.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : "Now"
        }));
        setOrders(mappedOrders);
      } else {
        setOrders([]);
      }
    } catch (error) {
      console.error("API Error:", error);
      setError("Failed to connect to Kitchen API. Please check backend connection.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders(); // Initial fetch

    let ws;
    const connectWebSocket = () => {
      console.log("🔌 Connecting to WebSocket:", WS_URL);
      ws = new WebSocket(WS_URL);

      ws.onopen = () => {
        console.log("✅ WebSocket Connected");
        setError(null); // Clear errors on connection
      };

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          console.log("📩 WebSocket Message:", data);

          // Handle different message types if your backend sends them
          // Assuming the message contains the list of orders or a single order update
          if (data.type === 'orders_update' && Array.isArray(data.orders)) {
            // Re-use logic to map orders
            const rawOrders = data.orders;
            const mappedOrders = rawOrders.map(o => ({
              id: o.order_number || `#${o.id}`,
              originalId: o.id,
              ticketId: o.order_number || `#${o.id}`,
              table: o.table_number ? `Table ${o.table_number}` : (o.table || "Takeaway"),
              items: o.lines ? o.lines.map(l => ({
                lineId: l.id,
                name: l.product_name || "Unknown Item",
                qty: l.quantity || 1,
                completed: l.status === 'ready'
              })) : [],
              status: (o.status === 'draft' || o.status === 'to_cook') ? 'to_cook'
                : o.status === 'in_progress' ? 'preparing'
                  : (o.status === 'ready' || o.status === 'completed') ? 'ready'
                    : 'to_cook',
              time: o.created_at ? new Date(o.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : "Now"
            }));
            setOrders(mappedOrders);
          } else {
            // If the structure is unknown, just refresh from API for safety
            console.log("⚠️ Unknown WS message format, fetching fresh data...");
            fetchOrders();
          }

        } catch (err) {
          console.error("❌ Error process WebSocket message:", err);
        }
      };

      ws.onclose = () => {
        console.log("🔌 WebSocket Disconnected, retrying in 3s...");
        setTimeout(connectWebSocket, 3000); // Reconnect logic
      };

      ws.onerror = (err) => {
        console.error("❌ WebSocket Error:", err);
        ws.close();
      };
    };

    connectWebSocket();

    return () => {
      if (ws) ws.close();
    };
  }, []);

  // --- Handlers ---
  const moveOrder = (orderId, newStatus) => {
    if (!newStatus) return;
    setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status: newStatus } : o));
  };

  const toggleItemCompletion = async (orderId, idx, e) => {
    e.stopPropagation();
    const order = orders.find(o => o.id === orderId);
    if (!order) return;
    const item = order.items[idx];

    // Optimistic Update
    setOrders(prev => prev.map(o => {
      if (o.id !== orderId) return o;
      const newItems = [...o.items];
      newItems[idx] = { ...newItems[idx], completed: !newItems[idx].completed };
      return { ...o, items: newItems };
    }));

    try {
      const newStatus = !item.completed ? 'ready' : 'preparing';
      await ordersService.updateLineStatus(order.originalId, item.lineId, newStatus);
    } catch (err) {
      console.error("Failed to update status", err);
      fetchOrders();
    }
  };

  // --- Drag & Drop ---
  const handleDragStart = (e, orderId) => {
    setDraggedOrderId(orderId);
    e.dataTransfer.effectAllowed = "move";
  };
  const handleDragOver = (e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
  };
  const handleDrop = (e, targetStatus) => {
    e.preventDefault();
    if (draggedOrderId) {
      moveOrder(draggedOrderId, targetStatus);
      setDraggedOrderId(null);
    }
  };

  const Columns = [
    { id: "to_cook", label: "To Cook", color: theme.colors.status.danger, bg: "#FFF5F5" },
    { id: "preparing", label: "Preparing", color: theme.colors.status.warning, bg: "#FFF9E6" },
    { id: "ready", label: "Ready", color: theme.colors.status.success, bg: "#E8F5E9" }
  ];

  return (
    <div
      className="min-h-screen font-sans p-6 bg-gray-50"
      style={{ fontFamily: theme.fonts.primary }}
    >
      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold mb-1" style={{ color: theme.colors.text.primary }}>Kitchen Display</h1>
          <p className="text-sm font-medium" style={{ color: theme.colors.text.secondary }}>
            Live Order Management
          </p>
        </div>
        <div className="flex gap-4">
          {Columns.map(col => (
            <div key={col.id} className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-lg shadow-sm border border-gray-200">
              <div className="w-2 h-2 rounded-full" style={{ backgroundColor: col.color }}></div>
              <span className="text-sm font-semibold text-gray-600">{col.label}:</span>
              <span className="text-sm font-bold text-gray-900">
                {orders.filter(o => o.status === col.id).length}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6 flex items-center gap-2 shadow-sm">
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" /></svg>
          <span>{error}</span>
          <button onClick={fetchOrders} className="ml-auto text-sm font-bold underline hover:text-red-800">Retry</button>
        </div>
      )}

      {/* Kanban Board */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 h-[calc(100vh-140px)]">
        {Columns.map(col => (
          <div
            key={col.id}
            onDragOver={handleDragOver}
            onDrop={(e) => handleDrop(e, col.id)}
            className="flex flex-col rounded-lg overflow-hidden transition-colors border max-h-full bg-white shadow-sm"
            style={{
              borderColor: theme.colors.border
            }}
          >
            {/* Column Header */}
            <div
              className="px-4 py-3 flex items-center justify-between bg-gray-50 border-b"
              style={{ borderTop: `3px solid ${col.color}`, borderColor: theme.colors.border }}
            >
              <h2 className="font-bold text-lg" style={{ color: theme.colors.text.primary }}>{col.label}</h2>
              <span
                className="text-xs font-bold px-2 py-0.5 rounded-lg text-white"
                style={{ backgroundColor: col.color }}
              >
                {orders.filter(o => o.status === col.id).length}
              </span>
            </div>

            {/* Cards Container */}
            <div className="flex-1 overflow-y-auto p-3 space-y-3 bg-gray-50">
              {orders
                .filter(o => o.status === col.id)
                .map(order => {
                  const allItemsDone = order.items.every(i => i.completed);
                  return (
                    <div
                      key={order.id}
                      draggable
                      onDragStart={(e) => handleDragStart(e, order.id)}
                      className="bg-white rounded-lg p-4 shadow-sm hover:shadow-md transition-all cursor-move group relative border border-gray-200"
                      style={{
                        borderLeftWidth: '3px',
                        borderLeftColor: col.color,
                        opacity: draggedOrderId === order.id ? 0.5 : 1
                      }}
                    >
                      {/* Top Row: ID & Time */}
                      <div className="flex justify-between items-start mb-3">
                        <span className="font-bold text-lg tracking-tight text-gray-800">
                          {order.id}
                        </span>
                        <div className="flex flex-col items-end">
                          <span className="text-xs font-bold text-gray-400 bg-gray-50 px-1.5 py-0.5 rounded">
                            {order.time}
                          </span>
                          <span className="text-xs font-bold mt-1" style={{ color: theme.colors.accent }}>
                            {order.table}
                          </span>
                        </div>
                      </div>

                      {/* Items List */}
                      <div className="space-y-2 mb-3">
                        {order.items.map((item, idx) => (
                          <div
                            key={idx}
                            onClick={(e) => toggleItemCompletion(order.id, idx, e)}
                            className="flex justify-between items-center text-sm cursor-pointer hover:bg-gray-50 p-1 -mx-1 rounded"
                          >
                            <div className="flex items-center gap-2 overflow-hidden">
                              <div className={`w-1.5 h-1.5 rounded-full shrink-0 ${item.completed ? 'bg-green-400' : 'bg-gray-200'}`}></div>
                              <span className={`truncate ${item.completed ? 'line-through text-gray-400' : 'text-gray-700 font-medium'}`}>
                                {item.name}
                              </span>
                            </div>
                            <span className={`font-bold ml-2 ${item.completed ? 'text-gray-300' : 'text-gray-800'}`}>
                              x{item.qty}
                            </span>
                          </div>
                        ))}
                      </div>

                      {/* Footer Actions */}
                      <div className="pt-2 border-t border-gray-100 flex justify-between items-center">
                        <span className="text-[10px] text-gray-400 font-medium uppercase tracking-wider">
                          {allItemsDone ? "Wait Staff Notified" : "Preparing"}
                        </span>
                        {/* Optional Quick Move Button */}
                        {col.id !== 'ready' && (
                          <button
                            onClick={(e) => { e.stopPropagation(); moveOrder(order.id, col.id === 'to_cook' ? 'preparing' : 'ready'); }}
                            className="text-xs font-bold px-2 py-1 rounded text-white opacity-0 group-hover:opacity-100 transition-opacity"
                            style={{ backgroundColor: col.color }}
                          >
                            Next →
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}

              {orders.filter(o => o.status === col.id).length === 0 && (
                <div className="h-24 border-2 border-dashed border-gray-200 rounded-lg flex items-center justify-center text-gray-400 text-sm font-medium italic bg-white">
                  Empty {col.label}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Kitchen;
