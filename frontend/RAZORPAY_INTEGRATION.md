# 🔐 Razorpay Payment Integration - Frontend Guide

## 📋 Overview

This document provides complete integration instructions for frontend developers implementing Razorpay payments for the Café POS QR-based ordering system.

**Integration Strategy:** Webhook-Driven (Backend handles payment confirmation)

---

## 🎯 Payment Flow Architecture

```
┌─────────────┐
│  Customer   │
│  Scans QR   │
└──────┬──────┘
       │
       ▼
┌─────────────────────────────────────────────────┐
│ 1. POST /api/orders/qr/                         │
│    - Create order with items                    │
│    - Receive razorpay_order_id & razorpay_key   │
└──────────────┬──────────────────────────────────┘
               │
               ▼
┌─────────────────────────────────────────────────┐
│ 2. Initialize Razorpay Checkout (Frontend)     │
│    - Load Razorpay.js SDK                       │
│    - Show payment modal                         │
└──────────────┬──────────────────────────────────┘
               │
               ▼
┌─────────────────────────────────────────────────┐
│ 3. Customer Completes Payment                   │
│    - Razorpay processes payment                 │
│    - Returns payment_id & signature             │
└──────────────┬──────────────────────────────────┘
               │
               ├─────────────────┬────────────────┐
               │                 │                │
               ▼                 ▼                ▼
     ┌──────────────┐  ┌──────────────┐  ┌──────────────┐
     │   Frontend   │  │   Razorpay   │  │   Backend    │
     │  Callback    │  │   Webhook    │  │   Webhook    │
     └──────┬───────┘  └──────┬───────┘  └──────┬───────┘
            │                 │                  │
            ▼                 ▼                  ▼
     ┌──────────────────────────────────────────────────┐
     │ 4. POST /api/payments/verify/                    │
     │    - Verify signature (immediate feedback)       │
     │    - Returns success confirmation                │
     └──────────────────────────────────────────────────┘
                              │
                              ▼
     ┌──────────────────────────────────────────────────┐
     │ 5. Webhook: POST /api/payments/webhook/razorpay/ │
     │    - Creates Payment record (idempotent)         │
     │    - Updates order status → SENT_TO_KITCHEN      │
     │    - Notifies kitchen via WebSocket              │
     └──────────────────────────────────────────────────┘
                              │
                              ▼
                    ┌─────────────────┐
                    │  Kitchen Gets   │
                    │  Order Display  │
                    └─────────────────┘
```

---

## 🚀 Step-by-Step Implementation

### **Step 1: Create Order & Get Razorpay Details**

**Endpoint:** `POST /api/orders/qr/`

**Request:**
```javascript
const createOrder = async (tableToken, items, customerInfo) => {
  const response = await fetch('https://your-api.com/api/orders/qr/', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      table_token: tableToken,
      customer_name: customerInfo.name,
      customer_phone: customerInfo.phone,
      lines: items.map(item => ({
        product: item.productId,
        variant: item.variantId || null,
        quantity: item.quantity,
        notes: item.specialInstructions || ''
      }))
    })
  });

  const data = await response.json();
  return data;
};
```

**Response Example:**
```json
{
  "status": "success",
  "message": "Order placed successfully. Please proceed with payment.",
  "data": {
    "id": 123,
    "uuid": "550e8400-e29b-41d4-a716-446655440000",
    "order_number": "ORD-20260125-A4B2",
    "total_amount": "450.00",
    "subtotal": "400.00",
    "tax_amount": "50.00",
    "razorpay_order_id": "order_NXk5H6g8qJvK6Z",
    "razorpay_key": "rzp_test_1234567890",
    "lines": [
      {
        "id": 1,
        "product_name": "Cappuccino",
        "variant": "Large",
        "quantity": 2,
        "unit_price": "150.00",
        "total_price": "300.00"
      }
    ]
  }
}
```

---

### **Step 2: Load Razorpay SDK**

Add Razorpay script to your HTML:

```html
<!-- In your index.html or dynamically load -->
<script src="https://checkout.razorpay.com/v1/checkout.js"></script>
```

---

### **Step 3: Initialize Razorpay Checkout**

