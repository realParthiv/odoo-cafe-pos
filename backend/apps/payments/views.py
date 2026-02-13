from rest_framework import viewsets, status, permissions, views
from rest_framework.views import APIView
from rest_framework.decorators import action
from rest_framework.response import Response
from apps.core.responses import APIResponse
from .models import PaymentMethod, Payment, Receipt
from .serializers import PaymentMethodSerializer, PaymentSerializer, ReceiptSerializer
from apps.orders.models import Order
import razorpay
from django.conf import settings
import hmac
import hashlib
import logging
from decimal import Decimal
from asgiref.sync import async_to_sync
from channels.layers import get_channel_layer
from apps.orders.serializers import OrderSerializer

logger = logging.getLogger(__name__)

class PaymentMethodViewSet(viewsets.ReadOnlyModelViewSet):
    """
    GET /api/payments/methods/
    List active payment methods.
    """
    queryset = PaymentMethod.objects.filter(is_active=True)
    serializer_class = PaymentMethodSerializer
    permission_classes = [permissions.IsAuthenticated]

class PaymentViewSet(viewsets.ModelViewSet):
    queryset = Payment.objects.all()
    serializer_class = PaymentSerializer
    permission_classes = [permissions.IsAuthenticated]

    @action(detail=False, methods=['post'], url_path='process-order/(?P<order_id>[^/.]+)')
    def process_order_payments(self, request, order_id=None):
        """
        POST /api/payments/process-order/{order_id}/
        Process payment for an order.
        Request: { "payments": [ { "payment_method_id": 1, "amount": 100 } ] }
        """
        try:
            order = Order.objects.get(pk=order_id)
        except Order.DoesNotExist:
            return APIResponse.not_found("Order not found.")
            
        payments_data = request.data.get('payments', [])
        if not payments_data:
            return APIResponse.error(message="No payment data provided.")
            
        results = []
        total_paid_in_request = 0
        
        for p_data in payments_data:
            method_id = p_data.get('payment_method_id')
            amount = p_data.get('amount')
            
            try:
                method = PaymentMethod.objects.get(pk=method_id)
            except PaymentMethod.DoesNotExist:
                return APIResponse.error(message=f"Payment method {method_id} not found.")
                
            payment = Payment.objects.create(
                order=order,
                payment_method=method,
                amount=amount,
                status=Payment.Status.COMPLETED
            )
            total_paid_in_request += amount
            results.append(PaymentSerializer(payment).data)
            
        # Create receipt if fully paid
        order.refresh_from_db()
        receipt = None
        if order.status == Order.Status.COMPLETED:
            receipt, created = Receipt.objects.get_or_create(order=order)
            
        return APIResponse.success(
            data={
                'order_id': order.id,
                'total_paid': total_paid_in_request,
                'receipt_id': receipt.id if receipt else None,
                'status': order.status,
                'payments': results
            },
            message="Payment processed successfully"
        )

class ReceiptViewSet(viewsets.ReadOnlyModelViewSet):
    """
    GET /api/payments/receipts/{id}/
    """
    queryset = Receipt.objects.all()
    serializer_class = ReceiptSerializer
    permission_classes = [permissions.IsAuthenticated]


