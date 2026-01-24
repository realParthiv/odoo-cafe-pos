import React, { useState } from "react";
import { Trash2, Send, CreditCard, Plus, Minus } from "lucide-react";

const OrderCart = ({
  cartItems,
  onUpdateQuantity,
  onRemoveItem,
  onClear,
  onSendToKitchen,
  onPayment,
}) => {
  const [noteInput, setNoteInput] = useState("");
  const [selectedItemIndex, setSelectedItemIndex] = useState(null);

  const calculateSubtotal = () => {
    return cartItems.reduce(
      (sum, item) => sum + Number(item.price || 0) * item.quantity,
      0,
    );
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

  return (
    <div className="order-cart">
      <div className="cart-header">
        <h3>Current Order</h3>
        <button
          className="clear-btn"
          onClick={onClear}
          disabled={cartItems.length === 0}
        >
          Clear All
        </button>
      </div>

      <div className="cart-items">
        {cartItems.length === 0 ? (
          <div className="empty-cart">
            <div className="empty-icon">🛒</div>
            <p>Your cart is empty</p>
            <p className="empty-cart-hint">Select products to start</p>
          </div>
        ) : (
          cartItems.map((item, index) => (
            <div
              key={index}
              className={`cart-item ${selectedItemIndex === index ? "selected" : ""}`}
              onClick={() => setSelectedItemIndex(index)}
            >
              {(item.image_url || item.image) && (
                <img
                  src={item.image_url || item.image}
                  alt=""
                  className="cart-item-thumb"
                />
              )}
              <div className="item-details">
                <div className="item-name">
                  {item.name}
                  {item.variant && (
                    <span className="variant-label"> ({item.variant})</span>
                  )}
                </div>
                <div className="item-meta">
                  <span className="item-price">
                    ${Number(item.price || 0).toFixed(2)}
                  </span>
                </div>
              </div>

              <div className="item-actions-inline">
                <button
                  className="qty-btn"
                  onClick={(e) => {
                    e.stopPropagation();
                    onUpdateQuantity(index, item.quantity - 1);
                  }}
                >
                  <Minus size={14} />
                </button>
                <span className="item-qty">{item.quantity}</span>
                <button
                  className="qty-btn"
                  onClick={(e) => {
                    e.stopPropagation();
                    onUpdateQuantity(index, item.quantity + 1);
                  }}
                >
                  <Plus size={14} />
                </button>
                <button
                  className="remove-btn-inline"
                  onClick={(e) => {
                    e.stopPropagation();
                    onRemoveItem(index);
                  }}
                >
                  <Trash2 size={16} />
                </button>
              </div>

              <div className="item-total-display">
                ${(Number(item.price || 0) * item.quantity).toFixed(2)}
              </div>
            </div>
          ))
        )}
      </div>

      <div className="cart-footer-panel">
        <div className="cart-summary-compact">
          <div className="summary-row">
            <span>Subtotal</span>
            <span>${calculateSubtotal().toFixed(2)}</span>
          </div>
          <div className="summary-row">
            <span>Tax</span>
            <span>${calculateTax().toFixed(2)}</span>
          </div>
          <div className="summary-row total">
            <span>Total</span>
            <span>${calculateTotal().toFixed(2)}</span>
          </div>
        </div>

        <div className="cart-main-actions">
          <button className="btn-action btn-send" onClick={onSendToKitchen}>
            <Send size={20} />
            <span>Send to Kitchen</span>
          </button>
          <button className="btn-action btn-pay" onClick={onPayment}>
            <CreditCard size={20} />
            <span>Payment</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default OrderCart;
