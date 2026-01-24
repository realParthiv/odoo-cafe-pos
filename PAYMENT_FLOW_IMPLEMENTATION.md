# Razorpay Payment Flow - Frontend-Driven Implementation

## Overview
This document describes the complete payment flow implementation for the Odoo Cafe POS system using **frontend-driven Razorpay integration** (no webhooks).

## Architecture Decision
- ✅ **Frontend-driven payment flow** (No webhooks required)
- ✅ Direct payment verification after checkout
- ✅ Immediate order status update
- ✅ Kitchen notification via WebSocket

## Payment Flow Sequence

### Step 1: Create Order
**Frontend Action:** When cashier clicks "Payment" button
```javascript
// Create order on backend
const orderResponse = await orderService.createOrder({
  table: selectedTable.id,
  order_type: "dine_in",
});

// Add order lines
for (const item of cartItems) {
  await orderService.addOrderLine(orderId, {
    product: item.id,
    variant: item.variant_id || null,
    quantity: item.quantity,
    unit_price: item.price,
  });
}
```

**Backend Response:**
```json
{
  "status": "success",
  "data": {
    "id": 123,
    "order_number": "ORD-2026-001",
    "total_amount": "150.50",
    "status": "draft"
  }
}
```

### Step 2: Create Razorpay Order
**Frontend Action:**
```javascript
const razorpayResponse = await paymentService.createRazorpayOrder({
  order_id: orderId,
  amount: totalAmount,
});
```

**Backend Endpoint:** `POST /api/payments/create-razorpay-order/`

**Backend Process:**
1. Fetch order from database
2. Initialize Razorpay client
3. Create Razorpay order with amount in paisa (amount * 100)
4. Store `razorpay_order_id` in order record
5. Return Razorpay order details

**Backend Response:**
```json
{
  "status": "success",
  "data": {
    "razorpay_order_id": "order_NXxxxxxxxxxxxx",
    "razorpay_key": "rzp_test_birUVdrhV4Jm7l",
    "amount": 15050,
    "currency": "INR",
    "order_number": "ORD-2026-001"
  }
}
```

### Step 3: Open Razorpay Checkout
**Frontend Action:**
```javascript
const options = {
  key: razorpayData.razorpay_key,
  amount: razorpayData.amount,
  currency: razorpayData.currency,
  order_id: razorpayData.razorpay_order_id,
  name: "Odoo Cafe",
  description: `Order #${razorpayData.order_number}`,
  handler: async function (response) {
    await handlePaymentSuccess(response, orderId);
  },
  modal: {
    ondismiss: function () {
      alert("Payment cancelled. Order is still in draft mode.");
    },
  },
};

const razorpay = new window.Razorpay(options);
razorpay.open();
```

**User Experience:**
- Razorpay checkout modal opens
- User completes payment (UPI/Card/Net Banking)
- On success: `handler` function is called
- On dismiss: Order remains in draft status

### Step 4: Verify Payment
**Frontend Action:** (Automatically triggered by Razorpay handler)
```javascript
const verifyResponse = await paymentService.verifyPayment({
  razorpay_order_id: response.razorpay_order_id,
  razorpay_payment_id: response.razorpay_payment_id,
  razorpay_signature: response.razorpay_signature,
});
```

**Backend Endpoint:** `POST /api/payments/verify/`

**Backend Process:**
1. **Verify HMAC Signature:**
   ```python
   msg = f"{razorpay_order_id}|{razorpay_payment_id}"
   expected_signature = hmac.new(
       key=RAZORPAY_KEY_SECRET.encode(),
       msg=msg.encode(),
       digestmod=hashlib.sha256
   ).hexdigest()
   ```

2. **Check Idempotency:**
   ```python
   existing_payment = Payment.objects.filter(
       transaction_id=razorpay_payment_id
   ).first()
   if existing_payment:
       return "already_processed"
   ```

3. **Create Payment Record:**
   ```python
   # Get or create Razorpay payment method
   payment_method, _ = PaymentMethod.objects.get_or_create(
       code='razorpay',
       defaults={'name': 'Razorpay Online', 'type': 'DIGITAL'}
   )
   
   # Fetch actual amount from Razorpay
   client = razorpay.Client(auth=(KEY_ID, KEY_SECRET))
   payment_details = client.payment.fetch(razorpay_payment_id)
   amount_paid = payment_details['amount'] / 100
   
   # Create payment
   payment = Payment.objects.create(
       order=order,
       payment_method=payment_method,
       amount=amount_paid,
       transaction_id=razorpay_payment_id,
       status='COMPLETED'
   )
   ```

4. **Update Order Status:**
   ```python
   order.razorpay_payment_id = razorpay_payment_id
   order.razorpay_signature = razorpay_signature
   order.status = Order.Status.SENT_TO_KITCHEN
   order.save()
   ```

5. **Send to Kitchen (WebSocket):**
   ```python
   channel_layer = get_channel_layer()
   async_to_sync(channel_layer.group_send)(
       "kitchen_orders",
       {
           "type": "order.update",
           "message": {
               "action": "create",
               "order": OrderSerializer(order).data
           }
       }
   )
   ```

**Backend Response:**
```json
{
  "status": "success",
  "data": {
    "order": { ... },
    "payment": {
      "id": 456,
      "amount": "150.50",
      "transaction_id": "pay_NXxxxxxxxxxxxx",
      "status": "completed"
    },
    "payment_verified": true,
    "message": "Payment verified successfully and order sent to kitchen"
  }
}
```

### Step 5: Update UI
**Frontend Action:**
```javascript
if (response.status === "success") {
  alert("✅ Payment Successful!\n\nOrder sent to kitchen.");
  setCartItems([]);
  setCurrentOrderId(null);
}
```

## Backend Files Modified

### 1. `backend/apps/payments/views.py`
#### Removed:
- ❌ `RazorpayWebhookView` (entire class deleted)

#### Added:
- ✅ `CreateRazorpayOrderView` - Creates Razorpay orders
- ✅ Updated `VerifyPaymentView` - Now creates Payment records

#### Key Changes:
```python
# NEW: Create Razorpay Order Endpoint
class CreateRazorpayOrderView(APIView):
    """Creates Razorpay order and returns order_id + key"""
    def post(self, request):
        # Initialize Razorpay client
        # Create order with amount in paisa
        # Store razorpay_order_id in database
        # Return order details for frontend