class CreateRazorpayOrderView(APIView):
    """
    POST /api/payments/create-razorpay-order/
    Create a Razorpay order for payment.
    Request: { "order_id": 123, "amount": 150.50 }
    Response: { "razorpay_order_id": "...", "razorpay_key": "...", "amount": 15050 }
    """
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        print("\n" + "="*80)
        print("🔵 CREATE RAZORPAY ORDER - DEBUGGING")
        print("="*80)
        
        # ========== STEP 1: VALIDATE REQUEST DATA ==========
        print("\n📥 STEP 1: REQUEST DATA")
        print(f"   Raw Request Data: {request.data}")
        
        order_id = request.data.get('order_id')
        amount = request.data.get('amount')
        
        print(f"   Order ID: {order_id}")
        print(f"   Amount: {amount}")
        logger.info(f"📥 Request received - order_id: {order_id}, amount: {amount}")

        if not order_id or not amount:
            print(f"   ❌ MISSING DATA: order_id={order_id}, amount={amount}")
            logger.error(f"❌ Missing required fields: order_id={order_id}, amount={amount}")
            return APIResponse.error(
                message="order_id and amount are required",
                status_code=status.HTTP_400_BAD_REQUEST
            )
        print(f"   ✅ Valid request data")

        # ========== STEP 2: FETCH ORDER ==========
        print("\n📦 STEP 2: FETCH ORDER FROM DATABASE")
        print(f"   Looking for order with id: {order_id}")
        
        try:
            order = Order.objects.get(pk=order_id)
            print(f"   ✅ Order found: {order.order_number}")
            print(f"      - Table: {order.table}")
            print(f"      - Status: {order.status}")
            print(f"      - Total Amount: {order.total_amount}")
            logger.info(f"✅ Order found: {order.order_number}")
        except Order.DoesNotExist:
            print(f"   ❌ ORDER NOT FOUND for id: {order_id}")
            logger.error(f"❌ Order not found: {order_id}")
            return APIResponse.error(
                message="Order not found",
                error_code="ORDER_NOT_FOUND",
                status_code=status.HTTP_404_NOT_FOUND
            )

        # ========== STEP 3: CHECK RAZORPAY CREDENTIALS ==========
        print("\n🔐 STEP 3: RAZORPAY CREDENTIALS")
        razorpay_key_id = settings.RAZORPAY_KEY_ID
        razorpay_key_secret = settings.RAZORPAY_KEY_SECRET
        
        print(f"   Key ID: {razorpay_key_id}")
        print(f"   Key Secret: {razorpay_key_secret[:10] if razorpay_key_secret else 'EMPTY'}***")
        
        if not razorpay_key_id or not razorpay_key_secret:
            print(f"   ❌ MISSING CREDENTIALS!")
            print(f"      Key ID Empty: {not razorpay_key_id}")
            print(f"      Key Secret Empty: {not razorpay_key_secret}")
            logger.error(f"❌ Missing Razorpay credentials!")
            return APIResponse.error(
                message="Razorpay credentials not configured",
                error_code="RAZORPAY_CONFIG_ERROR",
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
        print(f"   ✅ Credentials loaded")
        logger.info(f"✅ Razorpay credentials available")

        try:
            # ========== STEP 4: INITIALIZE RAZORPAY CLIENT ==========
            print("\n🚀 STEP 4: INITIALIZE RAZORPAY CLIENT")
            print(f"   Initializing with:")
            print(f"      - Key ID: {razorpay_key_id}")
            print(f"      - Auth tuple prepared")
            
            client = razorpay.Client(
                auth=(razorpay_key_id, razorpay_key_secret)
            )
            print(f"   ✅ Razorpay client initialized")
            logger.info(f"✅ Razorpay client initialized")

            # ========== STEP 5: PREPARE ORDER DATA ==========
            print("\n📋 STEP 5: PREPARE RAZORPAY ORDER DATA")
            amount_in_paisa = int(Decimal(str(amount)) * 100)
            print(f"   Amount: {amount} INR")
            print(f"   Amount in Paisa: {amount_in_paisa}")
            
            razorpay_order_data = {
                'amount': amount_in_paisa,
                'currency': 'INR',
                'receipt': str(order.order_number),
                'notes': {
                    'order_id': str(order.id),
                    'table_number': str(order.table.table_number if order.table else 'N/A')
                }
            }
            
            print(f"   📝 Order Data to Send:")
            print(f"      - Amount: {razorpay_order_data['amount']}")
            print(f"      - Currency: {razorpay_order_data['currency']}")
            print(f"      - Receipt: {razorpay_order_data['receipt']}")
            print(f"      - Notes: {razorpay_order_data['notes']}")
            logger.info(f"📋 Razorpay order data prepared: {razorpay_order_data}")

            # ========== STEP 6: CREATE RAZORPAY ORDER ==========
            print("\n🌐 STEP 6: CALL RAZORPAY API")
            print(f"   Sending request to Razorpay...")
            
            razorpay_order = client.order.create(data=razorpay_order_data)
            
            print(f"   ✅ RAZORPAY RESPONSE RECEIVED:")
            print(f"      - Order ID: {razorpay_order.get('id')}")
            print(f"      - Amount: {razorpay_order.get('amount')}")
            print(f"      - Currency: {razorpay_order.get('currency')}")
            print(f"      - Receipt: {razorpay_order.get('receipt')}")
            print(f"      - Status: {razorpay_order.get('status')}")
            print(f"      - Full Response: {razorpay_order}")
            logger.info(f"✅ Razorpay order created successfully: {razorpay_order.get('id')}")
            
            # ========== STEP 7: SAVE ORDER ID ==========
            print("\n💾 STEP 7: SAVE RAZORPAY ORDER ID TO DATABASE")
            order.razorpay_order_id = razorpay_order['id']
            order.save(update_fields=['razorpay_order_id'])
            print(f"   ✅ Saved to database")
            logger.info(f"💾 Razorpay order ID saved: {razorpay_order['id']}")

            # ========== STEP 8: RETURN SUCCESS ==========
            print("\n✅ STEP 8: RETURN SUCCESS RESPONSE")
            response_data = {
                'razorpay_order_id': razorpay_order['id'],
                'razorpay_key': razorpay_key_id,
                'amount': amount_in_paisa,
                'currency': 'INR',
                'order_number': order.order_number
            }
            print(f"   Response: {response_data}")
            print("="*80 + "\n")
            logger.info(f"✅ Success response prepared")

            return APIResponse.success(
                data=response_data,
                message="Razorpay order created successfully"
            )

        except razorpay.errors.BadRequestError as e:
            print(f"\n❌ RAZORPAY BAD REQUEST ERROR")
            print(f"   Error: {str(e)}")
            print(f"   Error Type: {type(e)}")
            print(f"   Full Error: {e}")
            print("="*80 + "\n")
            logger.error(f"❌ Razorpay BadRequestError: {str(e)}", exc_info=True)
            return APIResponse.error(
                message="Invalid request to Razorpay - Check credentials",
                error_code="RAZORPAY_BAD_REQUEST",
                status_code=status.HTTP_400_BAD_REQUEST
            )
        except razorpay.errors.ServerError as e:
            print(f"\n❌ RAZORPAY SERVER ERROR")
            print(f"   Error: {str(e)}")
            print(f"   Error Type: {type(e)}")
            print(f"   Full Error: {e}")
            print("="*80 + "\n")
            logger.error(f"❌ Razorpay ServerError: {str(e)}", exc_info=True)
            return APIResponse.error(
                message="Razorpay server error",
                error_code="RAZORPAY_SERVER_ERROR",
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
        except Exception as e:
            print(f"\n❌ UNEXPECTED ERROR")
            print(f"   Error: {str(e)}")
            print(f"   Error Type: {type(e)}")
            print(f"   Error Details:")
            import traceback
            traceback.print_exc()
            print("="*80 + "\n")
            logger.error(f"❌ Unexpected error: {str(e)}", exc_info=True)
            return APIResponse.error(
                message="Failed to create Razorpay order",
                error_code="RAZORPAY_ERROR",
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
            logger.error(f"Razorpay order creation failed: {str(e)}", exc_info=True)
            return APIResponse.error(
                message="Failed to create Razorpay order",
                error_code="RAZORPAY_ERROR",
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


class VerifyPaymentView(APIView):
    """
    POST /api/payments/verify/
    Verify Razorpay payment signature and create payment record.
    
    Frontend-driven payment flow (no webhooks):
    1. Frontend creates order
    2. Frontend creates Razorpay order via CreateRazorpayOrderView
    3. User completes payment in Razorpay checkout
    4. Frontend calls this endpoint to verify signature
    5. This endpoint verifies signature, creates Payment record, updates order status
    """
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        razorpay_order_id = request.data.get('razorpay_order_id')
        razorpay_payment_id = request.data.get('razorpay_payment_id')
        razorpay_signature = request.data.get('razorpay_signature')

        if not all([razorpay_order_id, razorpay_payment_id, razorpay_signature]):
            logger.warning("Payment verification: Missing required parameters")
            return Response({
                "error": "Missing parameters",
                "details": "razorpay_order_id, razorpay_payment_id, and razorpay_signature are required"
            }, status=status.HTTP_400_BAD_REQUEST)

        # 1. Verify Signature
        msg = f"{razorpay_order_id}|{razorpay_payment_id}"
        secret = getattr(settings, 'RAZORPAY_KEY_SECRET', '')

        try:
            expected_signature = hmac.new(
                key=secret.encode(),
                msg=msg.encode(),
                digestmod=hashlib.sha256
            ).hexdigest()

            if not hmac.compare_digest(expected_signature, razorpay_signature):
                logger.warning(f"Payment verification: Invalid signature for order {razorpay_order_id}")
                return Response({
                    "error": "Invalid signature",
                    "message": "Payment verification failed"
                }, status=status.HTTP_400_BAD_REQUEST)
        except Exception as e:
            logger.error(f"Payment verification: Signature check error - {str(e)}")
            return Response({
                "error": "Verification error",
                "details": str(e)
            }, status=status.HTTP_400_BAD_REQUEST)

        # 2. Find Order and Create Payment
        try:
            order = Order.objects.get(razorpay_order_id=razorpay_order_id)
            
            # Idempotency check
            existing_payment = Payment.objects.filter(transaction_id=razorpay_payment_id).first()
            if existing_payment:
                logger.info(f"Payment {razorpay_payment_id} already processed")
                return APIResponse.success(
                    data={
                        'order': OrderSerializer(order).data,
                        'payment_verified': True,
                        'message': 'Payment already processed'
                    },
                    message="Payment already verified"
                )
            
            # Get or create Razorpay payment method
            payment_method, _ = PaymentMethod.objects.get_or_create(
                code='razorpay',
                defaults={
                    'name': 'Razorpay Online',
                    'type': PaymentMethod.MethodType.DIGITAL,
                    'is_active': True
                }
            )

            # Fetch payment details from Razorpay to get actual amount
            try:
                client = razorpay.Client(
                    auth=(settings.RAZORPAY_KEY_ID, settings.RAZORPAY_KEY_SECRET)
                )
                payment_details = client.payment.fetch(razorpay_payment_id)
                amount_paid = Decimal(payment_details.get('amount', 0)) / 100  # Convert from paisa
            except Exception as fetch_error:
                logger.warning(f"Could not fetch payment details from Razorpay: {fetch_error}")
                # Fallback to order total
                amount_paid = order.total_amount

            # Create Payment record
            payment = Payment.objects.create(
                order=order,
                payment_method=payment_method,
                amount=amount_paid,
                transaction_id=razorpay_payment_id,
                status=Payment.Status.COMPLETED
            )
            
            # Store payment metadata in order
            order.razorpay_payment_id = razorpay_payment_id
            order.razorpay_signature = razorpay_signature
            
            # Mark table as OCCUPIED after payment is successful
            if order.table:
                from apps.tables.models import Table
                order.table.status = Table.Status.OCCUPIED
                order.table.save()
            
            # Update order status to SENT_TO_KITCHEN if still in DRAFT
            if order.status == Order.Status.DRAFT:
                order.status = Order.Status.SENT_TO_KITCHEN
                
            order.save(update_fields=['razorpay_payment_id', 'razorpay_signature', 'status'])
            
            logger.info(f"Payment verified and created for order {order.order_number}: ₹{amount_paid}")
            
            # Broadcast to Kitchen WebSocket
            try:
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
                logger.info(f"Order {order.order_number} sent to kitchen")
            except Exception as ws_error:
                logger.error(f"Failed to send WebSocket notification: {str(ws_error)}")
            
            return APIResponse.success(
                data={
                    'order': OrderSerializer(order).data,
                    'payment': PaymentSerializer(payment).data,
                    'payment_verified': True,
                    'message': 'Payment verified successfully and order sent to kitchen'
                },
                message="Payment processed successfully"
            )
            
        except Order.DoesNotExist:
            logger.error(f"Payment verification: Order not found for razorpay_order_id={razorpay_order_id}")
            return APIResponse.error(
                message="Order not found",
                error_code="ORDER_NOT_FOUND",
                status_code=status.HTTP_404_NOT_FOUND
            )
        except Exception as e:
            logger.error(f"Payment verification: Unexpected error - {str(e)}", exc_info=True)
            return Response({
                "error": "Server error",
                "details": str(e)
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