```javascript
const initiatePayment = (orderData) => {
  const options = {
    // Razorpay API Key from backend response
    key: orderData.razorpay_key,
    
    // Amount in paisa (already in correct format from backend)
    amount: Math.round(parseFloat(orderData.total_amount) * 100),
    
    // Currency
    currency: 'INR',
    
    // Order ID from backend
    order_id: orderData.razorpay_order_id,
    
    // Display info
    name: 'Our Café',
    description: `Order #${orderData.order_number}`,
    image: 'https://your-domain.com/logo.png', // Optional
    
    // Customer prefill
    prefill: {
      name: orderData.customer_name || '',
      contact: orderData.customer_phone || '',
    },
    
    // Theme
    theme: {
      color: '#FF6B35'
    },
    
    // Success handler
    handler: async function(response) {
      await handlePaymentSuccess(response, orderData);
    },
    
    // Modal closed handler
    modal: {
      ondismiss: function() {
        console.log('Payment cancelled by user');
        // Optionally show retry UI
        alert('Payment cancelled. You can retry or contact staff.');
      }
    },
    
    // Error handler
    error: function(error) {
      console.error('Payment error:', error);
      alert('Payment failed. Please try again or contact staff.');
    }
  };

  const razorpay = new Razorpay(options);
  razorpay.open();
};
```

---

### **Step 4: Handle Payment Success & Verify**

```javascript
const handlePaymentSuccess = async (razorpayResponse, orderData) => {
  try {
    // Show loading state
    showLoader('Confirming payment...');
    
    // Verify payment with backend
    const verifyResponse = await fetch('https://your-api.com/api/payments/verify/', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        razorpay_order_id: razorpayResponse.razorpay_order_id,
        razorpay_payment_id: razorpayResponse.razorpay_payment_id,
        razorpay_signature: razorpayResponse.razorpay_signature
      })
    });

    const result = await verifyResponse.json();
    
    if (result.status === 'success') {
      hideLoader();
      
      // Show success UI
      showSuccessScreen({
        orderNumber: orderData.order_number,
        amount: orderData.total_amount,
        message: 'Payment successful! Your order has been sent to the kitchen.'
      });
      
      // Optional: Poll for order status updates
      startOrderStatusPolling(orderData.uuid);
      
    } else {
      throw new Error(result.message || 'Payment verification failed');
    }
    
  } catch (error) {
    hideLoader();
    console.error('Verification error:', error);
    
    // Show error but inform user that payment might still be processing
    showErrorScreen({
      title: 'Verification In Progress',
      message: 'Your payment is being verified. Please check with staff or refresh the page.',
      orderNumber: orderData.order_number
    });
  }
};
```

---

### **Step 5: Optional - Poll for Order Status** (Recommended)

Since webhook processes asynchronously, you can poll for updates:

```javascript
const startOrderStatusPolling = (orderUuid) => {
  let pollCount = 0;
  const maxPolls = 10;
  
  const pollInterval = setInterval(async () => {
    pollCount++;
    
    try {
      const response = await fetch(`https://your-api.com/api/orders/${orderUuid}/`);
      const data = await response.json();
      
      if (data.data.status === 'sent_to_kitchen') {
        clearInterval(pollInterval);
        updateUI({
          status: 'confirmed',
          message: 'Order confirmed and sent to kitchen!'
        });
      } else if (pollCount >= maxPolls) {
        clearInterval(pollInterval);
        // Stop polling after max attempts
      }
      
    } catch (error) {
      console.error('Polling error:', error);
    }
  }, 3000); // Poll every 3 seconds
};
```

---

## 📝 Complete React Example

```jsx
import React, { useState } from 'react';

const PaymentFlow = ({ tableToken }) => {
  const [loading, setLoading] = useState(false);
  const [orderData, setOrderData] = useState(null);
  const [paymentStatus, setPaymentStatus] = useState('idle');

  // Step 1: Create Order
  const createOrder = async (items, customerInfo) => {
    setLoading(true);
    try {
      const response = await fetch('/api/orders/qr/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          table_token: tableToken,
          customer_name: customerInfo.name,
          customer_phone: customerInfo.phone,
          lines: items
        })
      });

      const result = await response.json();
      
      if (result.status === 'success') {
        setOrderData(result.data);
        initiatePayment(result.data);
      } else {
        throw new Error(result.message);
      }
    } catch (error) {
      alert('Failed to create order: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  // Step 2: Initialize Razorpay
  const initiatePayment = (data) => {
    const options = {
      key: data.razorpay_key,
      amount: Math.round(parseFloat(data.total_amount) * 100),
      currency: 'INR',
      order_id: data.razorpay_order_id,
      name: 'Our Café',
      description: `Order #${data.order_number}`,
      handler: async (response) => {
        await verifyPayment(response);
      },
      modal: {
        ondismiss: () => {
          setPaymentStatus('cancelled');
        }
      }
    };

    const razorpay = new window.Razorpay(options);
    razorpay.open();
  };

  // Step 3: Verify Payment
  const verifyPayment = async (razorpayResponse) => {
    setLoading(true);
    setPaymentStatus('verifying');
    
    try {
      const response = await fetch('/api/payments/verify/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          razorpay_order_id: razorpayResponse.razorpay_order_id,
          razorpay_payment_id: razorpayResponse.razorpay_payment_id,
          razorpay_signature: razorpayResponse.razorpay_signature
        })
      });

      const result = await response.json();
      
      if (result.status === 'success') {
        setPaymentStatus('success');
      } else {
        setPaymentStatus('failed');
      }
    } catch (error) {
      console.error('Verification error:', error);
      setPaymentStatus('error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      {paymentStatus === 'idle' && (
        <button onClick={() => createOrder(items, customerInfo)}>
          Pay Now
        </button>
      )}
      
      {loading && <p>Processing...</p>}
      
      {paymentStatus === 'success' && (
        <div className="success">
          <h2>✅ Payment Successful!</h2>
          <p>Order #{orderData?.order_number}</p>
          <p>Your order has been sent to the kitchen.</p>
        </div>
      )}
      
      {paymentStatus === 'failed' && (
        <div className="error">
          <h2>❌ Payment Failed</h2>
          <p>Please try again or contact staff.</p>
          <button onClick={() => initiatePayment(orderData)}>
            Retry Payment
          </button>
        </div>
      )}
    </div>
  );
};

