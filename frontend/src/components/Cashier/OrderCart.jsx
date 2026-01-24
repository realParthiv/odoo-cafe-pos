import React, { useState } from 'react';

const OrderCart = ({
  cartItems,
  onUpdateQuantity,
  onRemoveItem,
  onClear,
  onSendToKitchen,
  onPayment,
}) => {
  const [selectedItemIndex, setSelectedItemIndex] = useState(null);
  const [activeMode, setActiveMode] = useState('qty'); // 'qty', 'disc', 'price'
  const [noteInput, setNoteInput] = useState('');
  const [showNoteField, setShowNoteField] = useState(false);

  const calculateSubtotal = () => {
    return cartItems.reduce((sum, item) => sum + Number(item.price || 0) * item.quantity, 0);
  };

  const calculateTax = () => {
    return cartItems.reduce((sum, item) => {
      const lineTotal = Number(item.price || 0) * item.quantity;
      return sum + (lineTotal * (item.tax_rate || 0)) / 100;
    }, 0);
  };

  const calculateTotal = () => {
    return calculateSubtotal() + calculateTax();
  };

  const calculateLineTotal = (item) => {
    return Number(item.price || 0) * item.quantity;
  };

  const handleKeypadPress = (key) => {
    if (selectedItemIndex === null) return;

    const item = cartItems[selectedItemIndex];
    let newQuantity = item.quantity;

    if (key === 'C') {
      onUpdateQuantity(selectedItemIndex, 1);
      return;
    }

    if (key === 'qty') {
      setActiveMode('qty');
      return;
    }

    if (key === 'disc') {
      setActiveMode('disc');
      return;
    }

    if (key === 'price') {
      setActiveMode('price');
      return;
    }

    if (key === '+/-') {
      return;
    }

    if (key === 'del') {
      // Basic backspace logic for quantity
      if (activeMode === 'qty') {
        const currentQtyStr = item.quantity.toString();
        if (currentQtyStr.length > 1) {
          newQuantity = parseInt(currentQtyStr.slice(0, -1));
        } else {
          newQuantity = 1;
        }
        onUpdateQuantity(selectedItemIndex, newQuantity);
      }
      return;
    }

    // Default numeric handling for quantity
    if (!isNaN(key)) {
      if (activeMode === 'qty') {
        const currentQtyStr = item.quantity.toString();
        if (currentQtyStr === '1') {
          newQuantity = parseInt(key);
        } else if (currentQtyStr.length < 3) {
          newQuantity = parseInt(currentQtyStr + key);
        }
        onUpdateQuantity(selectedItemIndex, newQuantity);
      }
    }
  };

  const handleAddNote = () => {
    if (selectedItemIndex === null || !noteInput.trim()) return;
    console.log(`Adding note to item ${selectedItemIndex}: ${noteInput}`);
    setShowNoteField(false);
    setNoteInput('');
  };

  return (
    <div className="order-cart">
      <div className="cart-header">
        <h3>Current Order</h3>
        <button className="clear-btn" onClick={onClear}>Clear All</button>
      </div>

      <div className="cart-items">
        {cartItems.length === 0 ? (
          <div className="empty-cart">
            <div className="empty-icon">🛒</div>
            <p>Your cart is empty</p>
            <p className="empty-cart-hint">Select products from the catalog to start an order</p>
          </div>
        ) : (
          cartItems.map((item, index) => (
            <div 
              key={index} 
              className={`cart-item ${selectedItemIndex === index ? 'selected' : ''}`}
              onClick={() => setSelectedItemIndex(index)}
            >
              {(item.image_url || item.image) && (
                <img src={item.image_url || item.image} alt="" className="cart-item-thumb" />
              )}
              <div className="item-details">
                <div className="item-name">
                  {item.name}
                  {item.variant && <span className="variant-label"> ({item.variant})</span>}
                </div>
                <div className="item-meta">
                  <span className="item-uom">{item.uom}</span>
                  <span className="item-price">${Number(item.price || 0).toFixed(2)}</span>
                </div>
                {item.notes && <div className="item-note">Notes: {item.notes}</div>}
              </div>
              <div className="item-actions">
                <div className="item-qty-display">
                  {item.quantity} x
                </div>
                <div className="item-total">
                  ${calculateLineTotal(item).toFixed(2)}
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      <div className="cart-controls">
        <div className="cart-summary">
          <div className="total-row large">
            <span>Total</span>
            <span className="total-amount">${calculateTotal().toFixed(2)}</span>
          </div>
        </div>

        <div className="action-buttons-grid">
          <button 
            className={`action-sub-btn ${showNoteField ? 'active' : ''}`}
            onClick={() => setShowNoteField(!showNoteField)}
          >
            Notes
          </button>
          <button className="action-sub-btn">Customer</button>
        </div>

        {showNoteField && (
          <div className="note-input-container">
            <input 
              type="text" 
              placeholder="Add note to item..." 
              value={noteInput}
              onChange={(e) => setNoteInput(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleAddNote()}
            />
            <button onClick={handleAddNote}>Add</button>
          </div>
        )}

        <div className="numpad-grid">
          {[1, 2, 3].map(n => <button key={n} onClick={() => handleKeypadPress(n.toString())}>{n}</button>)}
          <button className={`mode-btn ${activeMode === 'qty' ? 'active' : ''}`} onClick={() => handleKeypadPress('qty')}>Qty</button>
          {[4, 5, 6].map(n => <button key={n} onClick={() => handleKeypadPress(n.toString())}>{n}</button>)}
          <button className={`mode-btn ${activeMode === 'disc' ? 'active' : ''}`} onClick={() => handleKeypadPress('disc')}>Disc</button>
          {[7, 8, 9].map(n => <button key={n} onClick={() => handleKeypadPress(n.toString())}>{n}</button>)}
          <button className={`mode-btn ${activeMode === 'price' ? 'active' : ''}`} onClick={() => handleKeypadPress('price')}>Price</button>
          <button onClick={() => handleKeypadPress('+/-')}>+/-</button>
          <button onClick={() => handleKeypadPress('0')}>0</button>
          <button onClick={() => handleKeypadPress('.')}>.</button>
          <button className="delete-btn" onClick={() => handleKeypadPress('del')}>⌫</button>
        </div>

        <div className="cart-actions-main">
          <button className="btn-send" onClick={onSendToKitchen}>
            Send
            <span className="qty-badge">Qty: {cartItems.reduce((s, i) => s + i.quantity, 0)}</span>
          </button>
          <button className="btn-payment-main" onClick={onPayment}>
            Payment
          </button>
        </div>
      </div>
    </div>
  );
};

export default OrderCart;
