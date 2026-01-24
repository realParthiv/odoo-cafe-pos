import React, { useState } from 'react';
import ProductCatalog from './ProductCatalog';
import OrderCart from './OrderCart';
import PaymentModal from './PaymentModal';
import ProductVariantModal from './ProductVariantModal';

const POSView = () => {
  const [cartItems, setCartItems] = useState([]);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showVariantModal, setShowVariantModal] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);

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
      price: product.price,
      quantity: 1,
      tax_rate: product.tax_rate,
      uom: product.uom,
      variant: null,
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

  const handleSendToKitchen = () => {
    console.log('Sending to kitchen:', cartItems);
    alert('Order sent to kitchen!');
  };

  const handlePayment = () => {
    setShowPaymentModal(true);
  };

  const handleConfirmPayment = (paymentData) => {
    console.log('Payment confirmed:', paymentData);
    alert('Payment successful! Receipt generated.');
    setShowPaymentModal(false);
    setCartItems([]);
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
