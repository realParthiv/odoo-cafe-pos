import React, { useState, useEffect } from "react";
import { theme } from "../../theme/theme";
import { ordersService } from "../../services/apiService";
import { WS_URL } from "../../services/EndPoint";
import { useAuth } from "../../context/AuthContext";

const Kitchen = () => {
  const { logout } = useAuth();
  const [orders, setOrders] = useState([]);
  const [draggedOrderId, setDraggedOrderId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      
      // We fetch from the main orders API because the kitchen viewset is strictly filtered
      const statusesToFetch = ['sent_to_kitchen', 'prepared', 'completed'];
      const responses = await Promise.all(
        statusesToFetch.map(s => ordersService.getOrders({ status: s }))
      );

      let allRawOrders = [];
      responses.forEach(resp => {
        // Handle differences in response formats (results vs array)
        const actualData = resp?.data || resp;
        const results = actualData?.results || (Array.isArray(actualData) ? actualData : (actualData?.orders || []));
        allRawOrders = [...allRawOrders, ...results];
      });

      // Remove duplicates just in case (e.g. if an order status changed during fetch)
      const uniqueOrders = Array.from(new Map(allRawOrders.map(o => [o.id, o])).values());

      if (uniqueOrders.length > 0) {
        const mappedOrders = uniqueOrders.map(o => ({
          id: o.order_number || `#${o.id}`,
          originalId: o.id,
          ticketId: o.order_number || `#${o.id}`,
          table: o.table_number ? `Table ${o.table_number}` : (o.table || "Takeaway"),
          items: (o.lines || []).map(l => ({
            lineId: l.id,
            name: l.product_name || "Unknown Item",
            qty: l.quantity || 1,
            completed: l.status === 'ready'
          })),
          status: o.status === 'sent_to_kitchen' ? 'to_cook'
            : o.status === 'prepared' ? 'preparing'
              : o.status === 'completed' ? 'ready'
                : 'to_cook',
          time: o.created_at ? new Date(o.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : "Now"
        }));
        setOrders(mappedOrders);
      } else {
        setOrders([]);
      }
    } catch (error) {
      setError("Failed to connect to Kitchen API. Please check backend connection.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();

    let ws;
    const connectWebSocket = () => {
      ws = new WebSocket(WS_URL);

      ws.onopen = () => setError(null);

      ws.onmessage = (event) => {
        try {
          const wsData = JSON.parse(event.data);
          let incomingOrders = null;

          // Robust parsing of WS message data (handles nested message.order or direct message)
          const msg = wsData.message || wsData;
          const payload = msg.data || msg;

          if (wsData.type === 'order.update' || wsData.type === 'order_update' || wsData.type === 'order_updated') {
            if (payload.order) incomingOrders = [payload.order];
            else if (payload.results) incomingOrders = payload.results;
            else if (Array.isArray(payload)) incomingOrders = payload;
          }

          if (incomingOrders) {
            const mappedUpdates = incomingOrders.map(o => ({
              id: o.order_number || `#${o.id}`,
              originalId: o.id,
              ticketId: o.order_number || `#${o.id}`,
              table: o.table_number ? `Table ${o.table_number}` : (o.table || "Takeaway"),
              items: (o.lines || []).map(l => ({
                lineId: l.id,
                name: l.product_name || "Unknown Item",
                qty: l.quantity || 1,
                completed: l.status === 'ready'
              })),
              status: o.status === 'sent_to_kitchen' ? 'to_cook'
                : o.status === 'prepared' ? 'preparing'
                  : o.status === 'completed' ? 'ready'
                    : 'to_cook',
              time: o.created_at ? new Date(o.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : "Now"
            }));

            setOrders(prev => {
              let updated = [...prev];
              mappedUpdates.forEach(newO => {
                const idx = updated.findIndex(p => p.id === newO.id);
                if (idx !== -1) updated[idx] = newO;
                else updated.push(newO);
              });
              return updated;
            });
          } else {
            fetchOrders();
          }
        } catch (err) {
          // Error handling
        }
      };

      ws.onclose = () => {
        setTimeout(connectWebSocket, 3000);
      };

      ws.onerror = (err) => {
        ws.close();
      };
    };

    connectWebSocket();

    return () => {
      if (ws) ws.close();
    };
  }, []);

  // --- Handlers ---
  const moveOrder = async (orderId, newStatus) => {
    if (!newStatus) return;

    const order = orders.find((o) => o.id === orderId);
    if (!order) return;

    // Optimistic Update
    setOrders((prev) =>
      prev.map((o) => (o.id === orderId ? { ...o, status: newStatus } : o)),
    );

    // Map frontend column to backend status: sent_to_kitchen, prepared, completed
    const backendStatus = newStatus === 'to_cook' ? 'sent_to_kitchen'
      : newStatus === 'preparing' ? 'prepared'
        : newStatus === 'ready' ? 'completed'
          : 'sent_to_kitchen';

    try {
      await ordersService.updateStatus(order.originalId, { status: backendStatus });
    } catch (err) {
      fetchOrders();
    }
  };

  const toggleItemCompletion = async (orderId, idx, e) => {
    e.stopPropagation();
    const order = orders.find((o) => o.id === orderId);
    if (!order) return;
    
    // Calculate new state for this item
    const newItems = [...order.items];
    const item = newItems[idx];
    item.completed = !item.completed;

    // Determine the overall order status to send
    let statusToUpdate = 'prepared';
    if (newItems.every(i => i.completed)) {
      statusToUpdate = 'completed';
    } else if (newItems.every(i => !i.completed)) {
      statusToUpdate = 'sent_to_kitchen';
    }

    // Optimistic Update
    setOrders(prev => prev.map(o => o.id === orderId ? { 
      ...o, 
      items: newItems,
      status: statusToUpdate === 'completed' ? 'ready' : (statusToUpdate === 'prepared' ? 'preparing' : 'to_cook')
    } : o));

    try {
      await ordersService.updateStatus(order.originalId, { status: statusToUpdate });
    } catch (err) {
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
    {
      id: "to_cook",
      label: "To Cook",
      color: theme.colors.status.danger,
      bg: "#FFF5F5",
    },
    {
      id: "preparing",
      label: "Preparing",
      color: theme.colors.status.warning,
      bg: "#FFF9E6",
    },
    {
      id: "ready",
      label: "Ready",
      color: theme.colors.status.success,
      bg: "#E8F5E9",
    },
  ];

  return (
    <div
      className="min-h-screen font-sans p-6 bg-gray-50"
      style={{ fontFamily: theme.fonts.primary }}
    >
      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1
            className="text-3xl font-bold mb-1"
            style={{ color: theme.colors.text.primary }}
          >
            Kitchen Display
          </h1>
          <p
            className="text-sm font-medium"
            style={{ color: theme.colors.text.secondary }}
          >
            Live Order Management
          </p>
        </div>
          <div className="flex gap-4 items-center">
          
          {Columns.map(col => (
            <div key={col.id} className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-lg shadow-sm border border-gray-200">
              <div className="w-2 h-2 rounded-full" style={{ backgroundColor: col.color }}></div>
              <span className="text-sm font-semibold text-gray-600">{col.label}:</span>
              <span className="text-sm font-bold text-gray-900">
                {orders.filter((o) => o.status === col.id).length}
              </span>
            </div>
          ))}
          <button 
            onClick={logout}
            className="px-4 py-2 bg-white text-gray-700 font-bold rounded-lg border border-gray-200 shadow-sm hover:bg-gray-50 flex items-center gap-2 mr-4"
          >
            <span>Logout</span>
          </button>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6 flex items-center gap-2 shadow-sm">
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
            <path
              fillRule="evenodd"
              d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
              clipRule="evenodd"
            />
          </svg>
          <span>{error}</span>
          <button
            onClick={fetchOrders}
            className="ml-auto text-sm font-bold underline hover:text-red-800"
          >
            Retry
          </button>
        </div>
      )}

      {/* Kanban Board */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 h-[calc(100vh-140px)]">
        {Columns.map((col) => (
          <div
            key={col.id}
            onDragOver={handleDragOver}
            onDrop={(e) => handleDrop(e, col.id)}
            className="flex flex-col rounded-lg overflow-hidden transition-colors border max-h-full bg-white shadow-sm"
            style={{
              borderColor: theme.colors.border,
            }}
          >
            {/* Column Header */}
            <div
              className="px-4 py-3 flex items-center justify-between bg-gray-50 border-b"
              style={{
                borderTop: `3px solid ${col.color}`,
                borderColor: theme.colors.border,
              }}
            >
              <h2
                className="font-bold text-lg"
                style={{ color: theme.colors.text.primary }}
              >
                {col.label}
              </h2>
              <span
                className="text-xs font-bold px-2 py-0.5 rounded-lg text-white"
                style={{ backgroundColor: col.color }}
              >
                {orders.filter((o) => o.status === col.id).length}
              </span>
            </div>

            {/* Cards Container */}
            <div className="flex-1 overflow-y-auto p-3 space-y-3 bg-gray-50">
              {orders
                .filter((o) => o.status === col.id)
                .map((order) => {
                  const allItemsDone = order.items.every((i) => i.completed);
                  return (
                    <div
                      key={order.id}
                      draggable
                      onDragStart={(e) => handleDragStart(e, order.id)}
                      className="bg-white rounded-lg p-4 shadow-sm hover:shadow-md transition-all cursor-move group relative border border-gray-200"
                      style={{
                        borderLeftWidth: "3px",
                        borderLeftColor: col.color,
                        opacity: draggedOrderId === order.id ? 0.5 : 1,
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
                          <span
                            className="text-xs font-bold mt-1"
                            style={{ color: theme.colors.accent }}
                          >
                            {order.table}
                          </span>
                        </div>
                      </div>

                      {/* Items List */}
                      <div className="space-y-2 mb-3">
                        {order.items.length === 0 ? (
                          <div className="text-center py-4 text-gray-400 italic text-sm border border-dashed border-gray-200 rounded bg-gray-50">
                            No items in this order
                          </div>
                        ) : (
                          order.items.map((item, idx) => (
                            <div
                              key={idx}
                              onClick={(e) =>
                                toggleItemCompletion(order.id, idx, e)
                              }
                              className="flex justify-between items-center text-sm cursor-pointer hover:bg-gray-50 p-1 -mx-1 rounded"
                            >
                              <div className="flex items-center gap-2 overflow-hidden">
                                <div
                                  className={`w-1.5 h-1.5 rounded-full shrink-0 ${item.completed ? "bg-green-400" : "bg-gray-200"}`}
                                ></div>
                                <span
                                  className={`truncate ${item.completed ? "line-through text-gray-400" : "text-gray-700 font-medium"}`}
                                >
                                  {item.name}
                                </span>
                              </div>
                              <span
                                className={`font-bold ml-2 ${item.completed ? "text-gray-300" : "text-gray-800"}`}
                              >
                                x{item.qty}
                              </span>
                            </div>
                          ))
                        )}
                      </div>

                      {/* Footer Actions */}
                      <div className="pt-2 border-t border-gray-100 flex justify-between items-center">
                        <span className="text-[10px] text-gray-400 font-medium uppercase tracking-wider">
                          {allItemsDone ? "Wait Staff Notified" : "Preparing"}
                        </span>
                        {/* Optional Quick Move Button */}
                        {col.id !== "ready" && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              moveOrder(
                                order.id,
                                col.id === "to_cook" ? "preparing" : "ready",
                              );
                            }}
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

              {orders.filter((o) => o.status === col.id).length === 0 && (
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