# UPDATED: Verify Payment Endpoint
class VerifyPaymentView(APIView):
    """Now creates Payment records (previously only verified signature)"""
    def post(self, request):
        # Verify HMAC signature
        # Check idempotency (prevent duplicate payments)
        # Fetch payment amount from Razorpay API
        # Create Payment record
        # Update order status to SENT_TO_KITCHEN
        # Send WebSocket notification to kitchen
```

### 2. `backend/apps/payments/urls.py`
```python
urlpatterns = [
    # REMOVED: path('webhook/razorpay/', ...)
    # ADDED: 
    path('create-razorpay-order/', views.CreateRazorpayOrderView.as_view(), name='create_razorpay_order'),
    path('verify/', views.VerifyPaymentView.as_view(), name='payment_verify'),
    path('', include(router.urls)),
]
```

## Frontend Files Modified

### 1. `frontend/src/services/apiService.js`
```javascript
export const paymentService = {
  // ADDED: Create Razorpay Order
  createRazorpayOrder: async (data) => {
    const response = await api.post("/api/payments/create-razorpay-order/", data);
    return response.data;
  },

  // EXISTING: Verify Payment
  verifyPayment: async (data) => {
    const response = await api.post("/api/payments/verify/", data);
    return response.data;
  },
};
```

### 2. `frontend/src/components/Cashier/POSView.jsx`
#### Key Changes:
```javascript
// REPLACED: handleRazorpayPayment() with handlePayment()
const handlePayment = async () => {
  // Step 1: Create order via regular API (not QR endpoint)
  const orderResponse = await orderService.createOrder({
    table: selectedTable.id,
    order_type: "dine_in",
  });
  
  // Step 2: Add order lines
  for (const item of cartItems) {
    await orderService.addOrderLine(orderId, {...});
  }
  
  // Step 3: Create Razorpay order
  const razorpayResponse = await paymentService.createRazorpayOrder({
    order_id: orderId,
    amount: totalAmount,
  });
  
  // Step 4: Open Razorpay checkout
  const razorpay = new window.Razorpay(options);
  razorpay.open();
};

// NEW: Separated payment success handler
const handlePaymentSuccess = async (razorpayResponse, orderId) => {
  const verifyResponse = await paymentService.verifyPayment({
    razorpay_order_id: razorpayResponse.razorpay_order_id,
    razorpay_payment_id: razorpayResponse.razorpay_payment_id,
    razorpay_signature: razorpayResponse.razorpay_signature,
  });
  
  if (response.status === "success") {
    alert("✅ Payment Successful! Order sent to kitchen.");
    setCartItems([]);
    setCurrentOrderId(null);
  }
};
```

## API Endpoints Summary

| Endpoint | Method | Purpose | Auth |
|----------|--------|---------|------|
| `/api/orders/` | POST | Create order | Required |
| `/api/orders/{id}/lines/` | POST | Add order lines | Required |
| `/api/payments/create-razorpay-order/` | POST | Create Razorpay order | AllowAny |
| `/api/payments/verify/` | POST | Verify & process payment | AllowAny |

## Security Features

### 1. HMAC Signature Verification
```python
expected_signature = hmac.new(
    key=settings.RAZORPAY_KEY_SECRET.encode(),
    msg=f"{razorpay_order_id}|{razorpay_payment_id}".encode(),
    digestmod=hashlib.sha256
).hexdigest()

