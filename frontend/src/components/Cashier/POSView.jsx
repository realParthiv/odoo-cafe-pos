import React, { useState } from 'react';
import ProductCatalog from './ProductCatalog';
import OrderCart from './OrderCart';
import PaymentModal from './PaymentModal';
import ProductVariantModal from './ProductVariantModal';
import { orderService, paymentService } from '../../services/apiService';

const POSView = ({ selectedTable }) => {
  const [cartItems, setCartItems] = useState([]);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showVariantModal, setShowVariantModal] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [currentOrderId, setCurrentOrderId] = useState(null);

  const handleAddToCart = (product) => {
    // Check if product has variants
    if (product.has_variants) {
      setSelectedProduct(product);
      setShowVariantModal(true);
      return;
    }

    // Add product without variants directly
    addProductToCart({
      id: product.id,
      name: product.name,
      price: Number(product.price || 0),
      quantity: 1,
      tax_rate: Number(product.tax_rate || 0),
      uom: product.uom,
      variant: null,
      image: product.image_url || product.image,
    });
  };

  const addProductToCart = (cartItem) => {
    const existingIndex = cartItems.findIndex(
      item => item.id === cartItem.id && item.variant === cartItem.variant
    );
    
    if (existingIndex >= 0) {
      const newCart = [...cartItems];
      newCart[existingIndex].quantity += cartItem.quantity;
      setCartItems(newCart);
    } else {
      setCartItems([...cartItems, cartItem]);
    }
  };

  const handleUpdateQuantity = (index, newQuantity) => {
    if (newQuantity < 1) return;
    const newCart = [...cartItems];
    newCart[index].quantity = newQuantity;
    setCartItems(newCart);
  };

  const handleRemoveItem = (index) => {
    setCartItems(cartItems.filter((_, i) => i !== index));
  };

  const handleClearCart = () => {
    if (window.confirm('Clear all items from cart?')) {
      setCartItems([]);
    }
  };

  const handleSendToKitchen = async () => {
    if (!selectedTable) {
      alert("Please select a table first!");
      return;
    }
    
    try {
      const orderData = {
        table: selectedTable.id,
        order_type: 'dine_in'
      };
      const response = await orderService.createOrder(orderData);
      const orderId = response.id;
      setCurrentOrderId(orderId);

      // Add lines
      for (const item of cartItems) {
        await orderService.addOrderLine(orderId, {
          product: item.id,
          variant: item.variant_id,
          quantity: item.quantity,
          unit_price: item.price
        });
      }

      alert('Order sent to kitchen!');
    } catch (error) {
      console.error("Failed to send to kitchen:", error);
      alert("Failed to send to kitchen: " + (error.message || "Unknown error"));
    }
  };

  const handlePayment = () => {
    if (!currentOrderId && cartItems.length > 0) {
       // Ideally we should create the order first if not created
       // but for now let's assume send to kitchen happened
       alert("Please send order to kitchen before payment!");
       return;
    }
    setShowPaymentModal(true);
  };

  const handleConfirmPayment = async (paymentData) => {
    try {
      const response = await paymentService.processPayment(currentOrderId, {
        payments: [paymentData]
      });
      if (response.success) {
        alert('Payment successful!');
        setShowPaymentModal(false);
        setCartItems([]);
        setCurrentOrderId(null);
      }
    } catch (error) {
      console.error("Payment failed:", error);
      alert("Payment failed: " + (error.message || "Unknown error"));
    }
  };

  const calculateTotal = () => {
    const subtotal = cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const tax = cartItems.reduce((sum, item) => {
      const lineTotal = item.price * item.quantity;
      return sum + (lineTotal * item.tax_rate / 100);
    }, 0);
    return subtotal + tax;
  };

  return (
    <div className="pos-view">
      <div className="pos-left">
        <ProductCatalog onAddToCart={handleAddToCart} />
      </div>
      <div className="pos-right">
        <OrderCart
          cartItems={cartItems}
          onUpdateQuantity={handleUpdateQuantity}
          onRemoveItem={handleRemoveItem}
          onClear={handleClearCart}
          onSendToKitchen={handleSendToKitchen}
          onPayment={handlePayment}
        />
      </div>

      <ProductVariantModal
        isOpen={showVariantModal}
        onClose={() => setShowVariantModal(false)}
        product={selectedProduct}
        onAddToCart={addProductToCart}
      />

      <PaymentModal
        isOpen={showPaymentModal}
        onClose={() => setShowPaymentModal(false)}
        orderTotal={calculateTotal()}
        onConfirmPayment={handleConfirmPayment}
      />
    </div>
  );
};

export default POSView;