export default PaymentFlow;
```

---

## 🔍 Testing Guide

### **Test Mode Credentials**

Use these Razorpay test credentials (configure in backend `.env`):

```bash
RAZORPAY_KEY_ID=rzp_test_1234567890
RAZORPAY_KEY_SECRET=your_test_secret_key
RAZORPAY_WEBHOOK_SECRET=your_webhook_secret
```

### **Test Card Details**

| Card Number         | CVV | Expiry | Result  |
|---------------------|-----|--------|---------|
| 4111 1111 1111 1111 | 123 | 12/25  | Success |
| 4012 8888 8888 1881 | 123 | 12/25  | Success |
| 5555 5555 5555 4444 | 123 | 12/25  | Success |

**Test UPI:** success@razorpay

---

## ⚠️ Error Handling

### Common Error Scenarios:

```javascript
const handleErrors = (error, context) => {
  const errorMessages = {
    'INVALID_AMOUNT': 'Order total must be greater than zero',
    'ORDER_NOT_FOUND': 'Order not found. Please try again.',
    'PAYMENT_GATEWAY_ERROR': 'Payment service error. Please contact staff.',
    'Invalid signature': 'Payment verification failed. Your payment may still be processing.',
  };

  const message = errorMessages[error.code] || 
                  errorMessages[error.message] || 
                  'An error occurred. Please contact staff.';
  
  showErrorDialog({
    title: 'Payment Error',
    message: message,
    context: context
  });
};
```

---

## 🔐 Security Best Practices

1. **Never expose secrets in frontend code**
   - `razorpay_key` (public key) is safe ✅
   - `razorpay_key_secret` stays on backend only ⚠️

2. **Always verify on backend**
   - The `/api/payments/verify/` endpoint validates signatures
   - Never trust frontend data alone

3. **Use HTTPS**
   - Razorpay requires SSL in production
   - Test webhooks using ngrok or similar

4. **Handle webhook delays**
   - Webhooks may arrive after frontend callback
   - Show "Processing..." state until webhook confirms

---

## 🎨 UI/UX Recommendations

### Payment States:

```javascript
const PaymentStates = {
  CREATING_ORDER: 'Creating your order...',
  PAYMENT_MODAL: 'Complete payment in modal',
  VERIFYING: 'Verifying payment...',
  SUCCESS: 'Payment successful! 🎉',
  FAILED: 'Payment failed. Please retry.',
  PROCESSING: 'Payment processing. Please wait...'
};
```

### Success Screen:
- ✅ Order number
- ✅ Total amount paid
- ✅ Estimated preparation time
- ✅ "Track Order" button (optional)

### Error Screen:
- ❌ Clear error message
- ❌ "Retry Payment" button
- ❌ "Contact Staff" option with table number

---

## 📱 Webhook Testing (For Backend Devs)

### Setup ngrok for local webhook testing:

```bash
# Install ngrok
ngrok http 8000

# Update Razorpay dashboard with webhook URL
# https://your-ngrok-url.ngrok.io/api/payments/webhook/razorpay/
```

### Webhook URL Configuration:
1. Go to Razorpay Dashboard → Webhooks
2. Add URL: `https://your-domain.com/api/payments/webhook/razorpay/`
3. Select events: `payment.captured`
4. Copy webhook secret to backend `.env`

---

## 🆘 Troubleshooting

### Issue: Payment succeeds but order not in kitchen

**Solution:**
- Check webhook is configured in Razorpay dashboard
- Verify webhook secret matches backend `.env`
- Check backend logs for webhook errors

### Issue: "Invalid signature" error

**Solution:**
- Ensure `razorpay_key_secret` in backend is correct
- Don't modify payment response data
- Check for timing issues (retry after a moment)

### Issue: Duplicate payments

**Solution:**
- Already handled by backend (idempotent with `transaction_id`)
- Safe to call verify endpoint multiple times

---

## 📞 Support Contacts

**Backend API Issues:** Contact backend team  
**Razorpay Integration:** [Razorpay Support](https://razorpay.com/support/)  
**Documentation:** [Razorpay Docs](https://razorpay.com/docs/)

---

## 🎯 Quick Checklist

- [ ] Load Razorpay SDK in HTML
- [ ] Call `/api/orders/qr/` to create order
- [ ] Initialize Razorpay with `razorpay_order_id`
- [ ] Handle success callback with verify endpoint
- [ ] Show appropriate success/error UI
- [ ] Test with Razorpay test cards
- [ ] Implement error handling
- [ ] Add payment retry mechanism
- [ ] Configure webhook in Razorpay dashboard (backend team)
- [ ] Test end-to-end flow

---

**Last Updated:** January 25, 2026  
**API Version:** v1  
**Integration Type:** Webhook-Driven (Recommended)
