import React, { useState } from "react";
import ProductCatalog from "./ProductCatalog";
import OrderCart from "./OrderCart";
import PaymentModal from "./PaymentModal";
import ProductVariantModal from "./ProductVariantModal";
import { orderService, paymentService } from "../../services/apiService";

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
      (item) => item.id === cartItem.id && item.variant === cartItem.variant,
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
    if (window.confirm("Clear all items from cart?")) {
      setCartItems([]);
    }
  };

  const handleSendToKitchen = async () => {
    if (!selectedTable) {
      alert("Please select a table first!");
      return;
    }

    try {
      let orderId = currentOrderId;

      // 1. Create Order if not exists
      if (!orderId) {
        const orderData = {
          table: selectedTable.id,
          order_type: "dine_in",
        };
        const response = await orderService.createOrder(orderData);
        orderId = response.id;
        setCurrentOrderId(orderId);
      }

      // 2. Add lines
      for (const item of cartItems) {
        await orderService.addOrderLine(orderId, {
          product: item.id,
          variant: item.variant_id,
          quantity: item.quantity,
          unit_price: item.price,
        });
      }

      // 3. Send to Kitchen
      await orderService.sendToKitchen(orderId);

      alert("Order sent to kitchen!");
      setCartItems([]); // Clear cart after sending to kitchen
    } catch (error) {
      console.error("Failed to send to kitchen:", error);
      alert("Failed to send to kitchen: " + (error.message || "Unknown error"));
    }
  };

  const handlePayment = async () => {
    if (cartItems.length === 0) {
      alert("Cart is empty!");
      return;
    }

    // Use Razorpay flow
    await handleRazorpayPayment();
  };

  const handleRazorpayPayment = async () => {
    try {
      // 1. Create Order & Get Razorpay Details
      // User requested QR flow. We need a valid table_token.
      const tableToken =
        selectedTable.token || selectedTable.uuid || selectedTable.id;

      const orderData = {
        table_token: tableToken,
        customer_name: "Cashier Guest",
        customer_phone: "",
        total_amount: calculateTotal(), // Explicitly send total
        lines: cartItems.map((item) => ({
          product: item.id,
          variant: item.variant ? item.variant_id : null,
          quantity: item.quantity,
          unit_price: item.price,
          notes: "",
        })),
      };

      const response = await orderService.createQrOrder(orderData);

      if (response.status === "success") {
        const data = response.data;
        setCurrentOrderId(data.id);
        initiateRazorpay(data);
      } else {
        alert("Failed to create QR order: " + response.message);
      }
    } catch (error) {
      console.error("Payment initiation failed:", error);
      alert(
        "Failed to initiate payment: " + (error.message || "Unknown error"),
      );
    }
  };

  const initiateRazorpay = (orderData) => {
    const options = {
      key: orderData.razorpay_key,
      amount: Math.round(parseFloat(orderData.total_amount) * 100),
      currency: "INR",
      order_id: orderData.razorpay_order_id,
      name: "Odoo Cafe",
      description: `Order #${orderData.order_number}`,
      image: "/vite.svg", // Use app logo
      handler: async function (response) {
        await verifyRazorpayPayment(response, orderData);
      },
      modal: {
        ondismiss: function () {
          console.log("Payment cancelled");
        },
      },
      theme: {
        color: "#3b82f6", // Match app theme
      },
    };

    const razorpay = new window.Razorpay(options);
    razorpay.open();
  };

  const verifyRazorpayPayment = async (razorpayResponse, orderData) => {
    try {
      const verifyData = {
        razorpay_order_id: razorpayResponse.razorpay_order_id,
        razorpay_payment_id: razorpayResponse.razorpay_payment_id,
        razorpay_signature: razorpayResponse.razorpay_signature,
      };

      const response = await paymentService.verifyPayment(verifyData);

      if (response.status === "success") {
        alert("Payment Successful! Order sent to kitchen.");
        setCartItems([]);
        setCurrentOrderId(null);
      } else {
        alert("Payment verification failed: " + response.message);
      }
    } catch (error) {
      console.error("Verification error:", error);
      alert(
        "Payment verification error: " + (error.message || "Unknown error"),
      );
    }
  };

  // Keep handleConfirmPayment for manual payment modal if needed (currently bypassed)
  const handleConfirmPayment = async (paymentData) => {
    try {
      const response = await paymentService.processPayment(currentOrderId, {
        payments: [paymentData],
      });
      if (response.success) {
        alert("Payment successful!");
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
    const subtotal = cartItems.reduce(
      (sum, item) => sum + item.price * item.quantity,
      0,
    );
    const tax = cartItems.reduce((sum, item) => {
      const lineTotal = item.price * item.quantity;
      return sum + (lineTotal * item.tax_rate) / 100;
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