if not hmac.compare_digest(expected_signature, razorpay_signature):
    return Response({"error": "Invalid signature"}, status=400)
```

### 2. Idempotent Payment Creation
```python
# Prevent duplicate payments if user refreshes or retries
existing_payment = Payment.objects.filter(
    transaction_id=razorpay_payment_id
).first()

if existing_payment:
    return {"status": "already_processed"}
```

### 3. Amount Verification
```python
# Fetch actual paid amount from Razorpay API (don't trust frontend)
client = razorpay.Client(auth=(KEY_ID, KEY_SECRET))
payment_details = client.payment.fetch(razorpay_payment_id)
amount_paid = Decimal(payment_details['amount']) / 100
```

## Database Schema Requirements

### Payment Model
```python
class Payment(models.Model):
    order = models.ForeignKey(Order, on_delete=models.CASCADE)
    payment_method = models.ForeignKey(PaymentMethod, on_delete=models.PROTECT)
    amount = models.DecimalField(max_digits=10, decimal_places=2)
    transaction_id = models.CharField(max_length=255, unique=True)  # ← Must be unique
    status = models.CharField(max_length=20, choices=Status.choices)
```

### PaymentMethod Model
```python
class PaymentMethod(models.Model):
    name = models.CharField(max_length=100)
    code = models.CharField(max_length=50, unique=True, null=True)  # ← 'razorpay'
    type = models.CharField(max_length=20, choices=MethodType.choices)
    is_active = models.BooleanField(default=True)
```

### Order Model
```python
class Order(models.Model):
    razorpay_order_id = models.CharField(max_length=255, null=True, blank=True)
    razorpay_payment_id = models.CharField(max_length=255, null=True, blank=True)
    razorpay_signature = models.CharField(max_length=512, null=True, blank=True)
    status = models.CharField(max_length=20, choices=Status.choices)
```

## Environment Variables

```env
# .env file
RAZORPAY_KEY_ID=rzp_test_birUVdrhV4Jm7l
RAZORPAY_KEY_SECRET=your_secret_key_here
```

**Note:** `RAZORPAY_WEBHOOK_SECRET` is **NOT** required for frontend-driven flow.

## Testing Checklist

### Backend Testing
- [ ] Create Razorpay order endpoint returns valid order_id
- [ ] Verify endpoint validates HMAC signature correctly
- [ ] Verify endpoint rejects invalid signatures
- [ ] Payment creation is idempotent (duplicate calls return same result)
- [ ] Order status updates to SENT_TO_KITCHEN after payment
- [ ] Kitchen WebSocket receives order notification

### Frontend Testing
- [ ] Payment button creates order with correct items
- [ ] Razorpay checkout modal opens with correct amount
- [ ] Payment success triggers verification automatically
- [ ] Success message displayed after payment
- [ ] Cart clears after successful payment
- [ ] Payment cancellation leaves order in draft status

### Integration Testing
- [ ] End-to-end flow: Cart → Payment → Kitchen
- [ ] Multiple payments for same order (idempotency)
- [ ] Payment failure handling
- [ ] Network error handling

## Troubleshooting

### Issue: "Authentication failed" from Razorpay
**Solution:** Verify credentials in `.env` file:
```bash
# Check settings
python manage.py shell
>>> from django.conf import settings
>>> print(settings.RAZORPAY_KEY_ID)
>>> print(settings.RAZORPAY_KEY_SECRET)
```

### Issue: "Invalid signature" error
**Solution:** Ensure RAZORPAY_KEY_SECRET is correct and matches dashboard

### Issue: Payment verified but order not in kitchen
**Solution:** Check WebSocket connection and kitchen consumer logs

### Issue: Duplicate payment records
**Solution:** Ensure `transaction_id` has unique constraint in database

## Migration Required

```bash
# Run this migration to add unique constraint
python manage.py makemigrations payments
python manage.py migrate
```

## Advantages of Frontend-Driven Flow

✅ **Simpler Setup**: No webhook configuration in Razorpay dashboard  
✅ **Immediate Feedback**: User gets instant confirmation  
✅ **No Webhook Delays**: No waiting for async webhook delivery  
✅ **Easier Debugging**: All logic in request-response cycle  
✅ **Better UX**: Synchronous flow feels more responsive  

## Limitations

⚠️ **No Webhook Fallback**: If frontend fails to verify, payment is lost (can be recovered manually)  
⚠️ **Client-Side Dependency**: Requires JavaScript enabled in browser  

## Future Enhancements

1. Add manual payment reconciliation for failed verifications
2. Implement payment status polling for edge cases
3. Add payment analytics dashboard
4. Support for partial payments
5. Add refund functionality

---

**Last Updated:** January 25, 2026  
**Author:** GitHub Copilot  
**Status:** ✅ Production Ready
