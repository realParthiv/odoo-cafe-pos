import React, { useState, useEffect } from "react";
import { theme } from "../../theme/theme";

// --- Components ---

// Page 1: Order Summary (Live Cart)
const SummaryView = ({ cart, orderTotal }) => {
  return (
    <div className="flex flex-col h-full animate-fadeIn">
      {/* Header */}
      <div className="text-center py-8 border-b bg-white shadow-sm" style={{ borderColor: theme.colors.border }}>
        <h1 className="text-3xl font-bold tracking-tight mb-2" style={{ color: theme.colors.primary }}>Odoo Cafe</h1>
        <p className="text-lg uppercase tracking-widest font-medium" style={{ color: theme.colors.text.secondary }}>Welcome</p>
      </div>

      {/* Cart Items */}
      <div className="flex-1 overflow-y-auto p-8 max-w-4xl mx-auto w-full">
        {cart.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-gray-400 space-y-4">
            <div className="text-6xl opacity-20">🛍️</div>
            <p className="text-2xl font-light">Your order will appear here</p>
          </div>
        ) : (
          <ul className="space-y-6">
            {cart.map((item, idx) => (
              <li key={idx} className="flex justify-between items-center bg-white p-6 rounded-lg shadow-sm border animate-slideIn" style={{ borderColor: theme.colors.border }}>
                <div className="flex items-center gap-6">
                  <span className="w-12 h-12 flex items-center justify-center bg-gray-100 rounded-full text-xl font-bold text-gray-600">
                    {item.qty}
                  </span>
                  <span className="text-2xl font-semibold text-gray-800">{item.name}</span>
                </div>
                <span className="text-2xl font-bold text-gray-900">₹{(item.price * item.qty).toFixed(2)}</span>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Footer Totals */}
      <div className="bg-white border-t p-8 shadow-sm" style={{ borderColor: theme.colors.border }}>
        <div className="max-w-4xl mx-auto space-y-3">
          <div className="flex justify-between text-gray-500 text-xl">
            <span>Subtotal</span>
            <span>₹{orderTotal.toFixed(2)}</span>
          </div>
          <div className="flex justify-between text-gray-500 text-xl">
            <span>Tax (5%)</span>
            <span>₹{(orderTotal * 0.05).toFixed(2)}</span>
          </div>
          <div className="flex justify-between items-center pt-4 border-t border-gray-100">
            <span className="text-3xl font-bold text-gray-900">Total</span>
            <span className="text-5xl font-extrabold" style={{ color: theme.colors.primary }}>
              ₹{(orderTotal * 1.05).toFixed(2)}
            </span>
          </div>
        </div>
        <div className="text-center mt-8 text-xs text-gray-300 font-medium">
          Powered by Odoo
        </div>
      </div>
    </div>
  );
};

// Page 2: Payment (UPI QR)
const PaymentView = ({ amount }) => {
  return (
    <div className="flex flex-col h-full bg-white animate-fadeIn">
      <div className="flex-1 flex flex-col items-center justify-center p-8 space-y-10 text-center">
        <div className="space-y-4">
          <h1 className="text-4xl font-bold text-gray-900">Please Scan to Pay</h1>
          <p className="text-xl text-gray-500">Use any UPI App</p>
        </div>

        <div className="p-4 bg-white rounded-2xl shadow-lg border" style={{ borderColor: theme.colors.border }}>
          {/* Placeholder QR using an icon for demo - in real app would be QR Image */}
          <div className="w-64 h-64 bg-gray-900 rounded-xl flex items-center justify-center text-white">
            <span className="text-8xl">QR</span>
          </div>
        </div>

        <div>
          <p className="text-lg text-gray-400 mb-2 font-medium">Amount to Pay</p>
          <p className="text-6xl font-black" style={{ color: theme.colors.primary }}>
            ₹{amount.toFixed(2)}
          </p>
        </div>
      </div>
      <div className="py-6 text-center text-xs text-gray-300 font-medium border-t border-gray-50">
        Powered by Odoo
      </div>
    </div>
  );
};

// Page 3: Success
const SuccessView = ({ amount }) => {
  return (
    <div className="flex flex-col h-full bg-white items-center justify-center animate-scaleIn text-center p-8">
      <div className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center mb-8 text-green-500">
        <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
        </svg>
      </div>
      <h1 className="text-5xl font-bold text-gray-900 mb-4">Thank You!</h1>
      <p className="text-2xl text-gray-500 mb-8">Payment of ₹{amount.toFixed(2)} Received</p>
      <p className="text-lg" style={{ color: theme.colors.primary }}>See you again soon</p>

      <div className="absolute bottom-6 text-xs text-gray-300 font-medium">
        Powered by Odoo
      </div>
    </div>
  );
};

// --- Main Container with Logic ---
const Customer = () => {
  const [view, setView] = useState('summary'); // summary, payment, success
  const [cart, setCart] = useState([]);
  const [total, setTotal] = useState(0);

  // Auto-reset logic for success screen
  useEffect(() => {
    let timeout;
    if (view === 'success') {
      timeout = setTimeout(() => {
        setCart([]);
        setTotal(0);
        setView('summary');
      }, 5000); // 5 seconds display
    }
    return () => clearTimeout(timeout);
  }, [view]);

  // Recalculate total
  useEffect(() => {
    const sum = cart.reduce((acc, item) => acc + (item.price * item.qty), 0);
    setTotal(sum);
  }, [cart]);

  // --- Simulation Controls (Hidden in Production, visible for Dev here) ---
  const simulateAddItem = () => {
    const products = [
      { name: "Cappuccino", price: 120 },
      { name: "Veg Burger", price: 180 },
      { name: "Fries", price: 90 },
      { name: "Pasta Alfredo", price: 250 }
    ];
    const rand = products[Math.floor(Math.random() * products.length)];
    setCart(prev => {
      const existing = prev.find(i => i.name === rand.name);
      if (existing) {
        return prev.map(i => i.name === rand.name ? { ...i, qty: i.qty + 1 } : i);
      }
      return [...prev, { ...rand, qty: 1 }];
    });
  };

  return (
    <div className="h-screen w-screen bg-[#F9F9F9] relative overflow-hidden font-sans">

      {/* Main Display Area */}
      <div className="h-full w-full">
        {view === 'summary' && <SummaryView cart={cart} orderTotal={total} />}
        {view === 'payment' && <PaymentView amount={total * 1.05} />}
        {view === 'success' && <SuccessView amount={total * 1.05} />}
      </div>

      {/* --- Dev Control Panel (Simulating Cashier Actions) --- */}
      <div className="fixed bottom-4 right-4 bg-gray-800 p-4 rounded-xl shadow-2xl opacity-90 transition-opacity hover:opacity-100 z-50 flex flex-col gap-2 w-48">
        <p className="text-xs text-gray-400 font-bold uppercase mb-1">Simulate POS</p>
        <button
          onClick={simulateAddItem}
          className="bg-blue-600 hover:bg-blue-500 text-white text-xs py-2 px-3 rounded font-bold transition-colors"
        >
          + Add Item
        </button>
        <button
          onClick={() => setView('payment')}
          disabled={cart.length === 0}
          className="bg-yellow-600 hover:bg-yellow-500 text-white text-xs py-2 px-3 rounded font-bold transition-colors disabled:opacity-50"
        >
          → Pay (UPI)
        </button>
        <button
          onClick={() => setView('success')}
          disabled={view !== 'payment'}
          className="bg-green-600 hover:bg-green-500 text-white text-xs py-2 px-3 rounded font-bold transition-colors disabled:opacity-50"
        >
          ✓ Payment Done
        </button>
        <button
          onClick={() => { setCart([]); setView('summary'); }}
          className="bg-red-900/50 hover:bg-red-800 text-red-200 text-xs py-1 px-3 rounded transition-colors mt-2"
        >
          Reset
        </button>
      </div>

    </div>
  );
};

export default Customer;
