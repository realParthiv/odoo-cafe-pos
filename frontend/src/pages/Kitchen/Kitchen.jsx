import React, { useState, useEffect } from "react";

// Mock Data Generation
const generateMockOrders = () => [
  {
    id: "ORD-001",
    table: "T-5",
    items: [
      { name: "Cappuccino", qty: 2, completed: false },
      { name: "Blueberry Muffin", qty: 1, completed: false },
    ],
    status: "to_cook",
    time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
  },
  {
    id: "ORD-002",
    table: "T-2",
    items: [
      { name: "Avocado Toast", qty: 1, completed: false },
      { name: "Iced Latte", qty: 1, completed: false },
    ],
    status: "preparing",
    time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
  },
  {
    id: "ORD-003",
    table: "T-8",
    items: [
      { name: "Croissant", qty: 3, completed: true },
    ],
    status: "completed",
    time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
  },
];

const Kitchen = () => {
  const [orders, setOrders] = useState([]);
  const [draggedOrderId, setDraggedOrderId] = useState(null);

  // Theme Colors modeled after project theme
  // primary: "#714B67", secondary: "#00A09D", accent: "#017E84", background: "#F9F9F9"
  // status: success: "#28a745", warning: "#ffc107", danger: "#dc3545"

  useEffect(() => {
    // Load initial mock data
    setOrders(generateMockOrders());
  }, []);

  const moveOrder = (orderId, newStatus) => {
    if (!newStatus) return; // No next status implies end of flow or purely visual state
    setOrders((prev) =>
      prev.map((order) =>
        order.id === orderId ? { ...order, status: newStatus } : order
      )
    );
  };

  const toggleItemCompletion = (orderId, itemIndex, e) => {
    e.stopPropagation(); // Prevent card click
    setOrders((prev) =>
      prev.map((order) => {
        if (order.id !== orderId) return order;
        const newItems = [...order.items];
        newItems[itemIndex] = {
          ...newItems[itemIndex],
          completed: !newItems[itemIndex].completed,
        };
        return { ...order, items: newItems };
      })
    );
  };

  const Columns = [
    { id: "to_cook", title: "To Cook", color: "#dc3545", next: "preparing", info: "Newly received orders" },
    { id: "preparing", title: "Preparing", color: "#e0a800", next: "completed", info: "Items being prepared" },
    { id: "completed", title: "Completed", color: "#28a745", next: null, info: "Ready for service" },
  ];

  // Helper to add a random new order
  const simulateNewOrder = () => {
    const newOrder = {
      id: `ORD-${Math.floor(Math.random() * 1000)}`,
      table: `T-${Math.floor(Math.random() * 10) + 1}`,
      items: [
        { name: "New Item Special", qty: 1, completed: false },
        { name: "Side Salad", qty: 1, completed: false }
      ],
      status: "to_cook",
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };
    setOrders((prev) => [...prev, newOrder]);
  };

  // Drag and Drop Handlers
  const handleDragStart = (e, orderId) => {
    setDraggedOrderId(orderId);
    e.dataTransfer.effectAllowed = "move";
  };

  const handleDragOver = (e) => {
    e.preventDefault(); // Essential to allow dropping
    e.dataTransfer.dropEffect = "move";
  };

  const handleDrop = (e, targetStatus) => {
    e.preventDefault();
    if (draggedOrderId) {
      moveOrder(draggedOrderId, targetStatus);
      setDraggedOrderId(null);
    }
  };

  return (
    <div
      style={{
        backgroundColor: "#F9F9F9",
        minHeight: "100vh",
        padding: "24px",
        fontFamily: "'Inter', sans-serif",
      }}
    >
      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1
            style={{
              color: "#714B67",
              fontSize: "2rem",
              fontWeight: "bold",
            }}
          >
            Kitchen Display
          </h1>
          <p className="text-gray-500 text-sm">Real-time Order Management</p>
        </div>

        <button
          onClick={simulateNewOrder}
          style={{
            backgroundColor: "#714B67",
            color: "#FFFFFF",
            padding: "10px 20px",
            borderRadius: "8px",
            border: "none",
            cursor: "pointer",
            fontWeight: "600",
            boxShadow: "0 4px 6px rgba(0,0,0,0.1)",
          }}
        >
          + Simulate Incoming Order
        </button>
      </div>

      {/* Kanban Board Container */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 h-full">
        {Columns.map((col) => (
          <div
            key={col.id}
            onDragOver={handleDragOver}
            onDrop={(e) => handleDrop(e, col.id)}
            className="flex flex-col h-full transition-colors"
            style={{
              backgroundColor: "#EFEFEF", // slightly darker than bg
              borderRadius: "12px",
              padding: "16px",
              minHeight: "600px", // Kanban height
            }}
          >
            {/* Column Header */}
            <div
              className="flex items-center justify-between mb-4 pb-2"
              style={{
                borderBottom: `4px solid ${col.color}`,
              }}
            >
              <h2
                style={{
                  color: "#212529",
                  fontWeight: "700",
                  fontSize: "1.25rem",
                }}
              >
                {col.title}
              </h2>
              <span
                style={{
                  backgroundColor: col.color,
                  color: "#FFF",
                  padding: "2px 10px",
                  borderRadius: "12px",
                  fontSize: "0.85rem",
                  fontWeight: "bold",
                }}
              >
                {orders.filter((o) => o.status === col.id).length}
              </span>
            </div>

            {/* Orders List */}
            <div className="flex flex-col gap-4 overflow-y-auto flex-1">
              {orders
                .filter((order) => order.status === col.id)
                .map((order) => (
                  <div
                    key={order.id}
                    draggable
                    onDragStart={(e) => handleDragStart(e, order.id)}
                    onClick={() => col.next && moveOrder(order.id, col.next)}
                    style={{
                      backgroundColor: "#FFFFFF",
                      borderRadius: "8px",
                      padding: "16px",
                      boxShadow: "0 2px 4px rgba(0,0,0,0.05)",
                      borderLeft: `5px solid ${col.color}`,
                      cursor: "grab",
                      opacity: draggedOrderId === order.id ? 0.5 : 1,
                      transition: "all 0.2s",
                    }}
                    className="hover:shadow-md hover:scale-[1.01] group relative active:cursor-grabbing"
                  >
                    {/* Hover Hint */}
                    <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity text-xs text-gray-400 font-medium pointer-events-none">
                      Drag to move
                    </div>

                    <div className="flex justify-between items-start mb-2 pointer-events-none">
                      <span className="font-bold text-xl text-gray-800">
                        {order.id}
                      </span>
                      <span className="text-xs font-bold text-gray-400 bg-gray-100 px-2 py-1 rounded">
                        {order.time}
                      </span>
                    </div>
                    <div
                      className="text-sm font-semibold mb-3 flex items-center gap-2 pointer-events-none"
                      style={{ color: "#017E84" }} // Accent color
                    >
                      <span>Table: {order.table}</span>
                    </div>

                    <div className="border-t border-gray-100 my-2 pointer-events-none"></div>

                    {/* Items */}
                    <ul className="mb-2 text-sm text-gray-700 space-y-2 relative z-10">
                      {order.items.map((item, idx) => (
                        <li
                          key={idx}
                          onClick={(e) => toggleItemCompletion(order.id, idx, e)}
                          className="flex justify-between items-center p-1 rounded hover:bg-gray-50 cursor-pointer"
                        >
                          <span
                            className={`flex-1 ${item.completed ? "line-through text-gray-400" : ""}`}
                          >
                            {item.name}
                          </span>
                          <span className={`font-bold ml-2 ${item.completed ? "text-gray-300" : "text-gray-800"}`}>
                            x{item.qty}
                          </span>
                        </li>
                      ))}
                    </ul>

                    {/* Instruction Hint for Items */}
                    <div className="mt-3 text-[10px] text-gray-400 text-center pointer-events-none">
                      Click item to cross off
                    </div>
                  </div>
                ))}
              {orders.filter((o) => o.status === col.id).length === 0 && (
                <div className="text-center py-10 text-gray-400 italic">
                  Drop here
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
