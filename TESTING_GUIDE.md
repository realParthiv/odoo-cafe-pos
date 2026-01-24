# Payment Flow Testing Guide

## Quick Start Testing

### 1. Backend Setup
```bash
cd backend

# Ensure migrations are applied
python manage.py makemigrations payments
python manage.py migrate

# Verify Razorpay credentials
python manage.py shell
>>> from django.conf import settings
>>> print(f"Key ID: {settings.RAZORPAY_KEY_ID}")
>>> print(f"Secret: {settings.RAZORPAY_KEY_SECRET[:10]}...")
>>> exit()

# Start backend server
python manage.py runserver
```

### 2. Frontend Setup
```bash
cd frontend

# Install dependencies (if needed)
npm install

# Start frontend dev server
npm run dev
```

### 3. Load Razorpay SDK
Ensure `index.html` includes Razorpay SDK:
```html
<script src="https://checkout.razorpay.com/v1/checkout.js"></script>
```

## Step-by-Step Testing

### Test 1: Successful Payment Flow
1. **Login as Cashier**
2. **Select a Table** from Tables view
3. **Add Products to Cart**
   - Click on products to add them
   - Adjust quantities if needed
4. **Click "Payment" Button**
   - ✅ Order should be created
   - ✅ Razorpay checkout should open
5. **Complete Test Payment**
   - Use test card: `4111 1111 1111 1111`
   - CVV: Any 3 digits
   - Expiry: Any future date
   - Or use UPI: `success@razorpay`
6. **Verify Success**
   - ✅ Success message: "Payment Successful! Order sent to kitchen."
   - ✅ Cart should clear
   - ✅ Kitchen should receive order (check Kitchen page)

**Expected Console Output (Backend):**
```
Razorpay order created: order_NXxxxxxxxxxxxx for order ORD-2026-001
Payment verified and created for order ORD-2026-001: ₹150.50
Order ORD-2026-001 sent to kitchen
```

### Test 2: Payment Cancellation
1. Add items to cart
2. Click "Payment" button
3. **Close Razorpay modal** (click X or press Escape)
4. ✅ Should show: "Payment cancelled. Order is still in draft mode."
5. ✅ Cart should still have items
6. ✅ Order should exist in database but status = DRAFT

### Test 3: Idempotency (Duplicate Prevention)
1. Complete a payment successfully
2. In browser console, call verify endpoint again with same payment_id:
   ```javascript
   fetch('/api/payments/verify/', {
     method: 'POST',
     headers: {
       'Content-Type': 'application/json',
     },
     body: JSON.stringify({
       razorpay_order_id: 'order_xxx',
       razorpay_payment_id: 'pay_xxx',
       razorpay_signature: 'signature_xxx'
     })
   })
   ```
3. ✅ Should return "already_processed" status
4. ✅ Should NOT create duplicate Payment record

### Test 4: Invalid Signature
1. Start payment flow
2. In browser console, intercept Razorpay response:
   ```javascript
   // Replace handler temporarily
   const originalHandler = options.handler;
   options.handler = async (response) => {
     // Tamper with signature
     response.razorpay_signature = 'invalid_signature';
     await originalHandler(response);
   };
   ```
3. ✅ Should show error: "Payment verification failed"
4. ✅ Payment record should NOT be created

## API Testing with Postman/cURL

### 1. Create Order
```bash
curl -X POST http://localhost:8000/api/orders/ \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "table": 1,
    "order_type": "dine_in"
  }'
```

### 2. Add Order Lines
```bash
curl -X POST http://localhost:8000/api/orders/1/lines/ \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "product": 1,
    "quantity": 2,
    "unit_price": 50.00
  }'
```

### 3. Create Razorpay Order
```bash
curl -X POST http://localhost:8000/api/payments/create-razorpay-order/ \
  -H "Content-Type: application/json" \
  -d '{
    "order_id": 1,
    "amount": 150.50
  }'
```

**Expected Response:**
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

### 4. Verify Payment (Manual)
**Note:** Normally this is called by frontend after Razorpay checkout

```bash
curl -X POST http://localhost:8000/api/payments/verify/ \
  -H "Content-Type: application/json" \
  -d '{
    "razorpay_order_id": "order_NXxxxxxxxxxxxx",
    "razorpay_payment_id": "pay_NXxxxxxxxxxxxx",
    "razorpay_signature": "generated_signature_from_razorpay"
  }'
```

## Database Verification

### Check Order Status
```sql
-- Open Django shell
python manage.py dbshell

-- Check order
SELECT id, order_number, status, razorpay_order_id, razorpay_payment_id 
FROM orders_order 
WHERE id = 1;

-- Check payment
SELECT id, order_id, amount, transaction_id, status 
FROM payments_payment 
WHERE order_id = 1;

-- Check payment method
SELECT id, name, code 
FROM payments_paymentmethod 
WHERE code = 'razorpay';
```

## Common Issues & Solutions

### Issue 1: Razorpay checkout not opening
**Symptoms:**
- Payment button does nothing
- Console error: "Razorpay is not defined"

**Solution:**
```html
<!-- Ensure this is in index.html -->
<script src="https://checkout.razorpay.com/v1/checkout.js"></script>
```

### Issue 2: "Authentication failed" error
**Symptoms:**
- Backend logs: "Razorpay BadRequestError: Authentication failed"

**Solution:**
1. Check `.env` file has correct credentials
2. Restart Django server after changing `.env`
3. Verify credentials in Django shell:
   ```python
   from django.conf import settings
   print(settings.RAZORPAY_KEY_ID)
   print(settings.RAZORPAY_KEY_SECRET)
   ```

### Issue 3: Payment verified but not in kitchen
**Symptoms:**
- Payment successful
- Kitchen page shows no order

**Solution:**
1. Check WebSocket connection (Kitchen page console)
2. Ensure Redis is running (for Django Channels)
3. Check Daphne/ASGI server is running (not just runserver)

### Issue 4: Duplicate payment error
**Symptoms:**
- Second payment fails with "transaction_id already exists"

**Solution:**
- Expected behavior! This is idempotency protection
- Check if `transaction_id` field has `unique=True` constraint

### Issue 5: Amount mismatch
**Symptoms:**
- Order total: ₹150.50
- Payment amount: ₹0.00 or wrong value

**Solution:**
1. Check `calculate_totals()` in Order model
2. Verify `Decimal` type usage (not float)
3. Check Razorpay amount conversion (paisa to rupees: amount / 100)

## Performance Testing

### Test with Multiple Concurrent Payments
```bash
# Use Apache Bench or similar tool
ab -n 100 -c 10 -p payment_data.json -T application/json \
  http://localhost:8000/api/payments/verify/
```

**Expected:**
- All requests should complete successfully
- No duplicate payments should be created
- Database should maintain integrity

## Security Testing

### Test 1: Signature Tampering
Modify `razorpay_signature` in verify request → Should fail

### Test 2: Amount Tampering
Change amount in frontend → Backend should fetch from Razorpay API, not trust frontend

### Test 3: Replay Attack
Send same payment verification multiple times → Should be idempotent

## Load Testing

### Simulate 100 Orders
```python
# Django shell
from apps.orders.models import Order
from apps.tables.models import Table
from apps.menu.models import Product

table = Table.objects.first()
product = Product.objects.first()

for i in range(100):
    order = Order.objects.create(
        table=table,
        order_type='dine_in',
        status='draft'
    )
    # Add lines, create payments, etc.
```

## Monitoring

### Check Logs
```bash
# Backend logs
tail -f backend/logs/debug.log

# Django runserver output
# Watch for:
# - "Razorpay order created: ..."
# - "Payment verified and created for order ..."
# - "Order ... sent to kitchen"
```

### Check Database Queries
```python
# Django shell
from django.db import connection
from django.test.utils import override_settings

with override_settings(DEBUG=True):
    # Run payment flow
    # Then check queries
    print(len(connection.queries))
    for query in connection.queries:
        print(query['sql'])
```

## Success Criteria

✅ **All tests pass**
✅ **No duplicate payments created**
✅ **Signature verification works correctly**
✅ **Kitchen receives orders immediately**
✅ **Cart clears after payment**
✅ **Order status updates correctly**
✅ **No console errors**
✅ **WebSocket notifications work**
✅ **Payment records have correct amounts**
✅ **Idempotency protection works**

## Test Razorpay Cards

### Success Scenarios
- **Card:** `4111 1111 1111 1111` (Visa)
- **Card:** `5555 5555 5555 4444` (Mastercard)
- **UPI:** `success@razorpay`

### Failure Scenarios
- **Card:** `4000 0000 0000 0002` (Card declined)
- **UPI:** `failure@razorpay`

### OTP Scenarios
- Enter any OTP for test mode

---

**Pro Tip:** Use browser DevTools Network tab to inspect all API calls during payment flow!
